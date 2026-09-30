<?php

namespace Prosper\Middleware;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Generic;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Service\AccountMiddleware as CoreAccountMiddleware;
use Core\Middleware\Form;
use Core\Middleware\Conditional;
use Core\Middleware\Hubspot;
use CompanyProfile\Middleware\CompanyProfileMiddleware;
use Prosper\Middleware\Relay\HubspotMiddleware;
use Prosper\Form\Validation as FormValidation;
use Prosper\Middleware\AccountMiddleware as ProsperAccountMiddleware;
use Prosper\Model\TeamManager as TeamManagerModel;

use DateInterval;
use DateTime;

class AccountMiddleware
{

    public const REGION_TYPE_ID = 3;
    public const MEMBERSHIP_TRIAL_ID = 10;
    public const MEMBERSHIP_FLEXI_ID = 11;
    public const MEMBERSHIP_REGIONAL_ID = 12;
    public const EXTERNAL_NOT_ACTIVATED = 15;
    public const EXTERNAL_SUBCONTRACTOR_TYPE_ID = 4;
    public const STATUS_CONFIRMED_ACTIVATED = 2;

    public const ANZ_REGION_CODE = ['NZ', 'AUS'];

    /**
     *
     * The logic for user types need to be thought out
     * @var int
     */
    const ACCOUNT_HOLDER_TYPE_ID = 5;

    /**
     * @param array|string[] $convert_types
     * @return callable
     */
    public static function convertProsper(array $convert_types = ['external_subcontractor']): callable
    {
        return function (Shape $a) use ($convert_types) {

            $account = $a->getShape('account');

            if ($account->hasData()) {

                $type       = $a->getCollection("account_types")->filterByField("id", $account->get("type_id"))->getFirst();
                $specialist = $a->getCollection("account_types")->filterByField("label", "specialist")->getFirst()->get("id");

                $checkUniqueCompanyName = (bool) intval(Config::get("signup_email_unique_company_name"));
                if ($checkUniqueCompanyName && !in_array(strval($type->get("label")), $convert_types, true)) {
                    //If we find an existing account with the name supplied, but is not an part of the converted types then fail at this point
                    throw new \Exception("Account with name already exists");
                }

                $id = $account->int("id");
                $res = Manager::getService("account")->update(
                    "account/" . $id,
                    new Shape(["data" => [
                        "type_id" => $specialist,
                        "status"  => 0
                    ]])
                );

                if ($res->getShape("info")->get("http_code") === 203) {
                    $a->set("aid", $id);
                    //Load the account data to get users and membership data
                    $a->set(
                        "account",
                        Manager::getService("account")
                            ->fetch("account/$id")->getShape("data")
                    );
                } else {
                    throw new \Exception("Failed to convert " . strval($type->get("label")) . " to prosper");
                }
            }
        };
    }

    /**
     * @param string $key
     * @param string $keyId
     * @param string $table
     * @param string $suffix
     * @param string $typeField
     * @return \Closure
     */
    public static function updateAccountType(string $key = "", string $keyId = "", string $table = "account", string $suffix = "", string $typeField = "type_id")
    {
        return function (Shape $a) use ($key, $keyId, $table, $suffix, $typeField) {
            if ($key && $keyId) {
                Manager::getService("account")->update(
                    "$table/" . (int)$a->get($key) . $suffix,
                    new Shape(["data" => [
                        $typeField => (int)$a->get($keyId)
                    ]])
                );
            }
        };
    }

