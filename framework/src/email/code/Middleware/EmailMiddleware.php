<?php

namespace Email\Middleware;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Service\Exception\RestException;

class EmailMiddleware
{

    /**
     * @return callable
     */
    public static function logEmailEvent($data = []): callable
    {
        return function () use ($data) {
            try {
                $res = Manager::getService('account')->write("email/log", new Shape([
                    'data' => $data
                ]));
                if ($res->get("info.http_code") === 200) {
                    $json = $res->json("content");
                    if (is_array($json) && isset($json["data"])) {
                        $id = $json['data']['id'];
                    }
                }
            } catch (\Exception $e) {
                $id = 0;
            }

            return $id ?? 0;
        };
    }

    /**
     * @param string $aidKey
     * @return callable
     */
    public static function loadEmailTypes(): callable
    {
        return function ($action) {
            try {
                $data = Manager::getService('account')->fetch("email/types")->getCollection('data');
            } catch (\Exception $e) {
                $data = [];
            }
            $action->set("email_types", $data);
        };
    }

    /**
     * @param string $to
     * @param string $recipient
     * @param string $reason
     * @return callable
     */
    public static function sendEmailDeliveryFailed(string $to, string $recipient, string $reason): callable
    {
        return function ($a) use ($to, $recipient, $reason) {
            $data = [
                "template"  => "Email Delivery Failed",
                "to" => $to,
                "extra"  => new Shape([
                    "recipient" => $recipient,
                    "reason" => $reason
                ])
            ];
            try {
                $user = Manager::getService('account')->fetch("user/search", [
                    "field" => "email",
                    "value" => $to
                ]);
                if ($user->hasData()) {
                    $userData = $user->getShape("data");
                    $a->set("user", $userData);
                    $from = $userData->get("email");
                    $data["sender"] = $userData;
                    $data["from"] = $from;
                    Manager::getService('email')->write("email/send", new Shape(['data' => $data]));
                }
            } catch (RestException $e) {
            }
        };
    }
}
