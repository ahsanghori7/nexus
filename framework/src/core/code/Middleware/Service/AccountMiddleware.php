<?php

namespace Core\Middleware\Service;
use Core\Config;
use Core\Middleware\Generic;
use Core\Middleware\Conditional;
use Core\Middleware\ServiceMiddleware;
use Core\Service\Exception\RestException;
use Core\Service\Manager;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Rest;
use Core\Middleware\Session;
use Core\Router\Route\Helper;

class AccountMiddleware extends ServiceMiddleware
{
    const SERVICE = 'account';

    const SUBCONTRACTOR_TYPE = ["specialist", "external_subcontractor"];

    const MAIN_CONTRACTOR_TYPE = ["main-contractor"];

    const ADMIN_TYPE = ["administrator"];

    const EXTERNAL_ACCOUNT_TYPE = 4;

    /**
     *  MD5 hash of the string external_account_id to be
     *  used as a constant for external account s3 path
     */
    const EXTERNAL_ACCOUNT_HASH = '58fde4ab3885868bd4f0ac606c609b5c';

    /**
     * @param string $dataKey
     * @param string $label
     * @param string $saveKey
     * @param string $appKey
     * @return callable
     */
    public static function existsByToken(string $dataKey, string $label, string $saveKey = "account", string $appKey = ""): callable
    {
        return function ($action) use($dataKey, $label, $saveKey, $appKey) {

            $tokenKey = $action->get($dataKey);
            if(!$tokenKey) {
                throw new MiddlewareException("Token key ($dataKey) is falsy and or missing from shape");
            }
            try {
                $params = ['label' => $label];

                if($appKey) {
                    $app = $action->get($appKey);
                    if ( $app ) {
                        $params['app'] = $app;
                    }
                }

                $token = Manager::getService('account')->fetch("token/verify/$tokenKey", $params)->get("data");
                if($token->hasData()){
                    $action->set($saveKey, $token);
                }
            }catch(\Exception $e) {
                throw new MiddlewareException("invalidToken", "Invalid token supplied");
            }
        };
    }

    /**
     * @param string $dataKey
     * @param string $property
     * @param bool $userFallback
     * @param bool $skipAccount
     * @return callable
     */
    public static function existsByKey(string $dataKey, string $property, bool $userFallback = false, bool $skipAccount = false): callable
    {
        return function ($action) use($dataKey, $property, $userFallback, $skipAccount) {
            $check   = $action->get($dataKey);
            if($skipAccount) {
                $account = new Shape();
                $userFallback = true;
            } else {
                $account = Manager::getService('account')->fetch("account", [$property => urldecode($check)])->getCollection("data")->first();
            }

            if($account->hasData()) {
                $action->set("account", $account);
            }
            else if($userFallback) {
                $user = Manager::getService('account')->fetch("user",  [$property => urldecode($check)])->getCollection("data")->first();
                if($user->hasData()) {
                    $action->set("user", $user);
                    $action->set("account",
                        Manager::getService('account')->fetch("account/" . strval($user->get("account_id")))->get("data")
                    );
                }
            }
            $action->set("exists", $account->hasData() || (isset($user) && $user->hasData()));
        };
    }

    /**
     * @param string $emailKey
     * @param string $uri
     * @param string $saveKey
     * @return callable
     */
    public static function generatePasswordResetLink(string $emailKey, string $uri, string $saveKey = "token_url"): callable
    {
        return function (Shape $action) use($emailKey, $uri, $saveKey) {
            $email = strval($action->get($emailKey));
            if($email) {
                try{
                    $res = Manager::getService('account')->fetch("user/reset_password/$email");
                    if($res->get("info.http_code") === 200) {
                        $action->set("reset_password", $res->getShape("data"));
                        $action->set($saveKey, $uri . "/" .  $action->get("reset_password.token"));
                    }
                } catch(RestException $e) {
                    if($e->getCode() === 404) {
                        $error = "failed to find user with email $email";
                    }
                    else {
                        $error = "Failed to get reset password token for user with email $email";
                    }
                    throw new MiddlewareException("failedPasswordReset", $error);
                }
            }
        };
    }