    /**
     * @param string $dataKey
     * @param array<int|string, string> $keyMap
     * @return callable
     */
    public static function create(string $dataKey, array $keyMap, int $initialStatus = 0): callable
    {
        return function (Shape $a) use ($dataKey, $keyMap, $initialStatus) {
            $data = $a->getShape($dataKey)->keys($keyMap);
            $data->set(
                "type_id",
                $a->getCollection("account_types")->filterByField("label", "specialist")->getFirst()->get("id")
            );

            $fields =  $data->toArray();
            $fields["status"] = $initialStatus;

            $res = Manager::getService("account")->write(
                "account",
                new Shape(["data" => $fields])
            );

            if ($res->getShape("info")->get("http_code") === 200) {
                $aid = intval($res->getShape("json")->get("data.id"));
                $a->set("aid", $aid);
                $a->set("account", $data->set("id", $aid));
                if (isset($fields["vat"])) {
                    Manager::getService('account')->update(
                        "account/$aid/meta",
                        new Shape([
                            'data' => [
                                "vat_number"  => $fields["vat"],
                                "utr_number"  => $fields["utr"] ?? ""
                            ]
                        ])
                    );
                }
            } else {
                $error = $res->get("content");
                if (!$error) {
                    $error = "Reason Unknown";
                }
                throw new MiddlewareException(
                    "failedSignup",
                    "Failed to create prosper account : $error"
                );
            }
        };
    }

    /**
     * @return callable
     */
    public static function cleanUsers(): callable
    {
        return function (Shape $a) {
            $users = $a->getShape("account")->getCollection("users");
            if ($users->count()) {
                foreach ($users as $user) {
                    Manager::getService("account")->delete("user/" . $user->get("id"));
                }
            }
        };
    }

    /**
     * @param string $dataKey
     * @param array<int|string, string> $keyMap
     * @return callable
     */
    public static function createUser(string $dataKey, array $keyMap): callable
    {
        return function (Shape $a) use ($dataKey, $keyMap) {
            $data = $a->getShape($dataKey)->keys($keyMap);
            if (!$data->get("type_id")) {
                $data->set("type_id", $a->getCollection("user_types")->filterByField("label", "team_admin")->getFirst()->get("id"));
            }
            $data->set('account_id', $a->get("aid"));

            $res = Manager::getService("account")->write(
                "user",
                new Shape(["data" => $data->toArray()])
            );

            if ($res->getShape("info")->get("http_code") === 200) {
                $id = $res->getShape("json")->get("data.id");
                $user = $data->set("id", $id);
                $a->set("uid", $id);
                $a->set("account",  $a->getShape("account")->set("users", [$user]));
                $a->set("new_user", $user);
            } else {
                $error = $res->get("content");
                if (!$error) {
                    $error = "Reason Unknown";
                }
                throw new MiddlewareException(
                    "failedSignup",
                    "Failed to create prosper user : $error"
                );
            }
        };
    }

    /**
     * @param string $dataKey
     * @param array $keyMap
     * @return callable
     */
    public static function createOrganisationMember(string $dataKey, array $keyMap): callable
    {
        return function (Shape $a) use ($dataKey, $keyMap) {
            $data = $a->getShape($dataKey)->keys($keyMap);
            $role = $data->get("role");
            $aid  = $a->get("uriArgs.aid", $a->get("aid", $data->get("id")));
            if($data->get("role_id")){
                $role = null;
            }
            if(!$data->get("user_id") || $data->get("id")){
                $firstname = $data->get("firstname");
                $lastname = $data->get("lastname");
            }
            $res = Manager::getService("account")->write(
                "account/$aid/organisation",
                new Shape(["data" => [
                    'type_id'           => $data->get("role_id"),
                    'user_id'           => $data->get("user_id") ?? $data->get("id"),
                    'user_firstname'    => $firstname ?? null,
                    'user_lastname'     => $lastname ?? null,
                    'user_email'        => $data->get("email"),
                    'user_phone'        => $data->get("contact_number"),
                    'account_id'        => $aid,
                    'custom_type_label' => $role,
                ]])
            );


            if ($res->getShape("info")->get("http_code") === 200) {
                $id = $res->getShape("json")->get("data.id");
                $a->set("id", $id);
            } else {
                $error = $res->get("content");
                if (!$error) {
                    $error = "Reason Unknown";
                }
                throw new MiddlewareException(
                    "failedSignup",
                    "Failed to create organisation member : $error"
                );
            }

        };
    }

