<?php


namespace App\Api;

use App\Api\Document\Template;
use App\Api\Email\Email;
use App\core\Config;
use App\core\Request;
use App\core\Session;
use App\Factory\UserFactory;
use App\Models\Signatory;
use App\Models\User;
use App\Models\Account as AccountModel;
use App\Models\Subscription;
use App\Api\Hubspot;
use App\Api\Document\Validator as DocumentValidator;
use App\Api\S3;
use App\Models\UserModel;

class Account extends Client
{

    const DEFAULT_REGION_ID = 1;

    /**
     * Const values for each of the main account types.
     * Perhaps should be in config, or retirevied from the account service.
     */
    const MAIN_CONTRACTOR = "main-contractor";

    /**
     * const value of the account type of external accounts
     * @todo Should be loaded from the api
     */
    const EXTERNAL_ACCOUNT_TYPE = 4;

    const ACCOUNT_HOLDER_TYPE_ID = 5;

    /**
     * TEAM MEMBER TYPE ID
     */
    const USER_TEAM_MEMBER_TYPE = 3;

    /**
     *  MD5 hash of the string external_account_id to be
     *  used as a constant for external account s3 path
     */
    const EXTERNAL_ACCOUNT_HASH = '58fde4ab3885868bd4f0ac606c609b5c';
    const DEFAULT_JOB_TITLE = 'CEO/Director';
    const MEMBERSHIP_FLEXI_LABEL = 'Flexi';
    const MEMBERSHIP_REGIONAL_LABEL = 'Regional';
    const MEMBERSHIP_FLEXI_TOKENS = 10;
    const WITNESS_USER_TYPE = 'witness';
    const PROJECT_TEAM_MEMBER = 'project_team_member';
    const WITNESS_USER_TYPE_LABEL = 'Witness';
    const TEAM_ADMIN = 'team_admin';
    const ACCOUNT_HOLDER = 'account_holder';
    const DEFAULT_TEAM_MEMBER_SEATS = 1;
    const APPROVAL_THRESHOLD = 'approval_threshold';

    /**
     * WHITELIST FROM ACCOUNT META
     */
    const WHITELIST_META_TRADE = 'trade_whitelist';

    const CONFIRMED_USER_CONTACT = 2;

    /**
     * @var array
     */
    protected static $forward_address = [
        "switchGhostMode" => "/main-contractor",
        "freeTrial" => "/sign-up-success?free-trial",
    ];

    protected static $specialist_types = [
        'specialist',
        'external_subcontractor',
        'directory'
    ];

    protected static $specialist_external_types = [
        'external_subcontractor'
    ];

    /**
     * @param string $k
     * @return false|string
     */
    public static function getForwardingAddress(string $k)
    {
        if (isset(self::$forward_address[$k])) {
            return baseUrl() . self::$forward_address[$k];
        }
        return false;
    }

    /**
     * @param string $step
     * @param string $url
     */
    public static function setForwardingAddress($step, $url)
    {
        self::$forward_address[$step] = $url;
    }

    /**
     * @param string $message
     * @param string $step
     */
    public static function formError(string $message, $step, $forwarding = null)
    {
        Session::setMessage($message, "form_error");
        if (!$forwarding) {
            $forwarding = $_SERVER['HTTP_REFERER'] ?? SITE_URL;
        }

        self::setForwardingAddress($step, $forwarding);
        return;
    }

    /**
     * @var array
     */
    protected static $security = [
        "fields" => [
            "firstname" => ["type" => "text"],
            "lastname" => ["type" => "text"],
            "company" => ["type" => "text"],
            "email" => ["type" => "email"],
            "confirm-email" => ["type" => "email", "required" => false],
            "phone" => ["type" => "text"],
            "password" => ["type" => "password"],
            "repeat-pass" => ["type" => "password", "required" => false],
            "plan_id" => ["type" => "text", "hidden" => true],
            "mailing_list_consent" => ["type" => "text", "hidden" => true],
            "terms_accepted" => ["type" => "checkbox"],
        ],
        "methods" => [
            "emailExists" => ["type" => "GET"],
            "companyExists" => ["type" => "GET"],
            "listSubscriptions" => ["type" => 'GET'],
            "update" => ["type" => 'PATCH'],
            "updateLogo" => ["type" => 'POST'],
            "freeTrial" => ["type" => "POST"],
            "switchGhostMode" => ["type" => 'GET'],
            "switchProsperGhostMode" => ["type" => 'GET'],
            "info" => [
                "type" => "GET",
                "requires_session" => true,
            ],
            "team" => [
                "type" => "GET",
                "requires_session" => true,
            ],
            "teamInvite" => [
                "type" => "POST",
                "requires_session" => true,
                "pre_checks" => [
                    [DocumentValidator::class, "isOwnerSignatory"]
                ],
            ],
            "createWitness" => [
                "type" => "POST",
                "requires_session" => true,
                "pre_checks" => [
                    [DocumentValidator::class, "isOwner"]
                ],
            ],
            "loadOrganization" => [
                "type" => "GET",
                "requires_session" => true,
            ],
            "teamChangeRole" => [
                "type" => "PATCH",
                "requires_session" => true,
            ],
            "teamMemberRemove" => [
                "type" => "DELETE",
                "requires_session" => true,
            ],
            "downloadPrequalification" => [
                "type" => "GET",
                "requires_session" => true,
                "required_args" => [
                    "id" => "int",
                ]
            ],
            "hasPrequalification" => [
                "type" => "GET",
                "requires_session" => true,
                "required_args" => [
                    "id" => "int",
                ]
            ],
            "getThresholds" => [
                "type" => "GET",
                "requires_session" => true,
            ],
            "createThreshold" => [
                "type" => "POST",
                "requires_session" => true,
            ],
            "updatePermissionThreshold" => [
                "type" => "POST",
                "requires_session" => true,
            ],
            "updatePermissionUser" => [
                "type" => "POST",
                "requires_session" => true,
            ],
            "roles" => [
                "type" => "GET",
                "requires_session" => true,
            ],
            "fetchActions" => [
                "type" => "GET",
                "requires_session" => true,
            ]
        ]
    ];

    /**
     * Keep api cache in static container for perforamnce
     * @ToDo: Store cache in persitant storage
     * @var false[]
     */
    protected static $cache = [
        "types" => [
            "account" => false,
            "user" => false,
            "token" => false,
        ]
    ];

    /**
     * @param Request $request
     * @throws Exception
     */
    public static function switchGhostMode(Request $request): void
    {
        /*
           * Check if the user is allowed to switch to ghost mode
           */
        if (app()->Cookie->allowGhostMode()) {

            /*
             * Allowing ghost mode by user id
             */
            $ghost_id = app()->Cookie->getCookie('ghost');
            if (isset($request->query['redirect_user_id'])) {
                $ghost_id = (int)$request->query['redirect_user_id'];
            }

            /*
             * Allowing ghost mode by project id
             */
            if (isset($request->query['redirect_project'])) {
                $project = Project::getProjectBySlug($request->query['redirect_project']);
                $ghost_id = $project['group_id'];
            }

            setcookie(app()->Cookie->getCookieNameByEnvironment('ghost'), $ghost_id, time() + 24 * 3600, "/", config('cookie.domain'));
            $_COOKIE[app()->Cookie->getCookieNameByEnvironment('ghost')] = $ghost_id;

            $token = app()->Cookie->getCookie('token');

            /*
              * Get account info
             */
            $user_info = self::getUser($ghost_id);
            $account_info = self::getUser($user_info['account_id']);

            /*
             * Replace the existing user session with the ghost user data
             */
            $user = UserFactory::getNewUser($ghost_id, $user_info['account_id'], $token, $account_info);
            self::patch("user/session/$token", [app()->Cookie->getCookieNameByEnvironment('ghost') => $ghost_id]);

            $user->setData($account_info);
            $_SESSION["user"] = $user;

            /*
             * Redirect the user to the project dashboard
             */
            if (isset($request->query['redirect_project'])) {
                redirect(SITE_URL . "/main-contractor/project_dashboard/" . $request->query['redirect_project']);
            }
        } else {
            throw new \Exception(\LanguageControl::get('no_access'));
        }
    }

