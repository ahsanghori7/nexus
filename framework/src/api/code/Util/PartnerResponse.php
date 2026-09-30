<?php

namespace Api\Util;

use Core\Router\Route\Action;

class PartnerResponse
{
    const REASONS = [
        200 => "OK",
        201 => "Created",
    ];

    /**
     * @param Action $action
     * @param int $status
     * @param mixed $data
     * @param array $meta
     * @param string|null $message
     * @return void
     */
    public static function emit(Action $action, int $status, $data, array $meta = [], ?string $message = null): void
    {
        $reason = self::REASONS[$status] ?? "OK";

        $body = ["data" => $data];
        if ($meta) {
            $body["meta"] = $meta;
        }
        $body["message"] = $message ?? $reason;

        $action->set("headers", [
            sprintf("HTTP/1.1 %d %s", $status, $reason) => "",
        ]);
        $action->set("json", json_encode($body));
    }
}