    /**
     * @param string $accountKey
     * @param string $memberKey
     * @param string $dataKey
     * @param array $keyMap
     * @return callable
     */
    public static function updateOrganisationMember(string $accountKey, string $memberKey, string $dataKey, array $keyMap): callable
    {
        return function (Shape $a) use ($accountKey, $memberKey, $dataKey, $keyMap) {
            $data = $a->getShape($dataKey)->keys($keyMap);
            $role = $data->get("role");
            if($data->get("role_id")){
                $role = '';
            }
            Manager::getService("account")->update(
                sprintf("account/%s/organisation/%s", $a->get($accountKey), $a->get($memberKey)),
                new Shape(["data" => [
                    'type_id'           => $data->get("role_id"),
                    'firstname'         => $data->get("firstname"),
                    'lastname'          => $data->get("lastname"),
                    'display_name'      => $data->get("display_name"),
                    'contact_number'    => $data->get("contact_number"),
                    'user_email'        => $data->get("email"),
                    'user_id'           => $data->get("user_id"),
                    'custom_type_label' => $role,
                ]])
            );
        };
    }

    /**
     * @param string $accountKey
     * @param string $memberKey
     * @return callable
     */
    public static function removeOrganisationMember(string $accountKey, string $memberKey): callable
    {
        return function (Shape $a) use ($accountKey, $memberKey) {
            try{
                Manager::getService("account")->delete(sprintf("account/%s/organisation/%s", $a->get($accountKey), $a->get($memberKey)));
            }catch (\Exception $e){
                throw new \Exception("Organisation member couldn't be removed");
            }
        };
    }

    /**
     * @param string $urlPrefix
     * @param string $srcEmailKey
     * @return callable
     */
    public static function generateActivationLink(string $urlPrefix, string $srcEmailKey = "email"): callable
    {
        return function (Shape $a) use ($urlPrefix, $srcEmailKey) {
            $res = Manager::getService("account")->fetch('account/activation_link/' . $a->get($srcEmailKey));
            $token = strval($res->getShape("data")->get("token"));
            $a->setItems([
                'token'           => $token,
                'activation_link' => rtrim($urlPrefix, "/") . "/" . $token
            ]);
        };
    }

    /**
     * @param string $tokenKey
     * @param array $data
     * @return callable
     */
    public static function updateMetaToken(string $tokenKey = "token", array $data = []): callable
    {
        return function (Shape $a) use ($tokenKey, $data) {
            $token = $a->get($tokenKey, []);
            Manager::getService("account")->update('token/' . $token . '/meta', new Shape(['data' => $data]));
        };
    }

    /**
     * @param string $label
     * @param string $idField
     * @return callable
     */
    public static function setMembership(string $label, string $idField): callable
    {
        return function (Shape $a) use ($label, $idField) {
            $id = $a->int($idField);
            if ($id) {
                $subscriptions = $a->getCollection("account_subscriptions");
                $item = $subscriptions->filterByStringField("label", $label)->getFirst();
                if ($item->hasData()) {
                    $res = Manager::getService("account")->update(
                        "account/$id/membership",
                        new Shape(["data" => ["subscription_id" => $item->int("id")]])
                    );
                } else {
                    throw new \Exception("Invalid subscription type " . $label);
                }
            } else {
                throw new \Exception("No Account id set");
            }
        };
    }

    /**
     * @param int $tokens_amount
     * @param string $idField
     * @param string $topUpWeekKey
     * @return callable
     */
    public static function setMembershipTokens(int $tokens_amount, string $idField, string $topUpWeekKey = 'week'): callable
    {
        return function (Shape $a) use ($tokens_amount, $idField, $topUpWeekKey) {
            $id = $a->int($idField);
            if ($id) {
                $meta = [
                    'tokens' => $tokens_amount
                ];
                if($a->get($topUpWeekKey)){
                    $meta['tokens_top_up_week'] = $a->get($topUpWeekKey);
                }
                Manager::getService('account')->update("account/$id/membership", new Shape([
                    'data' => [
                        'meta' => $meta
                    ]
                ]));
            } else {
                throw new \Exception("No Account id set");
            }
        };
    }

    /**
     * @param string $groupField
     * @param string $idField
     * @return callable
     */
    public static function setMembershipGroup(string $groupField, string $idField): callable
    {
        return function (Shape $a) use ($groupField, $idField) {
            $id = $a->int($idField);
            if ($id) {
                Manager::getService('account')->update("account/$id/membership", new Shape([
                    'data' => [
                        'meta' => ['group' => $a->string($groupField)]
                    ]
                ]));
            } else {
                throw new \Exception("No Account id set");
            }
        };
    }

