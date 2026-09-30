<?php

namespace Api\Middleware\Email;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Service\AccountMiddleware;
use Prosper\Middleware\EmailMiddleware as ProsperEmailMiddleware;

class SubcontractorListApprovalMiddleware
{

    /**
     * @var array|string[]
     */
    public static array $templates = [
        'sl_approval'           => "sendSLApprovalEmail",
        'sl_approval_requester' => "sendSLRequesterApprovalEmail",
        'sl_approved'           => "sendSLApprovedEmail",
        'sl_rejected'           => "sendSLRejectedEmail",
        'sl_reminder'           => "sendApproverReminderEmail",
        'sl_reminder_requester' => "sendApproverReminderRequesterEmail",
    ];

    public static function getUKDateTime($datetime = null): array
    {
        $datetime = $datetime ?? 'now';
        $date = new \DateTime($datetime, new \DateTimeZone('UTC'));
        $date->setTimezone(new \DateTimeZone('Europe/London'));
        return [
            'date' => $date->format('d/m/Y'),
            'time' => $date->format('H:i'),
        ];
    }

    /**
     * @param string $payloadKey
     * @param string $template
     * @return \Closure
     */
    public static function sendSubcontractorListApprovalEmail(string $template, string $payloadKey = 'payload' ): \Closure
    {
        return function ($action) use ($payloadKey, $template) {
            $payload    = $action->getShape($payloadKey);
            $email_data = $payload->getShape("email_data");
            if(!$template) {
                $template = $email_data->get("template");
            }
            if ($template) {
                $method = self::$templates[$template] ?? null;
                if ($method && method_exists(self::class, $method)) {
                    self::$method($payloadKey)($action);
                }
            }
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendSLApprovalEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("Subcontractor List Assign Approver",[
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "extra"  => new Shape([
                    "approverName" => $payload->get("approverName"),
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    "subcontractorName" => $payload->get("subcontractorName"),
                    // "additionalComments" => $payload->get("additionalComments"),
                    "dateTime"      => sprintf("%s at %s UK Time", self::getUKDateTime()['date'], self::getUKDateTime()['time']),
                    "requestLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendSLRequesterApprovalEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("Subcontractor List Assign Requester",[
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "extra"  => new Shape([
                    "approverName" => $payload->get("approverName"),
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    "subcontractorName" => $payload->get("subcontractorName"),
                    "dateTime"      => sprintf("%s at %s UK Time", self::getUKDateTime()['date'], self::getUKDateTime()['time']),
                    "requestLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendSLApprovedEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("Subcontractor Approved",[
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "extra"  => new Shape([
                    "approverName" => $payload->get("approverName"),
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    "subcontractorName" => $payload->get("subcontractorName"),
                    "dateTime"      => sprintf("%s at %s UK Time", self::getUKDateTime()['date'], self::getUKDateTime()['time']),
                    "requestLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendSLRejectedEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("Subcontractor Rejected",[
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "extra"  => new Shape([
                    "approverName" => $payload->get("approverName"),
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    "subcontractorName" => $payload->get("subcontractorName"),
                    "feedback" => $payload->get("feedback"),
                    "dateTime"      => sprintf("%s at %s UK Time", self::getUKDateTime()['date'], self::getUKDateTime()['time']),
                    "requestLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendApproverReminderEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
                "payload.user_id",
                "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("Subcontractor List Approval Reminder", [
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "meta" => [
                    "entity_type" => $payload->get("entityType"),
                    "entity_id" => $payload->get("entityId"),
                ],
                "extra"  => new Shape([
                    "approverName" => $payload->get("approverName"),
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    "subcontractorName" => $payload->get("subcontractorName"),
                    "dateTime"      => $payload->get("requestDateTime"),
                    "requestLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendApproverReminderRequesterEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
                "payload.user_id",
                "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("Subcontractor List Approval Reminder Requester", [
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "extra"  => new Shape([
                    "approverName" => $payload->get("approverName"),
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    "subcontractorName" => $payload->get("subcontractorName"),
                    "requestLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), urlencode($redirectUrl . "&scroll=true")),
                ])
            ])($action);
        };
    }
}
