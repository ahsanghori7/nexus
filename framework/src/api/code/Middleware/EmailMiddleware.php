<?php

namespace Api\Middleware;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Service\AccountMiddleware;
use Prosper\Middleware\EmailMiddleware as ProsperEmailMiddleware;

class EmailMiddleware
{

    /**
     * @var array|string[]
     */
    public static array $templates = [
        'added'               => "sendAddedEmail",
        'activation'          => 'sendActivationEmail',
        'activation_reminder' => 'sendActivationReminderEmail',
        'pqq_reminder'        => 'sendPQQReminderEmail',
        'confirmation'        => 'sendConfirmationEmail',
        'contact_accept'      => 'sendContactAcceptedEmail',
        'contact_decline'     => 'sendContactDeclinedEmail',
        'contact_activation'  => 'sendContactActivationEmail',
    ];

    /**
     * @param string $payloadKey
     * @param string $template
     * @return \Closure
     */
    public static function sendSupplyChainEmail(string $payloadKey = 'payload', string $template = ''): \Closure
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
     * This is sent only when the subcontractor is not activated and is added by a main contractor
     */
    public static function sendActivationEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey){
            $payload = $action->get($payloadKey);
            AccountMiddleware::createUserToken(
                "payload.user_id",
                "token_type",
                Config::getUrl("prosper_site_url", "supply-chain-portal/token"),
                ['contractor_aid' => $payload->get("contractor.id")]
            )($action);
            $idUser = $action->get("user.id");
            $ownerName = $action->get("user.display_name");
            $ownerRole = $action->get("user_role.display_label");
            $ownerCompany = $payload->get("contractor.name");
            $contact = $payload->get("firstname");
            ProsperEmailMiddleware::send("Supply Chain Add External",[
                "sender" => new Shape(["id" => $idUser]),
                "to"     => $payload->get("email"),
                "extra"  => new Shape([
                    'supply_chain_owner_name'         => $ownerName,
                    'supply_chain_owner_role'         => $ownerRole,
                    'supply_chain_owner_company'      => $ownerCompany,
                    'supply_chain_contact_first_name' => $contact,
                ]),
                "token" => new Shape(["url" => $action->get("token_url")])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendContactActivationEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey){
            $payload = $action->get($payloadKey);
            AccountMiddleware::loadTokenTypes("team_invite")($action);
            AccountMiddleware::createUserToken(
                "payload.user_id", "token_type", Config::getUrl("prosper_site_url", "relay/v1/team_manager/token")
            )($action);
            ProsperEmailMiddleware::send("Team Manager Invite",[
                "sender" => new Shape(["id" => $payload->get("id")]),
                "to"     => $payload->get("email"),
                "extra"  => new Shape([
                    'name'              => $payload->get("company_name"),
                    'member_first_name' => $payload->get("firstname"),
                    'first_name'        => $payload->get("subcontractor_name"),
                ]),
                "token" => new Shape(["url" => $action->get("token_url")])
            ])($action);
        };
    }

    /**
     * @return \Closure
     * This is sent when a main contractor adds a subcontractor that is activated or is not an external company
     */
    public static function sendAddedEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            ProsperEmailMiddleware::send("Supply Chain Readded",[
                "sender" => new Shape(["id" => $payload->get("id")]),
                "to"     => $payload->get("email"),
                "extra"  => new Shape([
                    'supply_chain_owner_name'         => $payload->get("contractor.name"),
                    'supply_chain_owner_company'      => $payload->get("company_name"),
                    'supply_chain_contact_first_name' => $payload->get("firstname"),
                ]),
                "token" => new Shape(["url" => $action->get("token_url")])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendActivationReminderEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            //auto loader token
            AccountMiddleware::loadTokenTypes("supply_chain")($action);
            AccountMiddleware::createUserToken(
                "payload.user_id",
                "token_type",
                Config::getUrl("prosper_site_url", "supply-chain-portal/token"),
                ['contractor_aid' => $payload->get("contractor.id")]
            )($action);
            ProsperEmailMiddleware::send("Supply Chain Activation Reminder",[
                "sender" => new Shape(['id' => $action->get("payload.user_id")]),
                "to"     => $payload->get("email"),
                "extra"  => new Shape([
                    'supply_chain_owner_name'         => $payload->get("contractor.name"),
                    'supply_chain_contact_first_name' => $payload->get("firstname"),
                ]),
                "token" => new Shape(["url" => $action->get("token_url")])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendPQQReminderEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            //auto loader token
            AccountMiddleware::loadTokenTypes("supply_chain")($action);
            AccountMiddleware::createUserToken(
                "payload.user_id",
                "token_type",
                Config::getUrl("prosper_site_url", "supply-chain-portal/token"),
                ['contractor_aid' => $payload->get("contractor.id")]
            )($action);
            ProsperEmailMiddleware::send("PQQ Reminder",[
                "sender" => new Shape(['id' => $action->get("payload.user_id")]),
                "to"     => $payload->get("email"),
                "extra"  => new Shape([
                    'supply_chain_owner_name'         => $payload->get("contractor.name"),
                    'supply_chain_contact_first_name' => $payload->get("firstname"),
                    'missing_section_fields'          => $action->get("missing_section_fields_html"),
                ]),
                "token" => new Shape(["url" => Config::getUrl("prosper_site_url", "login")])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendConfirmationEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            //auto loader token
            AccountMiddleware::loadTokenTypes("supply_chain")($action);
            AccountMiddleware::createUserToken(
                "payload.user_id",
                "token_type",
                Config::getUrl("prosper_site_url", "supply-chain-portal/token")
            )($action);
            $aid = $action->get("account.id");
            $endpoint = "public/account/$aid/supply-chain/";
            $urlToken = Config::getUrl("services.api.url") . $endpoint;
            $url = $urlToken . $action->get("token");
            ProsperEmailMiddleware::send("Supply Chain Confirmation",[
                "sender" => new Shape(['id' => $action->get("payload.user_id")]),
                "to"     => $payload->get("email"),
                "extra"  => new Shape([
                    'token_url'                            => $url,
                    'supply_chain_main_contractor_company' => $payload->get("contractor.company"),
                    'supply_chain_main_contractor_name'    => $payload->get("contractor.name"),
                    'supply_chain_subcontractor_name'      => $payload->get("subcontractor_name"),
                    'supply_chain_contact_first_name'      => $payload->get("firstname")." ".$payload->get("lastname"),
                    'supply_chain_contact_email'           => $payload->get("contact_email"),
                ]),
                "token" => new Shape(["url" => $action->get("token_url")])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendContactAcceptedEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            ProsperEmailMiddleware::send("Supply Chain Contact Accepted",[
                "sender" => new Shape(["id" => $payload->get("id")]),
                "to"     => $payload->get("email"),
                "extra"  => new Shape([
                    'supply_chain_owner_company'      => $payload->get("company_name"),
                    'supply_chain_contact_first_name' => $payload->get("firstname"),
                ])
            ])($action);
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     */
    public static function sendContactDeclinedEmail(string $payloadKey = 'payload'): \Closure
    {
        return function ($action) use ($payloadKey) {
            $payload = $action->get($payloadKey);
            ProsperEmailMiddleware::send("Supply Chain Contact Declined",[
                "sender" => new Shape(["id" => $payload->get("id")]),
                "to"     => $payload->get("email"),
                "extra"  => new Shape([
                    "subcontractor_company_name" => $payload->get("subcontractor_company_name"),
                    "main_contractor_firstname" => $payload->get("main_contractor_firstname"),
                    "contact_full_name" => $payload->get("contact_full_name"),
                    "contact_email_address" => $payload->get("contact_email_address"),
                ])
            ])($action);
        };
    }
}