    /**
     * @param string $passwordKey
     * @param string $tokenKey
     * @return callable
     */
    public static function resetPassword(string $passwordKey, string $tokenKey): callable
    {
        return function (Shape $action) use($passwordKey, $tokenKey) {
            $password = $action->get($passwordKey);
            $token    = $action->get($tokenKey);
            if($password && $token) {
                $res = Manager::getService('account')->write("user/renew_password", new Shape([
                    "data" => ["password" => $password, "token" => $token]
                ]));


                if($res->get("info.http_code") !== 200) {
                    throw new \Exception("Failed password reset request");
                }
                else {
                    $json = $res->json("content");
                    if(is_array($json) && isset($json["data"])) {
                        $action->set("user", new Shape($json["data"]["user"] ?? []));
                    }
                }
            }
        };
    }

    /**
     * @param string $usernameKey
     * @param string $passwordKey
     * @param int $accountType
     * @return callable
     */
    public static function logUserIn(string $usernameKey, string $passwordKey, int $accountType): callable
    {
        return function ($action) use ($usernameKey, $passwordKey, $accountType) {
            $password = $action->get($passwordKey);
            $username = $action->get($usernameKey);
            if($password && $username) {
                $res = Manager::getService('account')->write("user/session", new Shape([
                    "data" => ["password" => $password, "username" => $username, "type_id" => $accountType]
                ]));

                if($res->get("info.http_code") === 200) {
                    $json = $res->json("content");
                    if(is_array($json) && isset($json["data"])) {
                        $action->set("user",  new Shape($json["data"]["user"] ?? []));
                        $action->set("token", $json["data"]["token"] ?? "");
                    }
                }
                else {
                    throw new MiddlewareException("invalidUserLogin", "Invalid user or password");
                }
            }
        };
    }

    /**
     * @param string $tokenKey
     * @param Shape $config
     * @return callable
     */
    public static function initActivationAccountProcess(Shape $sessionCookie, string $tokenKey = "uriArgs.token"): callable
    {
        return function ($a) use($tokenKey, $sessionCookie)  {
            $tokenCode = $a->get($tokenKey);
            $token = Manager::getService('account')->fetch('token', ['token' => $tokenCode])->getCollection('data');
            if($token->count() && !intval($token->getFirst()->get('active'))){
                $a->set("company_already_active", true);
            }
            Conditional::hasKey(
                "company_already_active",
                [
                    function ($a) {
                        $a->set("redirect_to", Config::getUrl("site_url", "sign-up/contact-already-active"));
                    }
                ],
                [
                    AccountMiddleware::existsByToken($tokenKey, "activation_link"),
                    AccountMiddleware::activateAccount($tokenKey),
                    Session::setCookie(strval($sessionCookie->get("name")), "token", $sessionCookie),
                    function ($a) {
                        $a->set("redirect_to", Config::get("signup_email_thank_you")."?token=".$a->get("token"));
                    },

                ]
            )($a);
        };
    }

    /**
     * @param string $tokenKey
     * @return callable
     */
    public static function activateAccount(string $tokenKey): callable
    {
        return function ($action) use($tokenKey)  {
            $token = $action->get($tokenKey);
            $res = Manager::getService('account')->update("account/activate_account/$token", new Shape());
            if($res->get("info.http_code") === 200) {
                $json = $res->json("content");
                if(is_array($json) && isset($json["data"])) {
                    $data = $json["data"];
                    $action->set("token", $data["token"] ?? "");
                    $action->set("user", new Shape($data["user"] ?? []));
                    //We only get here if the response is 200 and the response body has data
                    return;
                }
            }
            throw new MiddlewareException("invalidToken", "Invalid token supplied");
        };
    }

