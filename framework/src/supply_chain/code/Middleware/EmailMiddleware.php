<?php

namespace SupplyChain\Middleware;

use DateTime;
use Core\Config;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Service\UserMiddleware;
use Prosper\Middleware\EmailMiddleware as ProsperEmailMiddleware;

class EmailMiddleware
{
    /**
     * @return \Closure
     */
    public static function sendMarketingExternalEmail(): \Closure
    {
        return function ($action) {
            AccountMiddleware::createUserToken(
                "subcontractor_uid",
                "token_type",
                Config::getUrl("site_url", "supply-chain-portal/token"),
                ['contractor_aid' => $action->get("main_contractor_id")]
            )($action);
            SupplyChainMiddleware::getOwner()($action);
            ProsperEmailMiddleware::send("Supply Chain Add External", [
                "sender" => new Shape(["id" => $action->get("subcontractor_uid")]),
                "to"     => $action->get("body.email"),
                "extra"  => new Shape([
                    'supply_chain_owner_name'         => $action->get("body.contractor.name"),
                    'supply_chain_owner_company'      => $action->get("body.contractor.company"),
                    'supply_chain_contact_first_name' => $action->get("body.users.firstname"),
                ]),
                "token" => new Shape(["url" => $action->get("token_url")])
            ])($action);
        };
    }

    /**
     * @return \Closure
     */
    public static function sendMarketingEmail(): \Closure
    {
        return function ($action) {
            ProsperEmailMiddleware::send("Supply Chain Readded", [
                "sender" => new Shape(['id' => $action->get("subcontractor_uid")]),
                "to"     => $action->get("body.email"),
                "extra"  => new Shape([
                    'supply_chain_owner_name'         => $action->get("body.contractor.name"),
                    'supply_chain_owner_company'      => $action->get("body.contractor.company"),
                    'supply_chain_contact_first_name' => $action->get("body.users.firstname"),
                ]),
            ])($action);
        };
    }

    /**
     * @return \Closure
     */
    public static function sendMarketingExternalReAddedEmail(): \Closure
    {
        return function ($action) {
            AccountMiddleware::createUserToken(
                "subcontractor_uid",
                "token_type",
                Config::getUrl("site_url", "supply-chain-portal/token"),
                ['contractor_aid' => $action->get("main_contractor_id")]
            )($action);
            ProsperEmailMiddleware::send("Supply Chain Readded", [
                "sender" => new Shape(['id' => $action->get("subcontractor_uid")]),
                "to"     => $action->get("body.email"),
                "extra"  => new Shape([
                    'supply_chain_owner_name'         => $action->get("body.contractor.name"),
                    'supply_chain_owner_company'      => $action->get("body.contractor.company"),
                    'supply_chain_contact_first_name' => $action->get("body.users.firstname"),
                ]),
                "token" => new Shape(["url" => $action->get("token_url")])
            ])($action);
        };
    }

    /**
     * @return \Closure
     */
    public static function checkLatestSentEmails($template): \Closure
    {
        return function ($action) use ($template) {
            $senderUserId = $action->int("user_id", 0);
            $recipientId = $action->int("recipient_id", 0);
            $foundRecent = false;
            if ($senderUserId) {
                //Check last sent email
                EmailMiddleware::loadEmailTypes()($action);
                $types = $action->get("email_types");
                $idType = $types->filterByField("uid", "sent")->getFirst()->get("id");
                $emails = Manager::getService('account')->fetch("email/logs", [
                    'email_id' => $idType,
                    'user_id' => $senderUserId,
                    'template' => $template
                ])->getCollection('data');
                if ($emails->count()) {
                    $now = new DateTime();
                    $twelveHoursAgo = (clone $now)->modify('-12 hours');
                    foreach ($emails->getItemsAsArray() as $email) {
                        if (!empty($email['sent_date'])) {
                            $createdAt = new DateTime($email['sent_date']);
                            $meta = json_decode($email["meta"], true);
                            if ($recipientId === intval($meta["recipient_id"]) && $createdAt >= $twelveHoursAgo && $createdAt <= $now) {
                                $foundRecent = true;
                                $action->set("status_email", "foundRecent");
                                break;
                            }
                        }
                    }
                }
            }
            $action->set("found_recent_sent_email", $foundRecent);
        };
    }