    /**
     * @return array
     */
    public static function getSecurity()
    {
        return self::$security;
    }

    /**
     * @param int $aid
     * @param string $key
     * @param null $default
     * @return array|mixed|object|null
     * @throws Exception
     */
    public static function getMembershipMeta(int $aid, string $key = '', $default = null)
    {
        $membership = self::get("account/$aid/membership");
        $meta = json_decode($membership['meta'], true);
        if ($key) {
            return $meta[$key] ?? $default;
        }
        return json_decode($membership['meta'], true);
    }

    /**
     * @param int $aid
     * @param array $meta
     * @throws Exception
     */
    public static function updateMembershipMeta(int $aid, array $meta): void
    {
        self::patch("account/$aid/membership", [
            'meta' => array_merge(self::getMembershipMeta($aid), $meta)
        ]);
    }

    /**
     * @return mixed|string[]
     * @throws Exception
     */
    public static function getSubscriptions()
    {
        return self::get("account/subscription");
    }

    /**
     * @param $id
     * @return mixed|string
     * @throws Exception
     */
    public static function getSubscription($id)
    {
        $sub = self::get("account/subscription/" . $id);
        if (!$sub) {
            throw \Exception("Invalid Subscription id");
        }

        return new Subscription($sub);
    }

    /**
     * @param Request $request
     * @return false|float|int|mixed|\Services_JSON_Error|string|void
     * @throws Exception
     */
    public static function listSubscriptions(Request $request): string
    {
        return json_encode(self::getSubscriptions());
    }

    /**
     * @param int $user_id
     * @return false|mixed|string
     * @throws Exception
     */
    public static function getAccountIdByUser(int $user_id)
    {
        $user = self::getUser($user_id);
        if ($user) {
            return $user['account_id'];
        }

        return false;
    }

    /**
     * @return array|bool|mixed|object|string
     */
    public static function getTypes($sub = "account")
    {
        if (!self::$cache["types"][$sub]) {

            $response = self::get("$sub/type");

            $data = [];
            foreach ($response as $type) {
                $data[$type["label"]] = $type["id"];
            }
            self::$cache["types"][$sub] = $data;
        }
        return self::$cache["types"][$sub];
    }

    /**
     * @param int $accountId
     * @param string $fname
     * @param string $lname
     * @param string $email
     * @param string $password
     * @param string $type
     * @param int $status
     * @return false|mixed
     */
    public static function createUser(
        int $accountId,
        string $fname,
        string $lname,
        string $email,
        string $password,
        string $type = "account_holder",
        int $status = User::STATUS_ACTIVE
    ) {
        $types = self::getTypes("user");
        $response = self::post("user", [
            "account_id" => $accountId,
            "firstname" => $fname,
            "lastname" => $lname,
            "email" => $email,
            "password" => $password,
            "job_title" => "",
            "type_id" => $types[$type],
            "status" => $status
        ]);

        $json = $response->json();

        return $json['data']["id"] ?? false;
    }

    /**
     * @return array
     */
    public static function getApiHeaders(): array
    {
        $config = self::getConfig();
        $headers = [];
        if ($config["token"]["enabled"]) {
            $headers["api_token"] = $config["token"]["hash"];
        }
        return $headers;
    }

    /**
     * @param string $email
     * @param string $password
     * @param string $app
     * @return mixed
     * @throws \Exception
     */
    public static function login(string $email, string $password, string $app)
    {
        if (!$email) {
            throw new \Exception(\LanguageControl::get('required_email'));
        }

        if (!$password) {
            throw new \Exception(\LanguageControl::get('required_password'));
        }

        $params = array('username' => $email, 'password' => $password);
        if ($app) {
            $params["app"] = $app;
        }

        $response = self::post("user/session", $params);
        if ($response->getInfo("http_code") === 401) {
            throw new \Exception(\LanguageControl::get('invalid_credentials'));
        }
        $json = $response->json();
        if (is_null($response)) {
            /*
             * We need to put some login logs
             */
            throw new \Exception(\LanguageControl::get('generic_error'));
        }
        if (isset($json['error'])) {
            throw new \Exception($json['error']['friendly']);
        }

        return $json['data'];
    }

    /**
     * @param $id
     * @return mixed|string[]
     * @throws Exception
     */
    public static function getAccount($id)
    {
        return self::get("account/$id");
    }

    /**
     * @param $id
     * @return mixed|string[]
     * @throws Exception
     */
    public static function getEnvelopes($id)
    {
        return self::get("feature/envelope/$id");
    }

    /**
     * @param string $aid
     * @param array $data
     * @return mixed|string[]
     * @throws Exception
     */
    public static function updateEnvelopes(string $aid, array $data)
    {
        self::getRequest("feature/envelope/$aid", "PATCH")
            ->setData($data)
            ->call();
    }

    /**
     * @param $id
     * @return mixed|string[]
     * @throws Exception
     */
    public static function getUser($id)
    {
        return self::get("user/$id/profile");
    }

    /**
     * @param string $aid
     * @param array $data
     * @return mixed|string[]
     * @throws Exception
     */
    public static function updateMembership(string $aid, array $data, $accoundholderId = null)
    {
        $request = self::getRequest("account/$aid/membership", "PATCH")
            ->setData($data)
            ->call();
    }

    public static function getValidationKeys()
    {
        $keys = [];
        foreach (self::$security["fields"] as $k => $v) {
            $required = $v["required"] ?? true;
            if (isset($v["hidden"]) || !$required) {
                continue;
            }
            $keys[] = $k;
        }
        return $keys;
    }

    /**
     * @param array $data
     * @return bool
     */
    public static function validate(array $data): bool
    {
        $keys = self::getValidationKeys();
        $data = array_filter(
            $data,
            function ($v, $k) use ($keys) {
                return in_array($k, $keys) && !empty(trim($v));
            },
            ARRAY_FILTER_USE_BOTH
        );

        if (!isset($data["terms_accepted"]) || !$data["terms_accepted"]) {
            throw new \Exception(\LanguageControl::get('terms_not_accepted'));
        }

        $missing = array_diff($keys, array_keys($data));
        if ($missing) {

            throw new \Exception("Missing Field: " . implode(", Missing Field: ", $missing));
        }

        $email = $record = self::get("account", ["email" => urldecode($data["email"])]);
        if ($email) {;
            throw new \Exception(\LanguageControl::get('email_exists'));
        }
        return true;
    }

    /**
     * @param Request $request
     */
    public static function freeTrial(Request $request)
    {
        $data = $request->getData();

        if (!filter_var($data, FILTER_VALIDATE_INT) !== false) {
            foreach (self::getSubscriptions() as $k => $v) {
                if (strcasecmp($v['label'], $data['plan_id']) === 0) {
                    $data['plan_id'] = $v['id'];
                }
            }
        }

        try {
            self::validate($data);
            $data["mailing_list_consent"] = 0;
            if (isset($data["mailing_list_consent"])) {
                $data["mailing_list_consent"] = 1;
            }
            $data["free_trial"] = 1;
            self::createAccount($data);

            /**
             * Send email to admin
             */
            $email = admin_email();
            $email->subject('New Free Trial Registration');
            $email->to(config('email.clink.default.email'));
            $email->template('free-trial', $data);
            $email->send();
        } catch (\Exception $e) {
            self::formError($e->getMessage(), "freeTrial", "/free-trial");
            return;
        }
    }