    /**
     * @param string $tokenKey
     * @return callable
     */
    public static function autoLoader(string $tokenKey): callable
    {
        return function ($action) use($tokenKey)  {

            $token = $action->get($tokenKey);

            $res = Manager::getService('account')->update("account/auto_loader/$token", new Shape());
            if($res->get("info.http_code") === 200) {
                $json = $res->json("content");
                if(is_array($json) && isset($json["data"])) {
                    $data = $json["data"];
                    $action->set("token", $data['token'] ?? '');
                    $action->set("user", new Shape($data["user"] ?? []));
                    //We only get here if the response is 200 and the response body has data
                    return;
                }
            }
            throw new MiddlewareException("invalidToken", "Invalid token supplied");
        };
    }

    /**
     * @param string $redirectKey
     * @param string $redirectKeyArgs
     * @return callable
     */
    public static function redirect(string $redirectKey, string $redirectKeyArgs = '') : callable {
        return function(Shape $action) use($redirectKey, $redirectKeyArgs){
            $redirect = $action->get($redirectKey, "login");
            if($action->get($redirectKeyArgs)){
                $args = $action->get($redirectKeyArgs)->get();
                $args = http_build_query($args);
                $redirect .= "?" . $args;
            }
            Generic::redirect(Config::getUrl("site_url", $redirect))();
        };
    }

    /**
     * @param string $tokenKey
     * @param string $emailKey
     * @return callable
     */
    public static function unsubscribe(string $tokenKey, string $emailKey): callable
    {
        return function ($action) use($tokenKey, $emailKey)  {
            $token = $action->get($tokenKey);
            $email = $action->get($emailKey);
            $res = Manager::getService('account')->update("email/unsubscribe/$token/$email", new Shape());
            if($res->get("info.http_code") === 200) {
                return;
            }
            throw new MiddlewareException("invalidToken", "Invalid token supplied");
        };
    }

    /**
     * @param string $nameKey
     * @param string $saveKey
     * @return callable
     */
    public static function loadByName(string $nameKey, string $saveKey = "named_account", $failOnNone=false): callable
    {
        return function ($action) use ($nameKey, $saveKey, $failOnNone) {
            $name = $action->get($nameKey);
            $account_exist = Manager::getService('account')->fetch("account", ['name' => $name])->getCollection('data');
            if($account_exist->count()){
                $action->set($saveKey, $account_exist->getFirst());
            } elseif ($failOnNone) {
                throw new MiddlewareException("badRequest", "Failed to find account for name $name.");
            }
        };
    }

    /**
     * @param string $emailKey
     * @param string $saveKey
     * @return callable
     */
    public static function loadByEmail(string $emailKey, string $saveKey = "account"): callable
    {
        return function ($action) use ($emailKey, $saveKey) {
            $email = $action->get($emailKey);
            if(!$email) {

                throw new MiddlewareException("Email key ($emailKey) is falsy and or missing from shape");
            }

            $account_exist = Manager::getService('account')->fetch("account", ['email' => $email])->getCollection('data');

            if($account_exist->count()){
                $action->set($saveKey, $account_exist->getFirst());
            }
        };
    }

    /**
     * @param string $idKey
     * @param string $saveKey
     * @return callable
     */
    public static function loadById(string $idKey, string $saveKey = "account"): callable
    {
        return function ($action) use ($idKey, $saveKey) {
            $id = $action->get($idKey);
            if(!$id) {
                throw new MiddlewareException("Id key ($idKey) is falsy and or missing from shape");
            }
            $account_exist = Manager::getService('account')->fetch("account/$id")->getShape('data');
            $action->set($saveKey, $account_exist);
        };
    }

    /**
     * @param string $type
     * @param string $prefix
     * @param string $setKey
     * @return callable
     */
    public static function load(string $type, string $prefix = 'account', string $setKey = ''): callable {
        return function ($action) use($type, $prefix, $setKey) {
            $path = !$prefix ? $type : "$prefix/$type";
            $setKey = $setKey ?: "account_" . $type . "s";
            $action->set($setKey, Manager::getService('account')->fetch($path)->getCollection('data'));
        };
    }

