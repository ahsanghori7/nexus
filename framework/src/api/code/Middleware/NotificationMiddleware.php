<?php

namespace Api\Middleware;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Service\Exception\RestException;
use Core\Middleware\Exception as MiddlewareException;
use Core\Util\StructuredLogger;

class NotificationMiddleware
{

    /**
     * @return \Closure
     *
     * Usage:
     * $action->get('notifications')
     */
    public static function fetchList(): \Closure
    {
        return function (Shape $action) {
            $params = ["receiver_user_id" => $action->get("user.id")];
            $since = $action->get("args.since");
            if ($since !== null) {
                $params["since"] = $since;
            }
            $limit = $action->get("args.limit");
            if ($limit !== null) {
                $params["limit"] = $limit;
            }

            try {
                $res = Manager::getService("vertex")->fetch("notifications", $params);
            } catch (RestException $e) {
                throw self::toClientOrFetchFailure($e);
            } catch (\Exception $e) {
                throw new MiddlewareException("notificationFetchFailure", $e->getMessage());
            }

            return $action->set("notifications", $res->getShape("data"));
        };
    }

    /**
     * @return \Closure
     *
     * Usage:
     * $action->get('unread_count')
     */
    public static function fetchUnreadCount(): \Closure
    {
        return function (Shape $action) {
            try {
                $res = Manager::getService("vertex")->fetch("notifications/unread_count", [
                    "receiver_user_id" => $action->get("user.id"),
                ]);
            } catch (RestException $e) {
                throw self::toClientOrFetchFailure($e);
            } catch (\Exception $e) {
                throw new MiddlewareException("notificationFetchFailure", $e->getMessage());
            }

            return $action->set("unread_count", $res->getShape("data")->get("unread_count", 0));
        };
    }

    /**
     * @return \Closure
     *
     * Usage:
     * $action->get('notification')
     */
    public static function markRead(): \Closure
    {
        return function (Shape $action) {
            $id = $action->get("uriArgs.id");
            try {
                $res = Manager::getService("vertex")->update(
                    sprintf("notifications/%s/read", $id),
                    new Shape(["data" => ["receiver_user_id" => $action->get("user.id")]])
                );
            } catch (\Exception $e) {
                throw new MiddlewareException("notificationUpdateFailure", $e->getMessage());
            }

            return $action->set("notification", self::extractData($res, "notificationUpdateFailure"));
        };
    }

    /**
     * @return \Closure
     *
     * Usage:
     * $action->get('mark_all_read_response')
     */
    public static function markAllRead(): \Closure
    {
        return function (Shape $action) {
            try {
                $res = Manager::getService("vertex")->update(
                    "notifications/mark_all_read",
                    new Shape(["data" => ["receiver_user_id" => $action->get("user.id")]])
                );
            } catch (\Exception $e) {
                throw new MiddlewareException("notificationUpdateFailure", $e->getMessage());
            }

            return $action->set("mark_all_read_response", self::extractData($res, "notificationUpdateFailure"));
        };
    }

    /**
     * Creates a notification in Vertex.
     * @return \Closure
     */
    public static function create(): \Closure
    {
        return function (Shape $action) {
            try {
                $res = Manager::getService("vertex")->write(
                    "notifications",
                    new Shape(["data" => $action->get("notification_payload")])
                );
            } catch (\Exception $e) {
                throw new MiddlewareException("notificationCreateFailure", $e->getMessage());
            }

            return $action->set("notification", self::extractData($res, "notificationCreateFailure"));
        };
    }

    /**
     * @param int $maxAttempts
     * @param int $retryDelayMs
     * @return \Closure
     */
    public static function createSilently(int $maxAttempts = 3, int $retryDelayMs = 200): \Closure
    {
        return function (Shape $action) use ($maxAttempts, $retryDelayMs) {
            $lastError = null;
            $attemptsMade = 0;

            for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
                $attemptsMade = $attempt;
                try {
                    self::create()($action);
                    return;
                } catch (MiddlewareException $e) {
                    $lastError = $e;
                    if ($e->getId() === "notificationClientError") {
                        break;
                    }
                } catch (\Throwable $e) {
                    $lastError = $e;
                }

                if ($attempt < $maxAttempts) {
                    usleep($retryDelayMs * 1000);
                }
            }

            StructuredLogger::log("NOTIF", "ERROR", "notification_create", $lastError->getMessage(), [
                "payload" => $action->get("notification_payload"),
                "attempts" => $attemptsMade,
            ]);
        };
    }

    /**
     * Reads the "data" payload from a write()/update()
     * @param Shape $res
     * @param string $failureKey
     * @return mixed
     */
    private static function extractData(Shape $res, string $failureKey)
    {
        $code = (int) $res->get("info.http_code");
        $json = $res->getShape("json");

        if ($code >= 400 && $code < 500) {
            throw new MiddlewareException("notificationClientError", strval(json_encode([
                "status" => $code,
                "message" => $json->get("message", "Request failed"),
            ])));
        }

        if ($code < 200 || $code >= 300) {
            throw new MiddlewareException($failureKey, strval($json->get("message", "Vertex request failed with status $code")));
        }

        return $json->get("data");
    }

    /**
     * fetch() throws on any non-200 status instead of returning a response to
     * inspect, so this maps that into the same notificationClientError/failureKey
     * split extractData() uses for the write()/update() calls.
     *
     * @param RestException $e
     * @return MiddlewareException
     */
    private static function toClientOrFetchFailure(RestException $e): MiddlewareException
    {
        $code = $e->getCode();
        if ($code >= 400 && $code < 500) {
            $decoded = json_decode($e->getMessage(), true) ?: [];
            return new MiddlewareException("notificationClientError", strval(json_encode([
                "status" => $code,
                "message" => $decoded["message"] ?? "Request failed",
            ])));
        }

        return new MiddlewareException("notificationFetchFailure", $e->getMessage());
    }

    /**
     * Context line for notificaitons
     * @param array $parts
     * @return string
     */
    public static function buildContextLine(array $parts): string
    {
        $filtered = array_values(array_filter(
            $parts,
            fn ($part) => ($part['value'] ?? null) !== null && $part['value'] !== ''
        ));
        return (string) json_encode($filtered);
    }

}