    /**
     * @param string $label
     * @param string $interval
     */
    public static function getSubscriptionByLabel(string $label, string $interval)
    {
        foreach (Account::getSubscriptions() as $sub) {
            if (strcasecmp($sub['label'], $label) === 0 && strcasecmp($sub['interval_type'], $interval) === 0) {
                return new Subscription($sub);
            }
        }

        throw new \Exception('Subscription label ' . $label . ' not found.');
    }

    /**
     * @param array $data
     * @param string $type
     * @return mixed|string[]
     * @throws Exception
     */
    public static function createAccount(array $data, $type = Account::MAIN_CONTRACTOR)
    {
        $types = self::getTypes();
        $request = self::post("account", [
            "name" => $data["company"],
            "email" => $data["email"],
            "landline" => $data["phone"],
            "mobile" => "",
            "type_id" => $types[$type]
        ]);

        $json = $request->json()["data"] ?? [];
        if (!$json || !isset($json["id"])) {
            self::contingency($data, "main_account");
        }

        $data["id"] = $json["id"];
        $data["account_id"] = $json["id"];

        //**@ Todo handle this exception */
        self::createUser(
            (int) $data["id"],
            $data["firstname"],
            $data["lastname"],
            $data["email"],
            $data["password"]
        );

        $consent = $data["mailing_list_consent"] ?? false;
        if ($consent) {
            Hubspot::signup(
                $data["email"],
                $data["firstname"],
                $data["lastname"],
                $data["company"]
            );
        }
        return $data["account_id"];
    }

    /**
     * Placeholder to capture submitted data and let a member of staff know a subscription was paid for
     */
    public static function contingency(array $data, string $failed_at)
    {
        //Unset the password and csrf token for security
        $data["password"] = '';
        $data['repeat-pass'] = '';
        //Unset the csrf token
        if (isset($data[config('csrf.token_name')])) {
            unset($data[config('csrf.token_name')]);
        }
        unset($data["password"]);
        unset($data["repeat-pass"]);

        $data['failed_at'] = $failed_at;
        $email = admin_email();
        $email->subject('Gocardless payment error ' . $failed_at);
        $email->to(config('debug.email.to'));
        $email->template('payment-failed', ['key' => json_encode($data, JSON_PRETTY_PRINT)]);
        $email->send();

        throw new \Exception(\LanguageControl::get('fatal_error'));
    }

    /**
     * @param Request $request
     */
    public static function emailExists(Request $request)
    {
        $email = $request->getQueryValue("email");
        if (!$email) {
            throw new Exception("Missing required query parameter email");
        }

        $results = self::get("account", ["email" => urldecode($email)]);
        $exists = ["exists" => false];
        if (empty(!$results)) {
            foreach ($results as $result) {
                if ($result["type_id"] !== self::EXTERNAL_ACCOUNT_TYPE) {
                    $exists["exists"] = true;
                    break;
                }
            }
        }

        $user = self::get("user", ["email" => urldecode($email)]);
        if (!empty($user)) {
            $exists["exists"] = true;
        }
        return json_encode($exists);
    }

    public static function companyExists(Request $request)
    {
        $company = $request->getQueryValue("company");
        if (!$company) {
            throw new Exception("Missing required query parameter company");
        }
        $company = strip_tags($company);
        $record = self::get("account", ["name" => urldecode($company)]);
        $exists = ["exists" => false];
        if ($record) {
            $exists["exists"] = true;
        }
        return json_encode($exists);
    }

    /**
     * @param array $data
     * @param User $user
     */
    public static function updateUser(array $data, User $user)
    {
        if ($id = $user->getId()) {
            $request = self::getRequest("user/$id/profile", "PATCH")
                ->setData($data)
                ->call();
        }
    }

    /**
     * @param array $data
     * @param int $id
     * @return string|null the error message if the update was rejected
     */
    public static function updateUserById(array $data, int $id): ?string
    {
        $response = self::getRequest("user/$id/profile", "PATCH")
            ->setData($data)
            ->call();

        $json = $response->json();

        if (isset($json["error"])) {
            $error = $json["error"];
            return $error["friendly"] ?? $error["description"] ?? "unknown error";
        }

        return null;
    }

    /**
     * @param int $id
     * @param array $meta
     */
    public static function updateUserMeta(int $id, array $meta): void
    {
        self::updateUserById(['meta' => json_encode($meta)], $id);
    }

    /**
     * @param array $data
     * @param User $user
     */
    public static function updateAccount(array $data, User $user)
    {
        /*
           * Only admins and manager can update account information
           * Assistant role cannot update account information
           */
        if ($user->getTeamRole() === 'team_assistant') {
            return false;
        }

        if ($id = $user->getAccountId()) {
            $request = self::getRequest("account/$id", "PATCH")
                ->setData($data)
                ->call();
        }
    }

    /**
     * @param Request $request
     */
    public static function update(Request $request)
    {
        $user = UserFactory::getUser();
        $json = $request->getJson();

        if ($user && $json) {
            foreach ($json as $key => $data) {
                $method = "update" . ucwords($key);
                if (method_exists(Account::class, $method)) {
                    self::$method($data, $user);
                } else {
                    throw new \Exception("Invalid data");
                }
            }
        }
    }

    /**
     * @param int $account_id
     * @param int $type_id
     * @param string $logo
     * @return string
     */

    public static function getAccountLogoUrl(int $accountId, int $accountType): string
    {
        $logo_url = self::getConfig("company_logo_url");
        $hash = self::EXTERNAL_ACCOUNT_HASH;
        if ($accountType !== self::EXTERNAL_ACCOUNT_TYPE) {
            $hash = md5($accountId);
        }
        return sprintf(
            "%s/%s/logo.png",
            $logo_url,
            $hash
        );
    }

    /**
     * @return string
     */
    public static function getProsperDefaultLogo(): string
    {
        // We genrate a hash out of -1 for the default prosper logo path in s3
        return self::getAccountLogoUrl(-1, 1);
    }

    /**
     * @param array $ids
     * @return mixed
     * @throws Exception
     */
    public static function getAccounts(array $ids)
    {
        $accounts = [];
        foreach (array_chunk($ids, 75) as $idChunk) {
            $items = self::get(
                "account",
                ["id" => "[" . implode(",", $idChunk) . "]"]
            );
            foreach ($items as $account) {
                $account['logo'] = self::getAccountLogoUrl((int)$account["id"], (int) $account["type_id"]);
                $accounts[$account["id"]] = $account;
            }
        }
        return $accounts;
    }

    /**
     * @param array $ids
     * @return array
     * @throws Exception
     */
    public static function getAccountsWithUsers(array $ids)
    {
        $accounts = [];
        foreach (array_chunk($ids, 75) as $idChunk) {
            $items = self::get("account/" . "[" . implode(",", $idChunk) . "]");
            foreach ($items as $account) {
                $account['logo'] = self::getAccountLogoUrl((int)$account["id"], (int) $account["type_id"]);
                $accounts[$account["id"]] = $account;
            }
        }
        return $accounts;
    }