    /**
     * @param string $type
     * @return callable
     */
    public static function loadAccountsByType(string $type = ''): callable {
        return function ($action) use($type) {
            $filter = [];
            if($type) {
              self::load("type")($action);
              $type = $action->get("account_types")->filterByStringField("label", $type)->getFirst();
              $filter['type_id'] = $type->get("id");
            }
            $action->set("accounts",
              Manager::getService('account')->fetch("account/all", $filter)->getCollection('data')
            );

        };
    }

    /**
     * @param string $k
     * @param int $chunk
     * @param string $key
     * @return callable
     */
    public static function loadAccountsByIdArray(string $k, int $chunk = 50, string $key = 'accounts'): callable {
        return function ($action) use($k, $chunk, $key) {
            $ids = $action->getArray($k);
            $accounts = [];
            foreach(array_chunk($ids, $chunk) as $group) {
                $ids = "[". implode(",", $group)  ."]";
                $data = Manager::getService('account')->fetch("account/$ids")->getCollection('data');
                foreach($data as $item) {
                    $item->set("logo", self::getAccountLogoUrl((int)$item->get("id"), (int) $item->get("type_id")));
                    $accounts[] = $item->toArray();
                }
            }
            $action->set($key, $accounts);
            return $action;
        };
    }

    /**
     * @param int $account_id
     * @param int $type_id
     * @param string $logo
     * @return string
     */

    public static function getAccountLogoUrl(int $accountId, int $accountType): string
    {
        $hash = self::EXTERNAL_ACCOUNT_HASH;
        if ($accountType !== self::EXTERNAL_ACCOUNT_TYPE) {
            $hash = md5($accountId);
        }
        return sprintf(
            "%s/%s/logo.png",
            Config::getUrl("logo.account"),
            $hash
        );
    }


    /**
     * @return callable
     */
    public static function loadTypes(): callable {
        return function ($action) {
            return self::load("type")($action);
        };
    }

    /**
     * @param string $label
     * @return callable
     */
    public static function loadTokenTypes(string $label = ""): callable {
        return function ($action) use($label) {
            $action->set("token_types",
                Manager::getService('account')->fetch("token/type")->getCollection("data")
            );
            if($label) {
                $action->set("token_type", $action->getCollection("token_types")->filterByField("label", $label)->first());
            }
        };
    }

    /**
     * @param string $userIdKey
     * @param string $tokenKey
     * @param string $urlPrefix
     * @param array $meta
     * @return callable
     */
    public static function createUserToken(string $userIdKey, string $tokenKey, string $urlPrefix = "", array $meta = []): callable {
        return function($shape) use($userIdKey, $tokenKey, $urlPrefix, $meta) {
            $token  = $shape->getShape($tokenKey);
            $userId = intval($shape->get($userIdKey));

            if($token->has("id") && $userId) {
                $res = Manager::getService('account')->write("token", new Shape([
                    'data' => [
                        'user_id' => $userId,
                        'type_id' => $token->get("id"),
                        'meta'    => $meta
                    ]
                ]));
                if ( $res->getShape("info")->get("http_code") === 200 ) {
                    $token = $res->getShape("json")->get("data.token");
                    $shape->set("token", $token);
                    if($urlPrefix) {
                        $shape->set("token_url", $urlPrefix . "/" . $token);
                    }
                }
                else {
                    throw new MiddlewareException("failed_token",
                        "failed to create token of type " . $token->get("label") . " for user id $userId"
                    );
                }
            }
            else {
                // throw new MiddlewareException("failed_token",
                //     "failed to create token of missing token or user data"
                // );
            }
        };
    }

    /**
     *  Set a list of trades as a collection
     *  [Shape : [id : int, lable : str]  ]
     *  @return callable
     */
    public static function loadTrades($setKey = "trades", callable $callback = null): callable {
        return function ($action) use($setKey, $callback) {
            $action->set($setKey, Manager::getService('account')->fetch("trade")->getCollection('data'));
            if($callback) {
                $callback($action, $setKey);
            }
        };
    }

