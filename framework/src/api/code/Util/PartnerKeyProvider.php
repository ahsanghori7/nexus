<?php

namespace Api\Util;

use Core\Config;
use Core\Service\Manager;

class PartnerKeyProvider
{
    const DEVELOPMENT_ENVIRONMENT = "development";

    /**
     * @return string
     */
    public static function privateKey(): string
    {
        return self::resolve("private");
    }

    /**
     * @return string
     */
    public static function publicKey(): string
    {
        return self::resolve("public");
    }

    /**
     * @param string $which "private" | "public"
     * @return string
     */
    private static function resolve(string $which): string
    {
        $value = (string) Config::get("partner.jwt.{$which}_key", "");

        if (trim($value) === "") {
            throw new \RuntimeException("Partner JWT {$which} key is not configured");
        }

        $environment = (string) Config::get("environment", "");
        if ($environment !== self::DEVELOPMENT_ENVIRONMENT) {
            $value = self::fromSsm($value);
        }

        if (trim($value) === "") {
            throw new \RuntimeException(
                "Partner JWT {$which} key could not be resolved from SSM (environment: {$environment})"
            );
        }

        return self::normalisePem($value);
    }

    /**
     * Fetch a PEM from AWS SSM Parameter Store by parameter name.
     *
     * @param string $parameterName
     * @return string
     */
    private static function fromSsm(string $parameterName): string
    {
        $ssm = Manager::getService("ssm");
        if (!method_exists($ssm, "getParameter")) {
            return "";
        }

        return (string) ($ssm->getParameter($parameterName) ?? "");
    }

    /**
     * @param string $pem
     * @return string
     */
    private static function normalisePem(string $pem): string
    {
        $pem = trim($pem);

        if (strlen($pem) >= 2) {
            $first = $pem[0];
            $last = $pem[strlen($pem) - 1];
            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                $pem = substr($pem, 1, -1);
            }
        }

        $pem = str_replace(['\\r\\n', '\\n', '\\r', '\\t'], "\n", $pem);

        if (preg_match('/-----BEGIN ([A-Z0-9 ]+?)-----(.*)-----END \1-----/s', $pem, $matches)) {
            $label = trim($matches[1]);
            $body = preg_replace('/[^A-Za-z0-9+\/=]/', '', $matches[2]);

            return "-----BEGIN {$label}-----\n" . chunk_split($body, 64, "\n") . "-----END {$label}-----\n";
        }

        return $pem;
    }
}