    /**
     * @param string $idField
     * @return callable
     */
    public static function paymentRequest(string $idField): callable
    {
        return function (Shape $action) use ($idField) {
            $account = $action->getShape("session")->getShape("account");
            $id = (int)$account->get("id");
            try {
                $res = Manager::getService("account")->fetch('account/payment_request/' . $id)->getShape('data');
                if ($token = $res->get("token")) {
                    $action->set("token", $token);
                }
            } catch (\Exception $e) {
                throw new \Exception("The payment request cannot be processed");
            }
        };
    }

    /**
     * @return callable
     */
    public static function redirectToPayment(): callable
    {
        return function (Shape $action) {
            Generic::redirect($action->get("payment_link"))();
        };
    }

    /**
     * @return callable
     */
    public static function updateAccountMembership(): callable
    {
        return function (Shape $action) {
            $stripe_payment = (array)$action->get("payment_data");
            if (isset($stripe_payment['success']) && $stripe_payment['success']) {
                $stripe_payment['metadata'] = (object)$stripe_payment['metadata'];
                $token = $stripe_payment['metadata']->payment_token;

                if ($token) {
                    try {
                        $response = Manager::getService("account")->fetch("user/session/$token")->getShape("data");
                        $aid = intval($response->get("user.account_id"));
                        $membership = Manager::getService("account")->fetch("account/$aid")->getShape("data")->get("membership");
                        $meta = json_decode($membership['meta'], true);

                        $action->set("account", $response);

                        if (!isset($meta['tokens'])) {
                            $meta['tokens'] = 0;
                        }
                        $meta['tokens'] = (int)$meta['tokens'] + (int)$stripe_payment['meta']['tokens'];
                        try {
                            Manager::getService('account')->update("account/$aid/membership", new Shape([
                                'data' => [
                                    'meta' => $meta
                                ]
                            ]));

                            return;
                        } catch (\Exception $e) {
                            throw new MiddlewareException("stripeUpdateAccount", 'Account membership was not successfully changed');
                        }
                    } catch (\Exception $e) {
                        throw new MiddlewareException("stripeInvalidData", 'Stripe data is invalid');
                    }
                }
            }

            throw new MiddlewareException("stripePayment", 'Payment was not successfull');
        };
    }

    /**
     * @param string $tokenKey
     * @return callable
     */
    public static function loadByOptInToken(string $tokenKey): callable
    {
        return function ($action) use ($tokenKey) {
            $token = $action->get($tokenKey);
            $res = Manager::getService('account')->update("account/opt_in/$token", new Shape());
            if ($res->get("info.http_code") === 200) {
                $json = $res->json("content");
                if (is_array($json) && isset($json["data"])) {
                    $data = $json["data"];
                    $action->set("user", new Shape($data["user"] ?? []));
                    //We only get here if the response is 200 and the response body has data
                    return;
                }
            }
            throw new MiddlewareException("invalidToken", "Invalid token supplied");
        };
    }

    /**
     * @return callable
     */
    public static function loadSubcontractorData(): callable
    {
        return function ($action) {
            $user = $action->getShape("session")->getShape("user");
            $aid = $action->get("uriArgs.aid", $user->get("account_id"));

            $membership =  Manager::getService('account')->fetch("account/$aid/membership")->getShape("data");
            $meta = strval($membership->get("meta", ''));
            $meta = (array)json_decode($meta, true);
            $subscription_id = $action->get("account_subscriptions")->filterByField('label', $membership->get("label"))->getFirst()->get("id");

            $membership->setItems([
                'trial'     => (self::MEMBERSHIP_TRIAL_ID    == $subscription_id),
                'flexi'     => (self::MEMBERSHIP_FLEXI_ID    == $subscription_id),
                'regional'  => (self::MEMBERSHIP_REGIONAL_ID == $subscription_id),
                'meta'      => $meta
            ]);


            $trades = Manager::getService('account')->fetch("account/$aid/trades")->getCollection('data');
            /*
             * If the user has a regional membership we need to get the regions from the membership meta
             */
            if ($membership->get("regional")) {
                $regions = $meta['regions'] ?? [];
            } else {
                $regions = Manager::getService('account')->fetch("account/$aid/region", ['type_id' => self::REGION_TYPE_ID])->getCollection('data');
                $regions = $regions->values('region_id');
            }

            $action->set("subcontractor", [
                'user'              => $user,
                'aid'               => $aid,
                'regions'           => $regions,
                'trades'            => $trades->values('trade_id'),
                'membership'        => $membership
            ]);
        };
    }