    /**
     * @return callable
     */
    public static function loadSubscriptions(int $websiteId = 0): callable {
        return function ($action) use($websiteId) {
            self::load("subscription")($action);
            if($websiteId) {
                $action->set("account_subscriptions",
                    $action->getCollection("account_subscriptions")->filterByField("website_id", $websiteId, cast:"int")
                );
            }
        };
    }

    /**
     * @param string $subscriptionIdField
     * @return callable
     */
    public static function loadSubscription(string $subscriptionIdField): callable {
        return function ($action) use($subscriptionIdField) {
            $subscriptionIdField = $action->get($subscriptionIdField);
            if($subscriptionIdField) {
                $action->set("account_subscription",
                    $action->getCollection("account_subscriptions")->filterByField("id", (int)$subscriptionIdField, cast: "int")
                );
            }
        };
    }

    /**
     * @param string $contractorKey
     * @param string $subcontractorKey
     * @param string $setKey
     * @return callable
     */
    public static function existInSupplyChain(string $subcontractorKey, string $contractorKey, string $setKey = 'exist'): callable {
        return function ($action) use($contractorKey, $subcontractorKey, $setKey) {
            $res = Manager::getService("account")->fetch(sprintf("account/%s/supply_chain/subcontractor/%s",
                $action->get($contractorKey),
                $action->get($subcontractorKey
            )))->getShape("data");
            $action->set($setKey, (bool)$res->get("exist"));
        };
    }

    /**
     * @param string $serviceId
     * @param Shape $config
     * @return Callable
     * @throws \Exception
     */
    public static function updateSubscription(string $serviceId, Shape $config): callable
    {
        $service  = Manager::getService($serviceId);
        $resource = strval($config->get("resource", ""));
        $method   = strval($config->get("method", "fetch"));

        return function ($shape) use ($service, $resource, $method) {
            if (method_exists($service, $method)) {
                $aid = $shape->get("uriArgs.aid");
                $idSubscription = $shape->get("uriArgs.id_subscription");
                $data = ['subscription_id' => $idSubscription];
                $resource = explode('/', $resource);
                $resource = $resource[0] . '/' . $aid . '/' . $resource[1];

                try {
                    /*
                     * Update account type from external_subcontractor to specialist
                     * when changing membership from External Subcontractor to Free Trial
                     */
                    $accountService = Manager::getService('account');

                    $account = $accountService->fetch("account/$aid")->getShape("data");
                    $accountMembership = $accountService->fetch("account/$aid/membership")->getShape("data");
                    $subscrition = $accountService->fetch("account/subscription/$idSubscription")->getShape("data");
                    $types = $accountService->fetch("account/type")->getCollection("data");
                    $externalSubcontractorType = $types->filterByField("label", "external_subcontractor")->first();
                    $specialistType = $types->filterByField("label", "specialist")->first();

                    if ($account->get('type_id') == $externalSubcontractorType->get('id') && $accountMembership->get('label') == "External Subcontractor" && $subscrition->get('uid') == "free_trial_prosper") {
                        $accountService->update("account/$aid", new Shape([
                            'data' => [
                                'type_id' => $specialistType->get('id')
                            ]
                        ]));
                    }

                    $service->update($resource, new Shape(['data' => $data]));
                    $data = $shape->getRoute()->getRequest()->getData();
                    $json = $data->getShape("json");
                    /*
                     * Update account region
                     */
                    $region_ids = $json->get("region", []);
                    if ($region_ids) {
                        $meta = ['regions' => $region_ids];
                    }
                    /*
                     * Update account membership tokens
                     */
                    $tokens = $json->get("tokens");
                    if ($tokens) {
                        $meta = ['tokens' => $tokens];
                    }

                    Manager::getService('account')->update("account/$aid/membership", new Shape([
                        'data' => [
                            'meta' => $meta
                        ]
                    ]));
                } catch (RestException $e) {
                    throw new MiddlewareException(
                        "relayError",
                        $e->getMessage()
                    );
                }
            }
        };
    }

