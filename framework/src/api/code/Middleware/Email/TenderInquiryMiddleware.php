<?php

namespace Api\Middleware\Email;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Service\AccountMiddleware;
use Prosper\Middleware\EmailMiddleware;

class TenderInquiryMiddleware
{

    /**
     * @var array|string[]
     */
    public static array $templates = [
        'ti_approval'           => "sendTIApprovalEmail",
        'ti_approval_requester' => "sendTIRequesterApprovalEmail",
        'ti_approved'           => "sendTIApprovedEmail",
        'ti_approval_reminder'  => "sendTIApprovalReminderEmail",
        'ti_approval_reminder_requester'  => "sendTIApprovalReminderEmailRequester",
        'ti_rejected'           => "sendTIRejectedEmail",
    ];

    /**
     * @param string $template
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTenderInquiryEmail(string $template, string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey, $template) {
            $method = self::$templates[$template] ?? null;
            if ($method && method_exists(self::class, $method)) {
                self::$method($payloadKey)($action);
            }
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTIApprovalEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            EmailMiddleware::send("Tender Inquiry Assign Approver",[
                "sender"    => new Shape(["id" => $payload->get("user_id")]),
                "from"      => Config::get("email.site.clink.default"),
                "to"        => $payload->get("email"),
                "user_id"   => $payload->get("user_id"),
                "extra"     => new Shape([
                    "approverName"  => $payload->get("approverName"),
                    "requesterName" => $payload->get("requesterName"),
                    "packageName"   => $payload->get("packageName"),
                    "projectName"   => $payload->get("projectName"),
                    "dateTime"      => sprintf("%s at %s UK Time", date("d/m/Y"), date("H:i")),
                    "reportLink"    => sprintf("%s/auto_loader/?token=%s&redirect=%s&plain_redirect=true", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTIApprovalReminderEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            EmailMiddleware::send("Tender Inquiry Approval Reminder",[
                "sender"    => new Shape(["id" => $payload->get("user_id")]),
                "from"      => Config::get("email.site.clink.default"),
                "to"        => $payload->get("email"),
                "user_id"   => $payload->get("user_id"),
                "meta" => [
                    "entity_type" => $payload->get("entityType"),
                    "entity_id" => $payload->get("entityId"),
                ],
                "extra"     => new Shape([
                    "approverName"  => $payload->get("approverName"),
                    "requesterName" => $payload->get("requesterName"),
                    "packageName"   => $payload->get("packageName"),
                    "projectName"   => $payload->get("projectName"),
                    "firstDateTime" => $payload->get("firstDateTime"),
                    "dateTime"      => sprintf("%s at %s UK Time", date("d/m/Y"), date("H:i")),
                    "reportLink"    => sprintf("%s/auto_loader/?token=%s&redirect=%s&plain_redirect=true", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTIApprovalReminderEmailRequester(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "$payloadKey.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            EmailMiddleware::send("Tender Inquiry Approval Reminder Requester",[
                "sender"    => new Shape(["id" => $payload->get("user_id")]),
                "from"      => Config::get("email.site.clink.default"),
                "to"        => $payload->get("email"),
                "user_id"   => $payload->get("user_id"),
                "meta" => [
                    "entity_type" => $payload->get("entityType"),
                    "entity_id" => $payload->get("entityId"),
                ],
                "extra"     => new Shape([
                    "approverName"  => $payload->get("approverName"),
                    "requesterName" => $payload->get("requesterName"),
                    "packageName"   => $payload->get("packageName"),
                    "projectName"   => $payload->get("projectName"),
                    "firstDateTime" => $payload->get("firstDateTime"),
                    "dateTime"      => sprintf("%s at %s UK Time", date("d/m/Y"), date("H:i")),
                    "reportLink"    => sprintf("%s/auto_loader/?token=%s&redirect=%s&plain_redirect=true", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTIRequesterApprovalEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            EmailMiddleware::send("Tender Inquiry Assign Approver Requester",[
                "sender"    => new Shape(["id" => $payload->get("user_id")]),
                "from"      => Config::get("email.site.clink.default"),
                "to"        => $payload->get("email"),
                "user_id"   => $payload->get("user_id"),
                "extra"     => new Shape([
                    "approverName"  => $payload->get("approverName"),
                    "requesterName" => $payload->get("requesterName"),
                    "packageName"   => $payload->get("packageName"),
                    "projectName"   => $payload->get("projectName"),
                    "dateTime"      => sprintf("%s at %s UK Time", date("d/m/Y"), date("H:i")),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTIApprovedEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            EmailMiddleware::send("Tender Inquiry Approved",[
                "sender"    => new Shape(["id" => $payload->get("user_id")]),
                "from"      => Config::get("email.site.clink.default"),
                "to"        => $payload->get("email"),
                "user_id"   => $payload->get("user_id"),
                "extra"     => new Shape([
                    "approverName"  => $payload->get("approverName"),
                    "requesterName" => $payload->get("requesterName"),
                    "packageName"   => $payload->get("packageName"),
                    "projectName"   => $payload->get("projectName"),
                    "dateTime"      => sprintf("%s at %s UK Time", date("d/m/Y"), date("H:i")),
                    "reportLink"    => sprintf("%s/auto_loader/?token=%s&redirect=%s&plain_redirect=true", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendTIRejectedEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
              "payload.user_id", "token_type"
            )($action);
            $redirectUrl = $payload->get("redirectUrl");
            EmailMiddleware::send("Tender Inquiry Rejected",[
                "sender"    => new Shape(["id" => $payload->get("user_id")]),
                "from"      => Config::get("email.site.clink.default"),
                "to"        => $payload->get("email"),
                "user_id"   => $payload->get("user_id"),
                "extra"     => new Shape([
                    "approverName"  => $payload->get("approverName"),
                    "requesterName" => $payload->get("requesterName"),
                    "packageName"   => $payload->get("packageName"),
                    "projectName"   => $payload->get("projectName"),
                    "comment"       => $payload->get("comment"),
                    "dateTime"      => sprintf("%s at %s UK Time", date("d/m/Y"), date("H:i")),
                    "reportLink"    => sprintf("%s/auto_loader/?token=%s&redirect=%s&plain_redirect=true", Config::get('clink.site_url'), $action->get('token'), $redirectUrl),
                ])
            ])($action);
        };
    }
}