    /**
     * @param string $tokensKey
     * @return callable
     */
    public static function canClaimFreeToken(string $tokensKey = 'top_up'): callable
    {
        return function ($action) use ($tokensKey) {
            $tokens = $action->get($tokensKey);
            $can_claim = false;
            if ($tokens) {
                if (
                    $action->get("subcontractor.membership.trial") ||
                    $action->get("subcontractor.membership.flexi") ||
                    $action->get("subcontractor.membership.external_subcontractor") ||
                    $action->get("subcontractor.membership.activated_supply_chain")
                ) {
                    $can_claim = true;
                }
            }
            $action->set("can_claim", $can_claim);
        };
    }

    /**
     * @param string $returnKey
     * @param string $currentWeekKey
     * @return callable
     */
    public static function hasTopUpTokens(string $returnKey = 'top_up', string $currentWeekKey = 'current_week'): callable
    {
        return function ($action) use ($returnKey, $currentWeekKey) {
            $top_up = (int)$action->get("top_up_tokens");
            $top_up_reset_week = (int)$action->get("top_up_tokens_reset_week", 1);
            $account = $action->getShape("session")->getShape("account");
            $meta = $account->get("membership.meta", '');
            if ($top_up) {
                $meta = json_decode($meta, true);
                $tokens = $meta['tokens'] ?? 0;
                $token_top_up_disabled = (isset($meta['tokens_top_up_disabled']) && $meta['tokens_top_up_disabled'] === "true");
                if(!$token_top_up_disabled) {
                    $current_week = (int)$action->get($currentWeekKey);
                    $tokens_reset_week = $meta['tokens_top_up_week'] ?? $current_week - 1;
                    if ( $current_week - $tokens_reset_week >= $top_up_reset_week ) {
                        $top_up_amount = ($tokens < $top_up) ? $top_up - $tokens : $top_up = 0;
                    }
                }
            }
            $action->set($returnKey, $top_up_amount ?? 0);
        };
    }


    /**
     * @param array $params
     * @return mixed
     */
    public static function getUnlockedProject($params = []): mixed
    {
        try {
            $projects = Manager::getService('account')->fetch("token_history/used", $params)->getCollection('data');
        } catch (\Exception $e) {
            $projects = null;
        }

        return $projects;
    }

    /**
     * @param string $contractorKey
     * @param string $subcontractorKey
     * @param string $setKey
     * @return callable
     */
    public static function getSupplyChainContractorData(string $subcontractorKey, string $contractorKey, string $setKey = 'supply_chain'): callable
    {
        return function ($action) use ($contractorKey, $subcontractorKey, $setKey) {
            $res = Manager::getService("account")->fetch(sprintf(
                "account/%s/supply_chain/subcontractor/%s",
                $action->get($contractorKey),
                $action->get(
                    $subcontractorKey
                )
            ))->getShape("data");
            $action->set($setKey, $res->get());
        };
    }

    /**
     * @param string $resultKey
     * @return callable
     */
    public static function loadDistances(string $resultKey = 'distances'): callable
    {
        return function ($action) use ($resultKey) {
            try {
                $res = Manager::getService("account")->fetch("distance", ['origin' => $action->get("origin")])->getCollection("data");
                $res->map(function ($distance) use (&$distances) {
                    $distances['origin'][]      = $distance->get("origin");
                    $distances['destination'][] = $distance->get("destination");
                    $distances['distance'][]    = json_decode($distance->get("distance", ''));
                });
            } catch (\Exception $e) {
                $distances = [];
            }
            $action->set($resultKey, $distances);
        };
    }