    /**
     * @param string $userKey
     * @param string $tokenTypeKey
     * @param int $seconds
     * @return \Closure
     */
    public static function loadRequestedLogins(string $userKey = 'user.id', string $tokenTypeKey = 'token_type.id', int $seconds = 3600)
    {
        return function ($a) use ($userKey, $tokenTypeKey, $seconds) {
            $res = Manager::getService("account")->fetch("token", ['user_id' => $a->get($userKey), 'token_type_id' => $a->get($tokenTypeKey)])->getCollection("data");
            $now      = date('Y-m-d H:i:s');
            $hour_ago = date('Y-m-d H:i:s', strtotime($now) - $seconds);
            $requests = [];
            $res->map(function($request) use ($now, $hour_ago, &$requests){
                $date = $request->get("created_at");
                if($date >= $hour_ago && $date <= $now) {
                    $requests[] = $request;
                }
            });
            $a->set("requests", $requests);
        };
    }

    /***
     * @param string $accountKey
     * @param array $types
     * @param callable $callback
     * @return callable
     */
    public static function ifIsATypeOf (
        array $types, callable $callback, bool $onlyCallbackOnTrue = false, string $typesKey="account_types", string $accountKey = "account"
    ) : callable {

        return function($a) use ($accountKey, $types, $typesKey, $callback, $onlyCallbackOnTrue) {
            $account = $a->getShape($accountKey);
            if($account) {
                $typesCollection = $a->get($typesKey);
                if(!$typesCollection) {
                    self::loadTypes()($a);
                    $typesCollection = $a->get("account_types");
                }

                $type   = $typesCollection->filterByField("id", $account->int("type_id"), cast:"int")->first();
                $isType =  in_array($type->get("label"), $types);
                if($onlyCallbackOnTrue && !$isType) {
                    return;
                }
                $callback($a, $account);;
            }
            else {
                throw new \Exception("Failed to find account at $accountKey");
            }
        };
    }

    /**
     * @param string $userShape
     * @return callable
     */
    public static function updateUser(string $userShape = 'team'): callable
    {
        return function ($action) use ($userShape) {
            $json = $action->getShape($userShape);
            Manager::getService('account')->update("user/" . $json->int("id") . "/profile", new Shape([
                'data' => [
                    "email"          => $json->get("email"),
                    "firstname"      => $json->get("firstname"),
                    "lastname"       => $json->get("lastname"),
                    "display_name"   => $json->get("firstname") . " " . $json->get("lastname"),
                    "contact_number" => $json->get("contact_number"),
                ]
            ]));
        };
    }

    /**
     * Get a model definition from the account service and validate the payload against it
     *
     * @param string $resource
     * @param string $payloadKey
     * @param string $modelName
     * @return callable
     */
    public static function validatePayload(string $resource, string $payloadKey = "payload", string $modelName = "", $multiple = false, $isSupplyChainFromPegasus = false, bool $isNonUk = false) {
        return function ($a) use ($resource, $payloadKey, $modelName, $multiple, $isSupplyChainFromPegasus, $isNonUk) {
            $payload = ($multiple) ? $a->get($payloadKey) : $a->getShape($payloadKey);
            if (!$payload) {
                throw new MiddlewareException("Empty Payload Supplied for key $payloadKey");
            }
            if($multiple && !is_array($payload)) {
                throw new MiddlewareException("Payload Supplied for key $payloadKey is not an array");
            }
            $uri = $resource;
            if ($modelName) {
                $uri .= "/" . $modelName;
            }
            $key = str_replace(".", "_", $uri);
            $model = Manager::getService('account')->fetch("model/describe/" . $uri)->getShape("data");
            $missing = [];
            $nonUkSkipFields = ['reg_number', 'mobile'];
            foreach($model->get("fields") as $field => $info) {
                $required = $info["required"] ?? false;
                if ($resource == 'account' && $field == 'reg_number' && $isSupplyChainFromPegasus == true) {
                    $required = false;
                }
                if ($resource == 'account' && $isNonUk && in_array($field, $nonUkSkipFields)) {
                    $required = false;
                }
                if($required) {
                    if($multiple) {
                        $collection = new Collection($payload);
                        foreach($collection as $index => $item) {
                        $v = $item->get($field);
                        if(!$v) {
                            $missing[$index][] = $field;
                        }
                        if($missing) {
                            $count = count($missing);
                                throw new MiddlewareException("InvalidPayload", "Invalid Payload " . $count . " items missing required fields");
                            }
                        }
                    }
                    else {
                        $v = $payload->get($field);
                        if(!$v) {
                            $missing[] = $field;
                        }
                    }
                }
            }
            if($missing) {
                throw new MiddlewareException("InvalidPayload", "Invalid Payload Missing Required Fields(" . implode(",", $missing) . ")");
            }
        };
    }

