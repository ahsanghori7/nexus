<?php

namespace Api\Util;

use Core\Middleware\Exception as MiddlewareException;
use Core\Router\Route\Action;

class PartnerError
{
    /**
     * error code => [http status, default message]
     */
    const CATALOG = [
        "validation_failed" => [400, "Validation failed"],
        "project_name_exists" => [400, "A C-Link project with this name already exists"],
        "invalid_client" => [401, "Authentication failed"],
        "invalid_token" => [401, "Invalid or expired token"],
        "insufficient_scope" => [403, "Insufficient scope for this endpoint"],
        "not_found" => [404, "Resource not found"],
        "external_project_conflict" => [409, "The external project already exists with different immutable data"],
        "business_unit_not_mapped" => [422, "Validation failed"],
        "internal_error" => [500, "Internal error"],
    ];

    /**
     * HTTP reason phrases used when composing the status line.
     */
    const REASONS = [
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        409 => "Conflict",
        422 => "Unprocessable Entity",
        500 => "Internal Server Error",
    ];

    /**
     * @param string $error
     * @return int
     */
    public static function statusFor(string $error): int
    {
        return self::CATALOG[$error][0] ?? 500;
    }

    /**
     * @param string $error
     * @return callable
     */
    public static function handler(string $error): callable
    {
        return function (MiddlewareException $ex, Action $action) use ($error) {
            $message = null;
            $errors = [];

            $raw = $ex->getMessage();
            if ($raw !== "") {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $message = $decoded["message"] ?? null;
                    $errors = $decoded["errors"] ?? [];
                } else {
                    $message = $raw;
                }
            }

            self::emit($action, $error, $message, $errors);
        };
    }

    /**
     * @param Action $action
     * @param string $error
     * @param string|null $message
     * @param array $errors
     * @return void
     */
    public static function emit(Action $action, string $error, ?string $message = null, array $errors = []): void
    {
        [$status, $defaultMessage] = self::CATALOG[$error] ?? [500, "Internal error"];
        $reason = self::REASONS[$status] ?? "";

        $action->set("headers", [
            trim(sprintf("HTTP/1.1 %s %s", $status, $reason)) => "",
        ]);
        $action->set("json", json_encode([
            "data" => [],
            "message" => $message ?? $defaultMessage,
            "error" => $error,
            "errors" => array_values($errors),
        ]));
    }
}