    /**
     * @return \Closure
     */
    public static function sendExternalActivateReminder(): \Closure
    {
        return function ($action) {
            //auto loader token
            AccountMiddleware::loadTokenTypes("supply_chain")($action);
            AccountMiddleware::createUserToken(
                "subcontractor_uid",
                "token_type",
                Config::getUrl("site_url", "supply-chain-portal/token"),
                ['contractor_aid' => $action->get("main_contractor_id")]
            )($action);
            $meta = $action->get("subcontractor")->meta;
            $meta = $meta ? json_decode($meta, true) : [];
            $user_email = $meta[$action->get("main_contractor_id")]['user']['email'] ?? null;
            $user_name  = $meta[$action->get("main_contractor_id")]['user']['display_name'] ?? null;
            if (!$user_email) {
                $user_email = $action->get("subcontractor")->email;
                $user_name = $action->get("subcontractor")->name;
            }

            $action->set("recipient_id", $action->get("subcontractor")->id);
            $template = "Supply Chain Activation Reminder";
            self::checkLatestSentEmails($template)($action);

            if (!$action->get("found_recent_sent_email", false)) {
                SupplyChainMiddleware::getOwner()($action);
                ProsperEmailMiddleware::send($template, [
                    "sender" => new Shape(['id' => $action->get("subcontractor_uid")]),
                    "to"     => $user_email,
                    "extra"  => new Shape([
                        'supply_chain_contact_first_name' => $user_name,
                        'supply_chain_owner_name' => $action->get("owner.name"),
                        'supply_chain_owner_role' => $action->get("owner.role"),
                        'supply_chain_owner_company_name' => $action->get("main_contractor")->name,
                    ]),
                    "user_id" => $action->int("user_id", 0),
                    "token" => new Shape(["url" => $action->get("token_url")])
                ])($action);
            }
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
     * @return \Closure
     */
    public static function sendPQQReminder(): \Closure
    {
        return function ($action) {
            //auto loader token
            AccountMiddleware::loadTokenTypes("auto_loader")($action);
            AccountMiddleware::createUserToken(
                "subcontractor_uid",
                "token_type",
                Config::getUrl("site_url", "account/auto_loader")
            )($action->set("token_type", $action->get("token_type")));
            $action->set("token_url", sprintf(
                "%s/account/auto_loader/%s/redirect=my-company/prequalification",
                Config::get("site_url"),
                $action->get("token")
            ));
            $uid = $action->get("body")->int("user_id");
            $user = Manager::getService('account')->fetch("user/$uid/profile")->getShape('data');

            $action->set("recipient_id", $action->get("subcontractor_id"));
            $template = "PQQ Reminder";
            self::checkLatestSentEmails($template)($action);

            if (!$action->get("found_recent_sent_email", false)) {
                UserMiddleware::loadTypes()($action);
                $roles = $action->get("user_types");
                $userType = $user->get("type_id");
                $userRole = array_filter($roles->getItemsAsArray(), function ($r) use ($userType) {
                    return intval($r["id"]) === intval($userType);
                });
                $userRole = array_shift($userRole);
                $role = str_replace('_', ' ', $userRole["label"]);
                $role = ucwords($role);
                ProsperEmailMiddleware::send($template, [
                    "sender" => new Shape(['id' => $action->get("subcontractor_uid")]),
                    "to"     => $action->get("user_email"),
                    "extra"  => new Shape([
                        'user_name'                 => $user->get("display_name"),
                        'user_role'                 => $role,
                        'company_name'              => $action->get("main_contractor")->name,
                        'first_name'                => $action->get("user_name"),
                        'documents'                 => $action->get("missing_section_fields_html"),
                    ]),
                    "user_id" => $action->int("user_id", 0),
                    "token" => new Shape(["url" => $action->get("token_url")])
                ])($action);
            }
        };
    }
}