    /**
     * @return callable
     */
    public static function fetchAllAccounts(): callable
    {
        return function ($action) {
            $accounts = Manager::getService('account')->fetch("account/all")->getCollection("data");
            return $action->set("all_accounts", $accounts);
        };
    }

    /**
     * @param string $filterByValueKey
     * @param string $filterByColumn
     * @param string $accountKey
     * @param bool $returnAsList
     * @return callable
     */
    public static function filterAccount(string $filterByValueKey, string $filterByColumn = "name", string $accountKey = "subcontractor_account", bool $returnAsList = false): callable
    {
        return function ($action) use ($filterByValueKey, $filterByColumn, $accountKey, $returnAsList) {
            $accounts = $action->get('all_accounts')->filterByStringField($filterByColumn, strtolower($action->get($filterByValueKey)));
            if ($accounts->count() > 0) {
                $action->set($accountKey, $returnAsList ? $accounts : $accounts->first());
            }
        };
    }

    /**
     * @return callable
     */
    public static function fetchSupplyChain(): callable
    {
        return function ($action) {
            try {
                return Rest::fetchDynamic(
                    "account_v2",
                    "account/{account.id}/supply-chain",
                    Helper::getQueryParamsArray(
                        [
                            "limit" => [
                                "type" => "int", "default" => 25
                            ],
                            "offset" => ["type" => "int", "default" => 0],
                            "desc" => ["type" => "int", "default" => 0],
                            "order" => ["type" => "string", "default" => "company"],
                            "activated" => ["type" => "string", "default" => null],
                            "pqq_status" => ["type" => "string", "default" => null],
                            "trades", "regions", "attributes", "term"
                        ],
                        "request_args"
                    ),
                    "collection",
                    postProcessor: function($res, $a) {
                        $content = $res->json("content");
                        if(isset($content["links"])) {
                            $a->set("info", ["total" => $content["links"]["total"]]);
                        }
                        return $a;
                    }
                )($action);
            } catch (\Exception $e) {
                throw new MiddlewareException("serviceError", $e->getMessage());
            }
        };
    }

    /**
     * @return callable
     */
    public static function fetchSupplyChainByCustomPackage(): callable
    {
        return function ($action) {
            try {
                // get trades from custom package
                $packageIds = array_column($action->get('tender.packages'), 'package_id');
                $trades = $action->get('trades')->filterByExistInArray('id', $packageIds, false);

                // generate list of subcontractors from all trades
                $data = [];
                foreach ($trades as $trade) {
                    $res = Manager::getService('account_v2')->fetch(
                        sprintf("account/%s/supply-chain", $action->get('account.id')),
                        ["term" => $trade->get('label')]
                    );
                    $content = $res->json("content");
                    $data = [...$data, ...$content['data']];
                }
                $data = array_values(array_column($data, null, 'id'));

                $action->set("collection", $data);
                $action->set("info", ["total" => count($data)]);
            } catch (\Exception $e) {
                throw new MiddlewareException("serviceError", $e->getMessage());
            }
        };
    }
}
