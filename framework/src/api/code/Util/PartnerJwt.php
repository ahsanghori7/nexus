<?php

namespace Api\Util;

class PartnerJwt
{
    const ALGORITHM = "RS256";

    /**
     * @param array $claims
     * @param string $privateKeyPem
     * @return string
     */
    public static function encode(array $claims, string $privateKeyPem): string
    {
        $header = ["typ" => "JWT", "alg" => self::ALGORITHM];

        $segments = [
            self::base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES)),
            self::base64UrlEncode(json_encode($claims, JSON_UNESCAPED_SLASHES)),
        ];
        $signingInput = implode(".", $segments);

        $signature = "";
        $signed = openssl_sign($signingInput, $signature, $privateKeyPem, OPENSSL_ALGO_SHA256);
        if (!$signed) {
            throw new \RuntimeException("Unable to sign partner token");
        }

        $segments[] = self::base64UrlEncode($signature);

        return implode(".", $segments);
    }

    /**
     * @param string $jwt
     * @param string $publicKeyPem
     * @param array $options
     * @return array
     * @throws \UnexpectedValueException
     */
    public static function decode(string $jwt, string $publicKeyPem, array $options = []): array
    {
        $parts = explode(".", $jwt);
        if (count($parts) !== 3) {
            throw new \UnexpectedValueException("Malformed token");
        }
        [$headerB64, $payloadB64, $signatureB64] = $parts;

        $header = json_decode(self::base64UrlDecode($headerB64), true);
        $payload = json_decode(self::base64UrlDecode($payloadB64), true);
        $signature = self::base64UrlDecode($signatureB64);

        if (!is_array($header) || ($header["alg"] ?? null) !== self::ALGORITHM) {
            throw new \UnexpectedValueException("Unsupported token algorithm");
        }
        if (!is_array($payload)) {
            throw new \UnexpectedValueException("Malformed token payload");
        }

        $signingInput = $headerB64 . "." . $payloadB64;
        if (openssl_verify($signingInput, $signature, $publicKeyPem, OPENSSL_ALGO_SHA256) !== 1) {
            throw new \UnexpectedValueException("Invalid token signature");
        }

        $leeway = (int) ($options["leeway"] ?? 0);
        $now = time();

        if (isset($payload["nbf"]) && $payload["nbf"] > ($now + $leeway)) {
            throw new \UnexpectedValueException("Token not yet valid");
        }
        if (isset($payload["exp"]) && ($now - $leeway) >= $payload["exp"]) {
            throw new \UnexpectedValueException("Token has expired");
        }
        if (isset($options["issuer"]) && ($payload["iss"] ?? null) !== $options["issuer"]) {
            throw new \UnexpectedValueException("Invalid token issuer");
        }
        if (isset($options["audience"])) {
            $aud = $payload["aud"] ?? null;
            $audienceOk = is_array($aud)
                ? in_array($options["audience"], $aud, true)
                : ($aud === $options["audience"]);
            if (!$audienceOk) {
                throw new \UnexpectedValueException("Invalid token audience");
            }
        }

        return $payload;
    }

    /**
     * @param string $data
     * @return string
     */
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), "+/", "-_"), "=");
    }

    /**
     * @param string $data
     * @return string
     */
    private static function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat("=", 4 - $remainder);
        }
        $decoded = base64_decode(strtr($data, "-_", "+/"), true);

        return $decoded === false ? "" : $decoded;
    }
}
