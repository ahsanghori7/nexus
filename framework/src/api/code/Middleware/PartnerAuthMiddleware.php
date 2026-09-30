<?php

namespace Api\Middleware;

use Api\Util\PartnerAudit;
use Api\Util\PartnerJwt;
use Api\Util\PartnerKeyProvider;
use Core\Config;
use Core\Middleware\Exception as MiddlewareException;
use Core\Router\Route\Action;
use Core\Service\Manager;
use Core\Data\Shape;
use Core\Util\StructuredLogger;

class PartnerAuthMiddleware
{
    const ALLOWED_FIELDS = ["grant_type", "client_id", "client_secret"];
    const GRANT_TYPE = "client_credentials";
    const LOG_PREFIX = "PARTNER";
    const ENDPOINT = "/api/partner/v1/oauth/token";
    const ISSUER = "c-link";
    const AUDIENCE = "c-link-partner-api";

    /**
     * @return callable
     */
    public static function issue(): callable
    {
        return function (Action $action) {
            $body = $action->getRoute()->getRequest()->getJson()->toArray();

            self::rejectUnknownFields($body);
            self::assertRequired($body);
            self::assertGrantType((string) ($body["grant_type"] ?? ""));

            $client = self::authenticate(
                (string) $body["client_id"],
                (string) $body["client_secret"]
            );

            $ttl = (int) ($client["token_ttl_seconds"] ?? 0);
            if ($ttl <= 0) {
                $ttl = (int) Config::get("partner.jwt.ttl_default", 1800);
            }

            $scope = implode(" ", (array) ($client["scopes"] ?? []));
            $jti = self::uuid4();
            $now = time();

            $claims = [
                "iss" => self::ISSUER,
                "aud" => self::AUDIENCE,
                "sub" => (string) $body["client_id"],
                "cid" => (int) $client["id"],
                "acc" => (int) ($client["account_id"] ?? 0),
                "scope" => $scope,
                "iat" => $now,
                "nbf" => $now,
                "exp" => $now + $ttl,
                "jti" => $jti,
            ];

            try {
                $accessToken = PartnerJwt::encode($claims, PartnerKeyProvider::privateKey());
            } catch (\Throwable $e) {
                StructuredLogger::log(self::LOG_PREFIX, "ERROR", "oauth/token", "token signing failed", [
                    "cid" => $claims["cid"],
                ]);
                throw new MiddlewareException("internal_error", "");
            }

            PartnerAudit::record((int) $client["id"], [
                "jti" => $jti,
                "method" => "POST",
                "endpoint" => self::ENDPOINT,
                "request_snapshot" => ["grant_type" => self::GRANT_TYPE],
                "response_code" => 200,
            ]);

            StructuredLogger::log(self::LOG_PREFIX, "INFO", "oauth/token", "access token issued", [
                "cid" => $claims["cid"],
                "jti" => $jti,
                "expires_in" => $ttl,
            ]);

            $action->set("json", json_encode([
                "access_token" => $accessToken,
                "token_type" => "Bearer",
                "expires_in" => $ttl,
                "scope" => $scope,
            ]));
        };
    }

    /**
     * @param array $body
     * @return void
     * @throws MiddlewareException
     */
    private static function rejectUnknownFields(array $body): void
    {
        foreach (array_keys($body) as $field) {
            if (!in_array($field, self::ALLOWED_FIELDS, true)) {
                throw self::validationError((string) $field, "unknown_field", "The {$field} field is not permitted");
            }
        }
    }

    /**
     * @param array $body
     * @return void
     * @throws MiddlewareException
     */
    private static function assertRequired(array $body): void
    {
        foreach (["grant_type", "client_id", "client_secret"] as $field) {
            if (($body[$field] ?? "") === "") {
                throw self::validationError($field, "required", "The {$field} field is required");
            }
        }
    }

    /**
     * @param string $grantType
     * @return void
     * @throws MiddlewareException
     */
    private static function assertGrantType(string $grantType): void
    {
        if ($grantType !== self::GRANT_TYPE) {
            throw self::validationError(
                "grant_type",
                "unsupported_grant_type",
                "Only the client_credentials grant type is supported"
            );
        }
    }

    /**
     * @param string $clientId
     * @param string $clientSecret
     * @return array
     * @throws MiddlewareException
     */
    private static function authenticate(string $clientId, string $clientSecret): array
    {
        try {
            $res = Manager::getService("account")->write("api_client/authenticate", new Shape([
                "data" => [
                    "client_id" => $clientId,
                    "client_secret" => $clientSecret,
                ],
            ]));
        } catch (\Throwable $e) {
            throw new MiddlewareException("invalid_client", "");
        }

        if ((int) $res->get("info.http_code") !== 200) {
            throw new MiddlewareException("invalid_client", "");
        }

        $content = $res->get("content");
        $decoded = is_string($content) ? json_decode($content, true) : null;
        $data = is_array($decoded) ? ($decoded["data"] ?? null) : null;

        if (!is_array($data) || empty($data["id"])) {
            throw new MiddlewareException("invalid_client", "");
        }

        return $data;
    }

    /**
     * @param string $field
     * @param string $code
     * @param string $message
     * @return MiddlewareException
     */
    private static function validationError(string $field, string $code, string $message): MiddlewareException
    {
        return new MiddlewareException("validation_failed", (string) json_encode([
            "message" => "Validation failed",
            "errors" => [[
                "field" => $field,
                "code" => $code,
                "message" => $message,
            ]],
        ]));
    }

    /**
     * @return string
     */
    private static function uuid4(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

        return vsprintf("%s%s-%s-%s-%s-%s%s%s", str_split(bin2hex($data), 4));
    }

    /**
     * @return callable
     */
    public static function validate(): callable
    {
        return function (Action $action) {
            $token = self::bearerToken();

            try {
                $claims = PartnerJwt::decode(
                    $token,
                    PartnerKeyProvider::publicKey(),
                    [
                        "issuer" => self::ISSUER,
                        "audience" => self::AUDIENCE,
                        "leeway" => (int) Config::get("partner.jwt.leeway", 60),
                    ]
                );
            } catch (\Throwable $e) {
                throw new MiddlewareException("invalid_token", "");
            }

            $clientId = (int) ($claims["cid"] ?? 0);
            if ($clientId <= 0) {
                throw new MiddlewareException("invalid_token", "");
            }

            $client = self::loadClient($clientId);
            if ((int) $client->get("active") !== 1) {
                throw new MiddlewareException("invalid_token", "");
            }

            $action->set("partner", [
                "partner_client_id" => $clientId,
                "provider_id" => $client->get("provider_id"),
                "account_id" => (int) $client->get("account_id"),
                "scopes" => (string) ($claims["scope"] ?? ""),
                "jti" => $claims["jti"] ?? null,
            ]);
        };
    }

    /**
     * @param int $clientId
     * @return \Core\Data\Shape
     * @throws MiddlewareException
     */
    private static function loadClient(int $clientId)
    {
        try {
            $res = Manager::getService("account")->fetch("api_client/{$clientId}");
        } catch (\Throwable $e) {
            throw new MiddlewareException("invalid_token", "");
        }

        return $res->getShape("data");
    }

    /**
     * @return string
     * @throws MiddlewareException
     */
    private static function bearerToken(): string
    {
        $headers = array_change_key_case(getallheaders());
        $authorization = $headers["authorization"] ?? "";

        if (is_string($authorization) && preg_match('/^Bearer\s+(.+)$/i', trim($authorization), $matches)) {
            return trim($matches[1]);
        }

        throw new MiddlewareException("invalid_token", "");
    }
}