    /**
     * @param array $distances
     * @return callable
     */
    public static function addDistances(array $distances): callable
    {
        return function ($action) use ($distances) {
            try {
                Manager::getService("account")->write(
                    "distance",
                    new Shape(["data" => $distances])
                );
            } catch (\Exception $e) {
                throw new MiddlewareException(
                    "relayError",
                    $e->getMessage()
                );
            }
        };
    }

    /**
     * @param string $accountKey
     * @param string $resultKey
     * @return callable
     */
    public static function loadUserEngagement(string $accountKey, string $resultKey = 'engagement'): callable
    {
        return function ($action) use ($accountKey, $resultKey){
            try {
                $uid = (int)$action->get($accountKey);
                $engagement = Manager::getService('account')->fetch("user/$uid/engagement")->getCollection('data');
            } catch (\Exception $e) {
                $engagement = null;
            }

            $action->set($resultKey, $engagement);
        };
    }

    /**
     * @param string $key
     * @param string $resultKey
     * @return callable
     */
    public static function countTotalEngagement(string $key = 'engagement', string $resultKey = 'engagement_total'): callable
    {
        return function ($action) use ($key, $resultKey){
            $total = 0;
            array_map(function ($value) use (&$total) {
                if ( !$value ) {
                    $value = 1;
                }
                $total += $value;
            }, $action->get($key)->values("token_usage"));
            $action->set($resultKey, $total);
        };
    }

    /**
     * @param string $key
     * @param int $previous_days
     * @param string $resultKey
     * @return callable
     */
    public static function filterEngagementByPreviousDays(int $previous_days = 30, string $key = 'engagement', $resultKey = 'engagement_filtered'): callable
    {
        return function ($action) use ($key, $previous_days, $resultKey){
            $today = $action->get("current_day", new DateTime());
            $days = $today->sub(new DateInterval(sprintf("P%sD", $previous_days)))->format('Y-m-d');
            $filteredEntries = array_filter($action->get($key)->getItemsAsArray(), function ($entry) use ($days) {
                return $entry['created_at'] >= $days;
            });

            $action->set($resultKey, $filteredEntries);
        };
    }


    /**
     * We override the base accountMiddleware as Propser users can either be prosper or external as this was broken for password reset
     * @param string $usernameKey
     * @param string $passwordKey
     * @param int $accountType
     * @return callable
     */
    public static function logUserIn(string $usernameKey, string $passwordKey, array $validAccountTypes): callable
    {
        return function($a) use($usernameKey, $passwordKey, $validAccountTypes) {
            if($accountTypeOverride = $a->get("account.type_id")) {
                $accountType = (int) $accountTypeOverride;
            }

            if(!in_array($accountType, $validAccountTypes)) {
                throw new MiddlewareException("InvalidUserTypeLogin", "An attempt was made to login as a non prosper user");
            }
            return CoreAccountMiddleware::logUserIn($usernameKey, $passwordKey, $accountType)($a);
        };
    }

