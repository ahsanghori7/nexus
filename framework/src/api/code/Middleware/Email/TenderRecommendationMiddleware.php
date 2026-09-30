<?php

namespace Api\Middleware\Email;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Service\AccountMiddleware;
use Prosper\Middleware\EmailMiddleware as ProsperEmailMiddleware;

class TenderRecommendationMiddleware
{

    /**
     * @var array|string[]
     */
    public static array $templates = [
        'tr_approval'           => "sendTRApprovalEmail",
        'tr_approval_requester' => "sendTRRequesterApprovalEmail",
        'tr_approved'           => "sendTRApprovedEmail",
        'tr_rejected'           => "sendTRRejectedEmail",
        'tr_reminder'           => "sendTRApproverReminderEmail",
        'tr_reminder_requester' => "sendTRApproverReminderRequesterEmail",
        'tr_cancel'             => "sendTRCancellationRequesterEmail",
        'tr_cancel_approver'    => "sendTRCancellationApproverEmail",
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
    public static function sendTenderRecommendationEmail(string $payloadKey = 'payload', string $template = ''): \Closure
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
    public static function sendTRApprovalEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("TR Assign Approver",[
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "extra"  => new Shape([
                    "approverName" => $payload->get("approverName"),
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    // "additionalComments" => $payload->get("additionalComments"),
                    "dateTime"      => sprintf("%s at %s UK Time", self::getUKDateTime()['date'], self::getUKDateTime()['time']),
                    "reportLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTRRequesterApprovalEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("TR Assign Approver Requester",[
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "extra"  => new Shape([
                    "approverName" => $payload->get("approverName"),
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    "dateTime"      => sprintf("%s at %s UK Time", self::getUKDateTime()['date'], self::getUKDateTime()['time']),
                    "reportLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), urlencode($redirectUrl . "&scroll=true")),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTRApprovedEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("TR Approved",[
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "extra"  => new Shape([
                    "approverName" => $payload->get("approverName"),
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    "dateTime"      => sprintf("%s at %s UK Time", self::getUKDateTime()['date'], self::getUKDateTime()['time']),
                    "reportLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), urlencode($redirectUrl . "&scroll=true")),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTRRejectedEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("TR Rejected",[
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "extra"  => new Shape([
                    "approverName" => $payload->get("approverName"),
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    "feedback" => $payload->get("feedback"),
                    "dateTime"      => sprintf("%s at %s UK Time", self::getUKDateTime()['date'], self::getUKDateTime()['time']),
                    "reportLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), urlencode($redirectUrl . "&scroll=true")),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTRApproverReminderEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("TR Approver Reminder",[
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
                    "dateTime"      => $payload->get("requestDateTime"),
                    "reportLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTRApproverReminderRequesterEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("TR Approver Reminder Requester",[
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "extra"  => new Shape([
                    "approverName" => $payload->get("approverName"),
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    "reportLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), urlencode($redirectUrl . "&scroll=true")),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTRCancellationRequesterEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("TR Cancelled",[
                "sender" => new Shape(["id" => $payload->get("user_id")]),
                "from"   => Config::get("email.site.clink.default"),
                "to"     => $payload->get("email"),
                "user_id" => $payload->get("user_id"),
                "extra"  => new Shape([
                    "qsFullName" => $payload->get("qsFullName"),
                    "packageName" => $payload->get("packageName"),
                    "projectName" => $payload->get("projectName"),
                    "subcontractorName" => $payload->get("subcontractorName"),
                    "dateTime"      => $payload->get("dateTime"),
                    "reportLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), urlencode($redirectUrl . "&scroll=true")),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTRCancellationApproverEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            ProsperEmailMiddleware::send("TR Cancelled Approver",[
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
                    "dateTime"      => $payload->get("dateTime"),
                    "reportLink" => sprintf("%s/auto_loader/?token=%s&redirect=%s", Config::get('clink.site_url'), $action->get('token'), urlencode($redirectUrl . "&scroll=true")),
                ])
            ])($action);
        };
    }

}