    /**
     * @return mixed
     * @throws Exception
     */
    public static function getPackages()
    {
        return self::get('trade_category');
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return Client\Response\JsonResponse
     */
    public static function info(Request $request, User $user, $args)
    {
        $account = $user->getAccountData();
        $userData = $user->getData();
        unset($userData['account']);

        $aid = $account["id"];
        $result = [
            'id' => $aid,
            'name' => $account['name'],
            'email' => $account['email'],
            'reg_number' => $account['reg_number'],
            'address' => $account['address'],
            'website' => $account['website'],
            'country' => $user->getRegionGroupByRegionId($user->getRegionId()),
            'company_landline_number' => $account['landline'],
            'user' => $userData
        ];

        /**
         * @TODO refactor this with the new DB scheme
         */
        $features = self::get("feature/accounts/$aid");

        $result['features'] = array_map(function($feature){
            return [
                'id'   => $feature['feature_id'],
                'name' => $feature['feature']
            ];
        }, $features);

        $envelopes = self::get("feature/envelope/$aid");
        if ($envelopes) {
            $result["envelopes"] = [
                "current" => $envelopes["current"],
                "envelopes" => $envelopes["envelopes"],
                "period" => $envelopes["period"],
            ];
        }

        return self::jsonResponse($result);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return Client\Response\JsonResponse
    */
    public static function roles(Request $request, User $user, $args)
    {
        try {
            $token = app()->Cookie->getCookie('token');
            $res = Api::get("roles/roles-level", [], ['Authorization' => "Bearer $token"]);
            return self::jsonResponse($res);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 400);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return Client\Response\JsonResponse
    */
    public static function fetchActions(Request $request, User $user, $args)
    {
        try {
            $token = app()->Cookie->getCookie('token');
            $res = Api::get("account-actions/fetch-action", [], ['Authorization' => "Bearer $token"]);
            return self::jsonResponse($res);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 400);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return Client\Response\JsonResponse
    */
    public static function team(Request $request, User $user, $args)
    {
        $team = [];
        $account = $user->getAccountData();
        $typesUser = self::getTypes('user');
        $userRoleLabel = $user->getTeamRole();
        $rolesData = self::get("roles/roles-level");

        $roleLevels = [];
        $roleDisplayLabels = [];
        $currentUserTypeId = null;
        $userRoleValue = null;

        // Build role maps and get current user's type ID
        foreach ($rolesData as $role) {
            $roleLevels[$role['id']] = $role['level'];
            $roleDisplayLabels[$role['id']] = $role['value'];
            if(strtolower($role['label']) == 'administrator')
                $administrator_id = $role['id'];
            if ($role['label'] === $userRoleLabel) {
                $currentUserTypeId = $role['id'];
                $userRoleValue = $role['value'];
            }
        }

        $currentUserLevel = $roleLevels[$currentUserTypeId] ?? null;

        // Load all thresholds for this account
        $thresholdList = self::get(sprintf("thresholds/%s", $user->getAccountId()));
        $thresholdMap = [];
        foreach ($thresholdList as $threshold) {
            $thresholdMap[$threshold['id']] = $threshold;
        }

        $groupsList = self::get(sprintf("account/%s/groups", $user->getAccountId()));
        $groupMap = [];

        foreach ($groupsList as $group) {
            $groupMap[$group['id']] = $group;
        }

        $accountFeatures = self::get(sprintf("feature/accounts/%s", $user->getAccountId()));
        $enabledFeatures = array_map('strtoupper', array_filter(array_column($accountFeatures, 'feature')));
        $hasTenderRecommendationFeature = in_array('TENDER_RECOMMENDATION', $enabledFeatures, true);
        $hasTenderInquiryApprovalFeature = in_array('TENDER_INQUIRY_APPROVAL', $enabledFeatures, true);
        $hasSubcontractorListApprovalFeature = in_array('SUBCONTRACTOR_LIST_APPROVAL', $enabledFeatures, true);

        foreach ($user->getTeam() as $key => $member) {
            $typeId = $member['type_id'];
            $memberRoleLabel = array_search($typeId, $typesUser, true);
            $memberLevel = $roleLevels[$typeId] ?? null;

            $allPermissions = self::get("permissions");
            $permissions = self::get(sprintf("permissions/user/%d", $member['id']));
            $mappings = self::get(sprintf("thresholds/user/%d", $member['id']));
            $userGroupMappings = self::get(sprintf("account/%d/user/%d/group", $user->getAccountId(), $member['id']));

            $approval = [
                'type' => 'approve_none',
                'from_value' => null,
                'to_value' => null,
            ];

            $permissionsData = [];

            if (!empty($mappings)) {
                $canApproveAll = (int)$mappings[0]['can_approve_all'] === 1;
                $isRestricted = (int)$mappings[0]['is_restricted'] === 1;

                if ($canApproveAll && count($mappings) > 0) {
                    $approval['type'] = 'approve_all';

                    $minFrom = null;
                    $maxTo = null;

                    foreach ($mappings as $mapping) {
                        $thresholdId = (int)$mapping['approval_threshold_id'];
                        if (isset($thresholdMap[$thresholdId])) {
                            $threshold = $thresholdMap[$thresholdId];

                            if ($minFrom === null || $threshold['from_value'] < $minFrom) {
                                $minFrom = $threshold['from_value'];
                            }

                            if ($maxTo === null || ($threshold['to_value'] !== null && $threshold['to_value'] > $maxTo)) {
                                $maxTo = $threshold['to_value'];
                            }
                        }
                    }

                    $approval['from_value'] = $minFrom ?? 0;
                    $approval['to_value'] = $maxTo;

                } elseif (!$canApproveAll && !$isRestricted && count($mappings) === 1) {
                    $thresholdId = (int)$mappings[0]['approval_threshold_id'];
                    if (isset($thresholdMap[$thresholdId])) {
                        $threshold = $thresholdMap[$thresholdId];
                        $approval['type'] = 'threshold_range';
                        $approval['from_value'] = $threshold['from_value'];
                        $approval['to_value'] = $threshold['to_value'];
                    }
                } elseif ($isRestricted) {
                    $approval['type'] = 'approve_none';
                }
            }

            foreach ($allPermissions as $permission) {
                if ($permission['key'] === self::APPROVAL_THRESHOLD) {
                    $permissionsData[$permission['key']] = [
                        'hasPermission' => false
                    ];
                } else {
                    $permissionsData[$permission['key']] = false;
                }
                if (in_array($permission['id'], array_column($permissions, 'permission_id'))) {
                    $data = null;
                    if ($permission['key'] === self::APPROVAL_THRESHOLD) {
                        $data['hasPermission'] = true;
                        $data['threshold'] = $approval;
                    } else {
                        $data = true;
                    }
                    $permissionsData[$permission['key']] = $data;
                }
            }

            $flags = [];
            // Order approval is currently managed by frontend visibility, so always include it in the count.
            $flags[] = $permissionsData['approval_threshold']['hasPermission'] ?? false;
            if ($hasTenderRecommendationFeature) {
                $flags[] = $permissionsData['tender_recommendation'] ?? false;
            }
            if ($hasTenderInquiryApprovalFeature) {
                $flags[] = $permissionsData['tender_inquiry_approval'] ?? false;
            }
            if ($hasSubcontractorListApprovalFeature) {
                $flags[] = $permissionsData['subcontractor_list_approval'] ?? false;
            }

            $permissionCount = count(array_filter($flags));

            $permissionsData['permission_count'] = $permissionCount;

            $allApprovalPermissions = true;
            $allApprovalPermissions = $permissionsData['approval_threshold']['hasPermission'] ?? false;

            if ($hasTenderRecommendationFeature) {
                $allApprovalPermissions = $allApprovalPermissions
                    && ($permissionsData['tender_recommendation'] ?? false);
            }
            if ($hasTenderInquiryApprovalFeature) {
                $allApprovalPermissions = $allApprovalPermissions
                    && ($permissionsData['tender_inquiry_approval'] ?? false);
            }
            if ($hasSubcontractorListApprovalFeature) {
                $allApprovalPermissions = $allApprovalPermissions
                    && ($permissionsData['subcontractor_list_approval'] ?? false);
            }

            $permissionsData['allApprovalPermissions'] = $allApprovalPermissions;


            // Dynamic can_be_removed logic
            $canBeRemoved = false;

            if ($currentUserLevel !== null && $memberLevel !== null) {
                // Account Holder / Administrator -> remove anyone
                if (isset($administrator_id) && $currentUserLevel === $administrator_id) {
                    $canBeRemoved = true;
                }
                // Anyone can remove themselves
                elseif ($user->getId() === $member['id']) {
                    $canBeRemoved = true;
                }
                // Remove members with higher level number (lower authority)
                elseif ($memberLevel > $currentUserLevel) {
                    $canBeRemoved = true;
                }

                // project team member can only be removed by super admin
                if ($memberRoleLabel === self::PROJECT_TEAM_MEMBER) {
                    $canBeRemoved = ($userRoleLabel === 'super_admin');
                }

            }

            $userGroups = [];
            if (!empty($userGroupMappings)) {
                foreach ($userGroupMappings as $group) {
                    $userGroups[] = [
                        'id' => $group['id'],
                        'name' => $group['label'],
                    ];
                }
            }

            $team[$key] = [
                'user_id' => $member['id'],
                'firstname' => $member['firstname'],
                'lastname' => $member['lastname'],
                'display_name' => $member['display_name'],
                'email' => $member['email'],
                'pending' => $member['status'] === User::STATUS_PENDING,
                'can_be_removed' => $canBeRemoved,
                'role' => [
                    'id' => $typeId,
                    'label' => $memberRoleLabel,
                    'level' => $roleLevels[$typeId] ?? null,
                    'value' => $roleDisplayLabels[$typeId] ?? null
                ],
                'permissions' => $permissionsData,
                'roles' => $member['roles'],
                'groups' => $userGroups
            ];
        }

        $restrictUsers = $request->getQueryValue('restrict_user');
        $allowedUserIds = $user->getAccountMeta('allowed_signatory_user_ids');
        $allowedRoleIds = $user->getAccountMeta('allowed_signatory_role_ids');

        if (isset($restrictUsers) && (bool)$restrictUsers && (!empty($allowedUserIds) || !empty($allowedRoleIds))) {
            $allowedIds = array_map('intval', (array)$allowedUserIds);
            $allowedRoles = array_map('intval', (array)$allowedRoleIds);

            $team = array_values(array_filter($team, function ($m) use ($allowedIds, $allowedRoles) {
                if (in_array((int)$m['user_id'], $allowedIds, true)) {
                    return true;
                }
                if (!empty($allowedRoles) && !empty($m['roles'])) {
                    $memberRoleIds = array_map('intval', array_column($m['roles'], 'id'));
                    return (bool)array_intersect($memberRoleIds, $allowedRoles);
                }
                return false;
            }));
        }

        return self::jsonResponse([
            'team' => [
                'owner_id' => $account['id'],
                'name' => $account['name'],
                'members' => $team,
                'seats' => $account['team_seats'] ?? self::DEFAULT_TEAM_MEMBER_SEATS,
                'user_role' => $userRoleLabel,
                'user_role_value' => $userRoleValue,
                'user_roles' => $user->getData('roles')
            ]
        ]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return Client\Response\JsonResponse
     * @throws \Exception
     */
    public static function teamInvite(Request $request,  User $user, array $args)
    {
        $data = $request->getJson();
        $account_role = $data['role'] ?? 0;
        $account_id = $user->getAccountId();
        $roles = self::getTypes("user");

        foreach(self::get("account/".$account_id."/account_roles") as $account_roles)
        {
            if (is_string($account_role) && !is_numeric($account_role)) {
                $matchedRole = $account_roles['user_type_key'] === $account_role;
            } else {
                $matchedRole = (int)$account_roles['id'] === (int)$account_role;
            }

            if ($matchedRole) {
                $roleID = (string) $account_roles['user_type_id'];
                $account_role = $account_roles['id'];
                $data['role'] = array_search($roleID, $roles, true);
                break;
            }
        }

        if (!$user->canChangeTeamMember($data['role'] ?? '')) {
            return self::jsonResponse([
                'success' => false,
                'message' => 'You do not have permission to invite the user greater than your role'
            ]);
        }

        $did = $data["did"] ?? 0;
        $dbKey = $data["dbKey"] ?? '';
        $account = $user->getAccountData();
        $team = $user->getTeam();

        $excludedRoles = [
            self::WITNESS_USER_TYPE,
            self::PROJECT_TEAM_MEMBER,
        ];

        $validTeamCount = count(array_filter($team, function ($member) use ($excludedRoles) {
            $role = $member["type"] ?? '';
            return !in_array($role, $excludedRoles, true);
        }));

        $seats = $account['team_seats'] ?? self::DEFAULT_TEAM_MEMBER_SEATS;

        $member_exists = false;

        if ((isset($data['email']) && $seats > $validTeamCount) || $data['role'] === self::WITNESS_USER_TYPE) {

            foreach ($team as $member) {
                if ($member['email'] == $data['email']) {
                    $member_exists = true;
                }
            }

            if (!$member_exists) {
                $name_parts = explode(" ", $data['name']);
                if ($name_parts) {
                    $data["name"] = array_shift($name_parts);
                    if ($name_parts) {
                        $data["lastname"] = implode(" ", $name_parts);
                    }
                }

                $id = self::createUser(
                    (int) $user->getAccountId(),
                    $data["name"],
                    $data["lastname"] ?? '',
                    $data["email"],
                    md5($data["email"]),
                    $data['role'],
                    User::STATUS_PENDING
                );

                if (isset($roles[$data['role']])) {
                    self::patch("roles/mapping/$id", [
                        'role_id' => (int)$roles[$data['role']]
                    ]);

                    $uid = (int) $id;
                    self::patch("account/$uid/account_role_user_mapping", [
                        'role_id' => (int)$account_role
                    ]);
                }

                if ($id && $data['role'] !== self::WITNESS_USER_TYPE) {

                    /**
                     * Send email to the user
                     */
                    $contractorModel = new UserModel($data, $id);
                    $request = $contractorModel->createTokenByLabel($id, 'team_invite');
                    $json = $request->json()["data"] ?? [];
                    //send email to main contractor
                    Email::send([
                        'template' => 'Team  Manager Invite',
                        'sender'   => ['id' => $id],
                        'to'       => $data["email"],
                        'extra'    => [
                            'first_name'   => $data["name"],
                            'company_name' => $account['name'],
                            'token'        => SITE_URL . "/sign-up-from-team/?token=" . $json['token']
                        ]
                    ], 'clink');

                    self::post("account-actions", [
                        'account_id'              => (int) $user->getAccountId(),
                        'related_account_id'      => (int) $user->getAccountId(),
                        'account_user_id'         => (int) $user->getId(),
                        'related_account_user_id' => (int) $id,
                        'action_type'             => 'team_invite',
                        'description' => sprintf(
                            '%s invited %s %s (%s) to the team',
                            $user->getData("display_name"),
                            $data["name"],
                            $data["lastname"] ?? '',
                            $data["email"]
                        ),
                    ]);

                    return self::jsonResponse([
                        'success' => true,
                        'message' => 'The user has been successfully added to the system. An invitation email has been sent to the provided email address.'
                    ]);
                }

                if ($data['role'] === self::WITNESS_USER_TYPE) {
                    if ($did && $dbKey) {
                        $doc  = $args["document"];
                        $meta = $doc->getMeta();
                        if (!isset($meta["values"])) {
                            $meta["values"] = [];
                        }
                        Template::saveValue([$dbKey => $id], $doc, $meta, $user->getData("id"));
                    }
                    return self::jsonResponse([
                        'success' => true
                    ]);
                }

                return self::jsonResponse([
                    'success' => false,
                    'message' => 'This user already belongs to another team'
                ]);
            }

            return self::jsonResponse([
                'success' => false,
                'message' => 'This user already belongs to the team'
            ]);
        }

        return self::jsonResponse([
            'success' => false,
            'message' => 'The team is already full'
        ]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return Client\Response\JsonResponse
     * @throws \Exception
     */
    public static function createWitness(Request $request,  User $user, array $args)
    {
        $params = $request->getQuery();
        $aid = intval($params["aid"] ?? 0);
        $did = intval($params["did"] ?? 0);

        $idResponse = 0;
        if ($aid) {
            $form = $request->getJson();
            $email = $form["email"] ?? '';
            $dbKey = $form["dbKey"] ?? '';
            $userData = [
                'email'          => $email,
                'firstname'      => $form["firstname"] ?? '',
                'lastname'       => $form["lastname"] ?? '',
            ];
            $userModel = new UserModel($userData);

            $existingUserData = $userModel->existsByKey("email", $userModel->getData("email", ""), true);
            if ($existingUserData) {
                $userModel->setId(intval($existingUserData["id"]));
            } else {
                // User type handling
                $userTypes = $userModel->getUserTypes();
                $userType = array_filter($userTypes, function ($type) {
                    return $type["label"] === self::WITNESS_USER_TYPE;
                });
                $userType = array_shift($userType);
                $userTypeLabel = $userType ? $userType["label"] : null;
                $userModel->setData("type", $userTypeLabel);

                $userId = self::createUser(
                    $aid,
                    $userModel->getData("firstname") ?? '',
                    $userModel->getData("lastname") ?? '',
                    $userModel->getData("email"),
                    md5($userModel->getData("email")),
                    $userModel->getData("type"),
                    User::STATUS_PENDING
                );
                $userModel->setId(intval($userId));
            }

            // Role handling
            $organizationTypes = $userModel->getOrganizationTypes();
            $organizationType = array_filter($organizationTypes, function ($type) {
                return $type["label"] === self::WITNESS_USER_TYPE_LABEL;
            });
            $organizationType = array_shift($organizationType);
            $idRole = $organizationType ? intval($organizationType["id"]) : null;
            $userModel->setData("role_id", $idRole);

            $organization = self::getOrganization($aid);
            $organizationEmails = array_map(function ($member) {
                return $member["email"];
            }, $organization);

            if (array_search($email, $organizationEmails)) {
                return self::jsonResponse(["error" => "This member already exists"]);
            }

            $idResponse = $userModel->createOrganizationMember($aid);
            if ($did && $idResponse && $dbKey) {
                $doc  = $args["document"];
                $meta = $doc->getMeta();
                if (!isset($meta["values"])) {
                    $meta["values"] = [];
                }
                Template::saveValue([$dbKey => $userModel->getId()], $doc, $meta, $user->getData("id"));
            }
        }

        return self::jsonResponse($idResponse);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return Client\Response\JsonResponse
     * @throws \Exception
     */
    public static function loadOrganization(Request $request,  User $user, array $args)
    {
        try {
            $params = $request->getQuery();
            $exclude_type = '';
            if(isset($params['exclude_type'])){
                $exclude_type = $params['exclude_type'];
            }
            $aid = intval($params["aid"] ?? 0);
            return self::jsonResponse(self::getOrganization($aid, $exclude_type));
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 400);
        }
    }

    /**
     * @param int $aid
     * @param string $exclude_type
     * @throws \Exception
     */
    private static function getOrganization(int $aid, string $exclude_type = '')
    {
        try {
            if (!$aid) {
                throw new \Exception('Account ID is required.');
            }
            $token = app()->Cookie->getCookie('token');
            $res = Api::get("account/{$aid}/organization", ['exclude_type' => $exclude_type], ['Authorization' => "Bearer {$token}"]);
            return $res;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return Client\Response\JsonResponse
    */
    public static function teamChangeRole(Request $request, User $user, array $args)
    {
        $data = $request->getJson();
        $roles = self::getTypes("user");
        $account_role = $data["role"];
        $role = $data['role'] ?? '';
        $uid  = (int)($data['user_id'] ?? 0);

        $targetMember = null;
        foreach ($user->getTeam() as $member) {
            if ((int)$member['id'] === $uid) {
                $targetMember = $member;
                break;
            }
        }

        if (!$targetMember) {
            return self::jsonResponse([
                'success' => false,
                'message' => 'Target user not found.'
            ]);
        }

        $targetUserRole = $targetMember['type'] ?? null;
        $currentUserRole = $user->getTeamRole();
        $account_id = $user->getAccountId();

        foreach(self::get("account/".$account_id."/account_roles") as $account_roles)
        {
            if ((int)$account_roles['id'] == $account_role) {
                $roleID = $account_roles['user_type_id'];
                $role = array_search($roleID, $roles, true);
                break;
            }
        }


        // Restriction: cannot change own role unless Super Admin and Super Admin can change own role only if other super_admin exists in team
        if ($uid === (int)$user->getId()) {
            if ($currentUserRole === 'super_admin') {
                $otherSuperAdmins = array_filter($user->getTeam(), function($member) use ($user) {
                    return $member['type'] === 'super_admin' && (int)$member['id'] !== (int)$user->getId();
                });
                if (count($otherSuperAdmins) === 0) {
                    return self::jsonResponse([
                        'success' => false,
                        'message' => 'You cannot change your role unless another Super Admin is assigned. Please get in touch with our support team to accommodate this change.'
                    ]);
                }
            } else {
                return self::jsonResponse([
                    'success' => false,
                    'message' => 'You are not permitted to change your role. If you need to make changes to your role, please contact the Super Admin.'
                ]);
            }
        }

        $allowedRoles = $user->getTeamRolePermission($currentUserRole);

        if ($uid !== (int)$user->getId() && $targetUserRole !== 'super_admin' && !in_array($targetUserRole, $allowedRoles)) {
            return self::jsonResponse([
                'success' => false,
                'message' => 'You are not permitted to change the role of this user.'
            ]);
        }

        if (!in_array($role, $allowedRoles) && $uid !== (int)$user->getId()) {
            return self::jsonResponse([
                'success' => false,
                'message' => 'You are not permitted to assign this role.'
            ]);
        }

        // Save role change
        self::patch("user/$uid/profile", [
            'type_id' => (int)$roles[$role]
        ]);

        self::patch("roles/mapping/$uid", [
            'role_id' => (int)$roles[$role]
        ]);

        self::patch("account/$uid/account_role_user_mapping", [
            'role_id' => (int)$account_role
        ]);

        // Log the action
        self::post("account-actions", [
            'account_id'              => (int)$user->getAccountId(),
            'related_account_id'      => (int)$user->getAccountId(),
            'account_user_id'         => (int)$user->getId(),
            'related_account_user_id' => $uid,
            'action_type'             => 'team_change_role',
            'description'             => sprintf(
                '%s changed %s %s\'s role from %s to %s',
                $user->getData("display_name"),
                $targetMember["firstname"] ?? $targetMember["name"] ?? '',
                $targetMember["lastname"] ?? '',
                $targetMember["role_name"] ?? 'Unknown',
                ucfirst($role)
            ),
        ]);

        return self::jsonResponse([
            'success' => true,
            'message' => 'The user role has been successfully updated in the system.'
        ]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return Client\Response\JsonResponse
     * @throws Exception
    */
    public static function teamMemberRemove(Request $request, User $user, array $args)
    {
        $data = $request->getJson();
        $uid = (int)($data['user_id'] ?? 0);
        $team = $user->getTeam();
        $account = $user->getAccountData();

        $allow_roles = [
            'administrator'   => ['administrator','account_holder','super_admin','team_admin','team_manager','team_assistant','witness','approver'],
            'account_holder'  => ['administrator','account_holder','super_admin','team_admin','team_manager','team_assistant','witness','approver'],
            'super_admin'     => ['super_admin','team_admin', 'team_manager', 'team_assistant', 'witness', 'approver', 'project_team_member'],
            'team_admin'      => ['team_manager', 'team_assistant', 'witness', 'approver'],
            'team_manager'    => ['team_assistant', 'witness', 'approver'],
            'team_assistant'  => ['team_assistant'],
            'approver'        => ['approver'],
            'witness'         => ['witness']
        ];

        $result = false;
        $can_be_removed = false;
        $currentRole = $user->getData("type");

        if (in_array($currentRole, ['administrator','account_holder'], true) && $uid === (int)$user->getId()) {
            return self::jsonResponse([
                'success' => false,
                'message' => 'You cannot remove your own account.'
            ]);
        }

        $targetMember = null;

        $selfOnlyRoles = ['team_assistant', 'approver', 'witness'];
        if (in_array($currentRole, $selfOnlyRoles, true)) {
            if ($uid !== (int)$user->getId()) {
                return self::jsonResponse([
                    'success' => false,
                    'message' => 'You do not have permission to remove this user.'
                ]);
            } else {
                $can_be_removed = true;
            }
        }

        foreach ($team as $member) {
            if ((int)$member['id'] !== $uid) {
                continue;
            }

            $targetMember = $member;
            $targetRole = $member['type'];

            if (in_array($targetRole, ['team_admin', 'team_manager'], true)
                && $currentRole === $targetRole
                && $uid !== (int)$user->getId()) {
                return self::jsonResponse([
                    'success' => false,
                    'message' => 'You cannot remove another user with the same role.'
                ]);
            }

            if ((int)$member['id'] === (int)$account['id']) {
                return self::jsonResponse([
                    'success' => false,
                    'message' => 'You cannot remove the account owner.'
                ]);
            }

            if ($currentRole === 'super_admin' && $uid === (int)$user->getId()) {
                $otherSuperAdmins = array_filter($team, function($m) use ($user) {
                    return $m['type'] === 'super_admin' && (int)$m['id'] !== (int)$user->getId();
                });

                if (count($otherSuperAdmins) === 0) {
                    return self::jsonResponse([
                        'success' => false,
                        'message' => 'You cannot remove your account while no other super admin exists in the team.'
                    ]);
                }

                $can_be_removed = true;
            }

            // allow self-removal for team_admin and team_manager
            if ($uid === (int)$user->getId() && in_array($currentRole, ['team_admin','team_manager'], true)) {
                $can_be_removed = true;
            } elseif (!in_array($targetRole, $allow_roles[$currentRole] ?? [], true)) {
                return self::jsonResponse([
                    'success' => false,
                    'message' => 'You do not have permission to remove this user.'
                ]);
            }

            try {
                $approvalStatuses = Transactions::get("order_approver/type");
                $pendingApprovalStatusId = null;
                foreach ($approvalStatuses as $status) {
                    $label = strtolower(trim((string)$status['label']));
                    if ($label === 'pending') {
                        $pendingApprovalStatusId = (int)$status['id'];
                        break;
                    }
                }
                if ($pendingApprovalStatusId) {
                    $approvals = \App\Api\Transactions::get("order_approver", ['approver_user_id' => $uid]);
                    if (!empty($approvals)) {
                        foreach ($approvals as $approval) {
                            if ((int)$approval['status_id'] === $pendingApprovalStatusId) {
                                return self::jsonResponse([
                                    'success' => false,
                                    'message' => 'You cannot remove this user because they are currently involved in an active Order Approval process. Please wait until the approval process is completed before attempting to remove this member or contact our support.'
                                ]);
                            }
                        }
                    }
                }
            } catch (\Exception $e) {}

            try {
                $pendingStatus = Document::get("signatory/status", ['uid' => 'pending']);
                $pendingStatusId = array_shift($pendingStatus)['id'] ?? null;
                if ($pendingStatusId) {
                    $userSignatories = Document::get("signatory", ['user_id' => $uid, 'status_id' => $pendingStatusId]);
                    foreach ($userSignatories as $signatory) {
                        $documentId = $signatory['document_id'] ?? null;
                        if (!$documentId) {
                            continue;
                        }
                        $hasPending = in_array($pendingStatusId, array_column($signatory['signer'], 'signer_status_id'));
                        if ($hasPending) {
                            return self::jsonResponse([
                                'success' => false,
                                'message' => 'You cannot remove this team member because they have a pending DocuSign Order. Please wait until it is finalized before attempting to remove this member or contact our support.'
                            ]);
                        }
                    }
                }
            } catch (\Exception $e) {}

            if ($uid !== (int)$user->getId()) {
                $status = Document::get("signatory/status", ['uid' => 'pending']);
                $status_id = array_shift($status)['id'];
                $user_signatories = Document::get("signatory", ['user_id' => $uid, 'status_id' => $status_id]);
                if ($user_signatories) {
                    foreach ($user_signatories as $sign) {
                        try {
                            $categories = Document::get("category", ['document_id' => $sign['document_id']]);
                            $category = array_shift($categories);
                            if ($category) {
                                $transactions = Transactions::get("transaction", ['tender_id' => $category['entity_id']]);
                                $transaction = array_shift($transactions);
                                if (isset($transaction['status_id']) && (int)$transaction['status_id'] === Transactions::TRANSACTION_STATUS_WITHDRAWN) {
                                    $can_be_removed = true;
                                    break;
                                }
                            }
                        } catch (\Exception $e) {
                            $can_be_removed = true;
                        }
                    }
                } else {
                    $can_be_removed = true;
                }
            }

            break;
        }

        if ($can_be_removed && $targetMember) {
            self::post("account-actions", [
                'account_id'              => (int) $user->getAccountId(),
                'related_account_id'      => (int) $user->getAccountId(),
                'account_user_id'         => (int) $user->getId(),
                'related_account_user_id' => null,
                'action_type'             => 'team_member_remove',
                'description'             => sprintf(
                    '%s removed %s %s (%s) from the team',
                    $user->getData("display_name"),
                    $targetMember["firstname"] ?? $targetMember["name"] ?? '',
                    $targetMember["lastname"] ?? '',
                    $targetMember["email"] ?? ''
                ),
            ]);

            if ($targetRole == self::PROJECT_TEAM_MEMBER) {
                Project::deleteProjectTeamMemberRoleMappingByUserId($uid);
            }

            self::delete("user/$uid");
            Session::remove();
            $result = true;
        }

        return self::jsonResponse([
            'success' => $result,
            'message' => $result
                ? 'The user has been successfully removed from the system'
                : 'The user could not be removed from the system'
        ]);
    }

    /**
     * @param array $sids
     * @param array $uids
     * @return array
     * @throws Exception
     */
    public static function loadAccounts(array $sids, array $uids = []): array
    {
        $accounts = self::getAccounts($sids);
        $result = [];
        $accounts = array_values($accounts);
        foreach ($accounts as $key_id => $account) {
            $account_data = self::getAccount($account['id']);
            if(isset($uids[$key_id])){
                $uid = (int)$uids[$key_id];
                $account['user_id'] = $uid;
                $account['user'] = array_values(array_filter($account_data['users'], function($item) use ($uid) {
                    return ((int)$item['id'] === $uid);
                }));
                if($account['user']){
                    $account['user'] = array_shift($account['user']);
                }
            }
            else{
                $account['user'] = array_shift($account_data['users']);
            }
            $account['team'] = $account_data['users'];
            $result[] = new AccountModel($account, $account['id']);
        }

        return $result;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return void
     */
    public static function updateLogo(Request $request, User $user, $args)
    {
        $file = $_FILES["logo"] ?? false;
        $hash = md5($user->getAccountId());
        if ($file) {
            $key = S3::getKey("logo.png", "account", ["logo", $hash]);
            S3::upload("asset", $key, $file["tmp_name"], "png");
            return self::jsonResponse([
                'success' => true
            ]);
        }
        self::throwJsonException("Failed to upload company logo");
    }

    /**
     * @param int $type_id
     * @param array $types
     * @return bool
     */
    public static function isTypeOf(int $type_id, array $types): bool
    {
        return in_array(array_search($type_id, self::getTypes()), $types, true);
    }

    /**
     * @return string[]
     */
    public static function getSpecialistTypes(): array
    {
        return self::$specialist_types;
    }

    /**
     * @return string[]
     */
    public static function getSpecialistExternalTypes(): array
    {
        return self::$specialist_external_types;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     */
    public static function downloadPrequalification(Request $request,  User $user, array $args)
    {
        $account = self::getAccount((int)$args['id']);
        if (isset($account['id'])) {
            $file = sprintf('%s/prequalification/%s/export_pdf/%s', Config::get("relay.app_prosper"), (int)$args['id'], $user->getToken());
            $name = ucwords(strtolower($account['name'])) . " C-Link Prequalification.pdf";
            header("Content-Description: File Transfer");
            header("Content-Type: application/octet-stream");
            header("Content-Disposition: attachment; filename=\"" . basename($name) . "\"");
            readfile($file);
            exit();
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return Client\Response\JsonResponse
     * @throws Exception
     */
    public static function hasPrequalification(Request $request,  User $user, array $args)
    {
        $file = sprintf('%s/prequalification/%s/%s', Config::get("relay.app_prosper"), (int)$args['id'], $user->getToken());
        $json = file_get_contents($file);
        if ($json) {
            $json = json_decode($json);
            $approved = $json->data->statuses->approved ?? false;
        }
        return self::jsonResponse([
            'prequalification' => $approved ?? false
        ]);
    }

    /**
     * @return array
     * @throws \Exception
     */
    public static function getRegionGroups(): array
    {
        return self::get("region/group");
    }

    /**
     * @param array $filter
     * @return array
     * @throws \Exception
     */
    public static function getAccountOfferings(array $filter = []): array
    {
        return self::get("account/offerings", $filter);
    }

    /**
     * @param array $uids
     * @return mixed
     * @throws \Exception
     */
    public static function loadUsersByIds(array $uids = [])
    {
        return self::get("user",  ["id" => "[" . implode(",", $uids) . "]"]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return Client\Response\JsonResponse
     * @throws Exception
     */
    public static function getThresholds(Request $request,  User $user, array $args)
    {
        $thresholds = self::get(sprintf("thresholds/%s", $user->getAccountId()));
        return self::jsonResponse([
            'thresholds' => $thresholds ?? []
        ]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return Client\Response\JsonResponse
     * @throws Exception
     */
    public static function createThreshold(Request $request, User $user, array $args)
    {
        $requestData = $request->getJson();
        $nullToValueCount = 0;
        try {
            $existingThresholds = self::get(sprintf("thresholds/%s", $user->getAccountId()));
            $hadNoThresholdsBefore = empty($existingThresholds);
            foreach ($requestData['data'] as $index => $item) {
                $from = $item['from_value'];
                $to = $item['to_value'];

                // Check from
                if (!is_numeric($from) || $from < 0) {
                    throw new Exception("Error at index $index: 'from' must be a positive number >= 0. Given: " . var_export($from, true));
                }

                // Check to
                if (is_null($to)) {
                    $nullToValueCount++;
                } elseif (!is_numeric($to) || $to <= $from) {
                    throw new Exception("Error at index $index: 'to' must be a number greater than 'from' when not null. from: $from, to: " . var_export($to, true));
                }
            }

            if ($nullToValueCount > 1) {
                throw new Exception("Error: Only one entry is allowed to have 'to' as null, found $nullToValueCount.");
            }
            foreach ($requestData['data'] as $item) {
                if ($item['remove']) {
                    // fetch user mappings of threshold
                    $userMappings = self::get(sprintf("thresholds/threshold/%s/users", $item['id']));

                    // delete threshold
                    self::delete(sprintf("thresholds/%s", $item['id']));

                    $userIds = !empty($userMappings) ? array_unique(array_column($userMappings, 'user_id')) : [];

                    // fetch permissions
                    $permissions = self::get("permissions");
                    $permissionId = null;
                    foreach ($permissions as $p) {
                        if ($p['key'] === self::APPROVAL_THRESHOLD) {
                            $permissionId = $p['id'];
                            break;
                        }
                    }
                    if ($permissionId && !empty($userIds)) {
                        $allMappings = self::get("thresholds/user", ['user_ids' => $userIds]);
                        $allMappedUserIds = !empty($allMappings) ? array_column($allMappings, 'user_id') : [];
                        $nonMatchingUsers = array_diff($userIds, $allMappedUserIds);
                        foreach ($nonMatchingUsers as $userId) {
                            self::delete(sprintf("permissions/user/%s/%s", (int)$userId, (int)$permissionId));
                        }
                    }
                } else {
                    $data = [
                        'account_id' => $user->getAccountId(),
                        'from_value' => $item['from_value'] ?? 0,
                        'to_value' => $item['to_value'] ?? null
                    ];

                    if (!empty($item['id']) && $item['id'] > 0) {
                        self::patch(sprintf("thresholds/%s", $item['id']), $data);
                    } else {
                        self::post("thresholds", $data);
                    }
                }
            }
            $thresholds = self::get(sprintf("thresholds/%s", $user->getAccountId()));
            $permissions = self::get("permissions");
            $permissionId = null;
            foreach ($permissions as $p) {
                if ($p['key'] === self::APPROVAL_THRESHOLD) {
                    $permissionId = $p['id'];
                    break;
                }
            }

            if ($permissionId) {
                if (empty($thresholds)) {
                    $userPermissions = self::get("permissions/mappings", [
                        'permission_id' => $permissionId
                    ]);

                    if (!empty($userPermissions)) {
                        foreach ($userPermissions as $perm) {
                            self::delete(sprintf("permissions/user/%s/%s", (int)$perm['user_id'], (int)$permissionId));
                        }
                    }
                }
                if ($hadNoThresholdsBefore && !empty($thresholds)) {
                    $userPermissions = self::get("permissions/mappings", [
                        'permission_id' => $permissionId
                    ]);

                    if (!empty($userPermissions)) {
                        foreach ($userPermissions as $perm) {
                            self::delete(sprintf("permissions/user/%s/%s", (int)$perm['user_id'], (int)$permissionId));
                        }
                    }
                }
            }
            return self::jsonResponse([
                'success' => true,
                'thresholds' => $thresholds ?? []
            ]);
        } catch (\Exception $e) {
            return self::jsonResponse([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update approval threshold and restrictions for a 6 member
     *
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return Client\Response\JsonResponse
     * @throws Exception
    */
    public static function updatePermissionThreshold(Request $request, User $user, array $args)
    {
        try {
            $requestData = $request->getJson();
            $token = app()->Cookie->getCookie('token');
            $res = Api::post("threshold/update-permission-threshold", $requestData, ['Authorization' => "Bearer $token"]);
            return self::jsonResponse($res->json(), $res->getInfo()['http_code']);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 400);
        }
    }

    /**
     * Update user permission and restrictions
     *
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return Client\Response\JsonResponse
     * @throws Exception
    */
    public static function updatePermissionUser(Request $request, User $user, array $args)
    {
        try {
            $requestData = $request->getJson();
            $token = app()->Cookie->getCookie('token');
            $res = Api::post("permissions/update-user-permission", $requestData, ['Authorization' => "Bearer $token"]);
            return self::jsonResponse($res->json(), $res->getInfo()['http_code']);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 400);
        }
    }

    /**
     * @param array $types
     * @return array
     * @throws Exception
     */
    public static function getEmailTypeIds(array $types): array
    {
        $emailTypes = self::get("email/types");

        $typeMap = [];
        foreach ($emailTypes as $type) {
            $typeMap[$type['uid']] = (int) $type['id'];
        }

        return array_map(fn($t) => $typeMap[$t] ?? 0, $types);
    }
}