    /**
     * @param bool $sendActivationEmail
     * @return callable
     */
    public static function activateProsperAccount(): callable
    {
        return function ($a) {
            Conditional::isTrue(true, [ // Use this to avoid set ($a) after each action
                CoreAccountMiddleware::loadTokenTypes("auto_loader"),
                CoreAccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                Form::validate(FormValidation::getSignature("supply_chain_portal")),
                CoreAccountMiddleware::existsByToken("uriArgs.token", "supply_chain"),
                TeamManagerModel::getteammembertypeids("account_holder"),
                function ($a) {
                    $aid = $a->get("account.user.account_id");
                    CoreAccountMiddleware::getService()->update("account/$aid", new Shape([
                        'data' => [
                            'name' => $a->get("validated_form")->get("company_name"),
                            'reg_number' => $a->get("validated_form")->get("registered_company_number"),
                            'email' => $a->get("validated_form")->get("email"),
                            'mobile' => $a->get("validated_form")->get("mobile"),
                            'address' => $a->get("validated_form")->get("company_address")
                        ]
                    ]));

                    $subscriptionId = $a->get("account_subscriptions")->filterByField('uid', "activated_supply_chain")->getFirst()->get("id");
                    $idRegion = $a->get("account.account.region_group_id", 0);
                    if ($idRegion) {
                        CoreAccountMiddleware::load("region/group", '', 'regions')($a);
                        $result = $a->get("regions")->filterByField('id', $idRegion);
                        $region = $result->count() ? $result->getFirst() : null;
                        $regionCode = $region ? $region->get("code") : null;
                        if (in_array($regionCode, self::ANZ_REGION_CODE)) {
                            //if the account is external we don't want to change the subscription to national
                            if($a->int("account.account.type_id") !== self::EXTERNAL_SUBCONTRACTOR_TYPE_ID) {
                                $subscriptionId = $a->get("account_subscriptions")->filterByField('uid', "national")->getFirst()->get("id");
                            }
                        }
                    }
                    CoreAccountMiddleware::getService()->update("account/$aid/membership", new Shape([
                        'data' => ['subscription_id' => $subscriptionId]
                    ]));
                    $uid = $a->get("account")->get("user.id");
                    $account_data = [
                        'email' => $a->get("validated_form")->get("email"),
                        'firstname' => $a->get("validated_form")->get("contact_name"),
                        'lastname' => '',
                        'status' => self::STATUS_CONFIRMED_ACTIVATED,
                        'display_name' => $a->get("validated_form")->get("contact_name"),
                        'password' => $a->get("validated_form")->get("password"),
                    ];
                    if ($a->get("team_admin_ids")) {
                        $type_ids = $a->get("team_admin_ids", []);
                        $type_id = array_shift($type_ids);
                        if ($type_id) {
                            $account_data['type_id'] = $type_id;
                        }
                    }
                    CoreAccountMiddleware::getService()->update("user/$uid/profile", new Shape([
                        'data' => $account_data
                    ]));
                    if ($meta = $a->get("account.meta", '')) {
                        $main_contractor     = json_decode($meta);
                        $main_contractor_aid = $main_contractor->contractor_aid ?? null;
                        if ($main_contractor_aid) {
                            $a->set("main_contractor_aid", $main_contractor_aid);
                        }
                    }
                },
                ProsperAccountMiddleware::getSupplyChainContractorData("account.user.account_id", "main_contractor_aid"),
                function ($a) {
                    $a->set("aid", $a->get("account.user.account_id"));
                    CompanyProfileMiddleware::updateCompanyOfferings('trades', 'supply_chain.trades')($a);
                    CompanyProfileMiddleware::updateCompanyOfferings('region', 'supply_chain.regions')($a);
                },
                function ($a) {
                    //Create an autologin token and loged in the user
                    CoreAccountMiddleware::createUserToken(
                        "account.user.id",
                        "token_type",
                        Config::getUrl("site_url", "account/auto_loader")
                    )($a);
                    $a->set("isActivated", $a->get("validated_form")->get("is_the_account_activated") === "on");
                    $idEmailWelcome = Config::get("hubspot_emails.welcome_message");
                    $a->setItems([
                        "hubspot_welcome_email" => $idEmailWelcome,
                        "isActivated" => $a->get("validated_form")->get("is_the_account_activated") === "on",
                        "activation_link"       => sprintf("%s/redirect=projects/enquiries", $a->get("token_url")),
                        "hubspot_data" => [
                            'is_the_account_activated_' => true,
                        ]
                    ]);
                },
                Conditional::isTrue("isActivated", [
                    HubspotMiddleware::updateByEmail("account.account.email"),
                    function ($a) {
                        Hubspot::emailByIdKey(
                            "hubspot_welcome_email",
                            "account.account.email",
                            customPropMap: ["activation_link" => "token_url", "account.user.firstname" => "firstname"],
                            serviceId: "prosper_hubspot"
                        )($a);
                    }
                ], true),
                function ($a) {
                    $a->set("redirect_to", sprintf("%s/redirect=projects/enquiries", $a->get("token_url")));
                }
            ])($a);
        };
    }
}
