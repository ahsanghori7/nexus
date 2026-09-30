<?php

namespace App\controllers;

use App\Api\Email\Email;
use App\core\Config;
use App\core\Session;
use App\core\Controller;
use App\DocCreator\Docusign\Docusign;
use App\Models\Permission;
use App\Models\User;
use App\Api\Account;
use App\Api\Document as DocumentApi;
use App\Models\UserModel;
use App\Factory\UserFactory;
use DocuSign\eSign\Api\EnvelopesApi as DocusignEnvelopesApi;
use DocuSign\eSign\Client\ApiClient as DocusignApiClient;

class HomeController extends Controller
{

    public $data = [];


    const DASHBOARD_URL = SITE_URL . "/main-contractor";

    /**
     * Keep all the pages titles in this property for easier management,
     * Might be better to keep them in config.. maybe..
     * Logic for adding title to view is in core/Controller:beforeAction
     * @var array
     */
    protected $titles = [
        "login" => "Login to your C-Link account | C-Link",
        "upgrade_now" => "Upgrade your C-Link account today"
    ];

    public function isAuthorized(): bool
    {

        $action = $this->request->param('action');

        $resource = 'user';

        //config used for conditions on permission check
        $config = [];

        Permission::allow('administrator', $resource, '*');
        Permission::allow(
            '',
            $resource,
            [
                'login', 'logout', 'index', 'reset_password',
                'new_password', 'sign_up', 'reset_success', 'pricing',
                'sign_up_success', 'upgrade_success', 'free_trial', 'maintenance', "sign_up_from_team",
                'auto_loader', "error_page", "sign_up_check", "sso_login", "user_auth", "auth"
            ]
        );

        return Permission::check('', $resource, $action, $config);
    }

    /**
     * @return void
     */
    public function startupProcess(): void
    {
        parent::startupProcess();
    }

    public function beforeAction(): void
    {
        parent::beforeAction();
        $actions = ['login', 'reset_password', 'new_password'];

        $this->Security->requirePost($actions);
        $action = $this->request->param('action');
        switch ($action) {

            case "login":
                $this->Security->config("form", ['fields' => ['username', 'pass']]);
                break;

            case "reset_password":
                $this->Security->config("form", ['fields' => ['email']]);
                break;

            case "new_password":
                $this->Security->config("form", ['fields' => ['password', 'repeat-password']]);
                break;
        }

        $this->view->setContext(["logged_in" => isLoggedIn()]);
    }

    public function error_page(): void
    {
        removeLayout('header', 'header');
        removeLayout('footer', 'footer');
        $this->view->setContext(["react_app" => "clink", "version" => "2"]);
        renderLayouts('react', ['template_path' => 'main-contractor']);
    }

    public function sign_up_from_team()
    {
        $data = [];
        $token = query_data('token') ?? request_data('token');
        $request = $this->request->data;

        try {
            $response = Account::get('token/verify/' . $token, ['label' => 'team_invite']);
            $account = $response['account'];
            $user    = $response['user'];
            $data['team_validation'] = true;
            $data['email']      = $account['email'];
            $data['company']    = $account['name'];
            $data['firstname']  = $user['firstname'];

            $region = $account['region_group_id'];
            $regions = Account::get('region/group');
            $regions = array_filter($regions, function ($item) use ($region) {
                return $item['id'] === $region;
            });
            $region = $regions ? array_shift($regions) : null;
            $data['is_ANZ']  = in_array($region["code"], ["NZ", "AUS"]);
        } catch (\Throwable $e) {
            redirect(SITE_URL . "/login");
        }

        /*
        * Form submit
        */
        if (!empty($request) && request_data("team_sign_up")) {
            /*
             * Get information based on the email
            */

            if (isset($user) && (int)$user['status'] === User::STATUS_PENDING) {
                /*
                 * Every call below throws on failure, and an escaped throw here
                 * lands the user on a 500 page
                */
                try {
                    $update_error = Account::updateUserById(
                        [
                            'firstname' => request_data('first_name'),
                            'lastname'  => request_data('last_name'),
                            'contact_number'  => request_data('phone_number'),
                            'password'        => request_data('password'),
                            'email'           => $user['email'],
                            'status'          => User::STATUS_ACTIVE
                        ],
                        $user['id']
                    );

                    /*
                     * Nothing was saved, so logging in would only fail with a
                     * misleading "invalid credentials"
                    */
                    if ($update_error) {
                        Session::setMessage(e_html($update_error), 'sign_up_from_team_error');
                    } else {
                        /*
                         * Log in the user automatically
                        */
                        $session = Account::login($user['email'],  request_data('password'), "CLINK"); // TODO: Get this from form
                        /*
                         * Store User session data
                         * The data will be later used to check the user data
                        */
                        UserFactory::storeUserSession($user["id"], $user["account_id"], $session['token']);

                        /*
                         * Logged in the user
                         * Set the token cookie
                        */
                        $expires_time = time() + (strtotime($session['expires']) - strtotime($session['created_at']));
                        $this->Cookie->setToken($session['token'], $expires_time);
                        $this->Cookie->setUserId($user["id"], $expires_time);
                        /*
                         * Redirect the user to his dashboard
                        */
                        redirect(self::DASHBOARD_URL);
                        return;
                    }
                } catch (\Throwable $e) {
                    error_log(sprintf(
                        'Team invite sign up failed for user %s: %s',
                        $user['id'],
                        $e->getMessage()
                    ));
                    Session::setMessage(
                        'We could not complete your sign up. Please try again, or contact support if the problem continues.',
                        'sign_up_from_team_error'
                    );
                }
            } else {
                Session::setMessage('This invite has already been used. Please log in instead.', 'sign_up_from_team_error');
            }
        }

        $this->view->setContextItem("message", [
            "type" => "error!",
            "content" => Session::getMessages("sign_up_from_team_error")
        ]);

        /*
             * Remove the header and the footer template from this page
             */
        removeLayout('header', 'header');
        removeLayout('footer', 'footer');

        renderLayouts('sign_up_from_team', $data);
    }

    /**
     * Check if the user has an account and if they do, redirect them to the correct login page based on there SSO provider,
     * use default login page if no SSO provider is found
     */
    public function sign_up_check(): void
    {
        //If the user is already logged in, redirect them to the dashboard
        if (isLoggedIn()) {
            redirect(self::DASHBOARD_URL);
        }
        $email = query_data('email') ?? request_data('email');
        //Default redirect url
        $redirectUrl = "";
        if ($email !== null) {
            $email = trim($email); // Remove whitespace
            $email = filter_var($email, FILTER_SANITIZE_EMAIL); // Sanitize input
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                try {
                    $response = Account::get('user/search', ['field' => 'email', 'value' => $email]);
                    $accountId = $response['account_id'] ?? null;
                    if($accountId !== null) {
                        $provider = Account::get('account/' . $accountId . '/sso/provider');
                        $redirectUrl = $provider['redirect_url'] ?? "";
                    }
                } catch (\Exception $e) {
                    error_log("Failed to find SSO provider for user '{$email}': " . $e->getMessage());
                    $redirectUrl = SITE_URL . "/login?success=false";
                }
            }
        }

        if(!$redirectUrl || empty($redirectUrl)) {
            $redirectUrl = SITE_URL . "/login?id=" . base64_encode($email);
        }
        echo '<meta http-equiv="refresh" content="0; url='.$redirectUrl.'">';
        exit();
    }

    /**
     * Handle the SSO login process
     * @param string $provider
     * @return void
     */
    public function sso_login(string $provider): void
    {
        //Remove all non-alphabetic characters from the provider name
        $provider = preg_replace('/[^a-z]/', '', strtolower($provider));
        //If the user is already logged in, redirect them to the dashboard
        if (isLoggedIn()) {
            redirect(self::DASHBOARD_URL);
        }
        $data = app()->request->query;
        if(!$provider) {
            redirect(SITE_URL . "/login");
        }

        try {
            $login = Account::get('account/sso/' . $provider . '/login', $data);
        } catch (\Exception $e) {
            Session::setMessage(\LanguageControl::get('sso_login_failed'), 'sso_error');
            redirect(SITE_URL . "/auth?success=false");
        }

        $token = $login["token"] ?? null;
        $user = $login["user"] ?? null;

        if(!$token || !$user || !$user["id"] || !$user["account_id"] || !$token["token"]) {
            //Error handling is captured by the account service
            error_log("Failed to login user");
            redirect(SITE_URL . "/login");
        }
        /*
        * Store User session data
        * The data will be later used to check the user data
        */
        UserFactory::storeUserSession($user["id"], $user["account_id"], $token["token"]);
        /*
        * Logged in the user
        * Set the token cookie
        */
        $expires_time = time() + (strtotime($token["expires"]) - strtotime($token["created_at"]));
        $this->Cookie->setToken($token["token"], $expires_time);
        $this->Cookie->setUserId($user["id"], $expires_time);
        /*
        * Redirect the user to his dashboard
        */
        redirect(self::DASHBOARD_URL);
    }

    public function login(): void
    {
        /*
             * if the user is already logged in app clink
             * we will redirect him to his dashboard
            */
        if (isLoggedIn()) {
            redirect(self::DASHBOARD_URL);
        }

        setJsConfig('curPage', __FUNCTION__);

        /*
             * Remove the header and the footer template from this page
             */
        removeLayout('header', 'header');
        removeLayout('footer', 'footer');

        /*
             * form is submitted
             */
        if (!empty($this->request->data)) {

            $username = request_data('username');
            $password = request_data('pass');
            $app = request_data('app');

            try {
                $data = Account::login($username, $password, $app);

                //if the user status is not active
                if (isset($data['status']) && !$data['status']) {
                    throw new \Exception(\LanguageControl::get('disabled_account'));
                }

                /*
                   * Get the user data
                  */
                $user_data = $data['user'];

                /*
                   * Get account info
                   */
                $account_info = Account::getAccount($user_data['account_id']);

                //the user is not a main contractor we need to redirect them to the correct login page
                if (Account::isTypeOf($account_info['type_id'], Account::getSpecialistTypes())) {
                    redirect(config('url.app_prosper') . '/login');
                }

                /*
                   * Store User session data
                   * The data will be later used to check the user data
                   */
                UserFactory::storeUserSession($user_data["id"], $user_data["account_id"], $data['token']);

                /*
                   * Logged in the user
                   * Set the token cookie
                   */
                $expires_time = time() + (strtotime($data['expires']) - strtotime($data['created_at']));
                $this->Cookie->setToken($data['token'], $expires_time);
                $this->Cookie->setUserId($user_data["id"], $expires_time);
                /*
                   * Redirect the user to his dashboard
                   */
                redirect(self::DASHBOARD_URL);
            } catch (\Exception $e) {
                Session::setMessage($e->getMessage(), 'login_error');
                header("Location: /login?success=false");
                exit;
            }
        }

        $this->view->setContextItem("message", [
            "type" => "error!",
            "content" => Session::getMessages("login_error")
        ]);

        $this->view->setContext(["react_app" => "clink"]);
        $this->view->setContext(["version" => 2]);
        renderLayouts('../users/main-contractor/pages/react');
    }

    public function logout(): void
    {
        $user_session = app()->Cookie->getUserSession();
        $account_id = $user_session['user']['account_id'] ?? '';

        /*
         * get the token stored in session from log in
        */
        $token = app()->Cookie->getCookie('token');
        if (isset($_COOKIE['packageManagementCheck'])) {
            unset($_COOKIE['packageManagementCheck']);
            setcookie('packageManagementCheck', '', -1, '/');
        }
        /*
         * destroy the current session
         */
        session_destroy();

        /*
         * delete the session token from account service
         */
        Account::delete('user/session/' . $token);

        /*
             * Remove all cookie tokens
             */
        app()->Cookie->removeSessionTokens();

        login_url_redirect($account_id);
    }

    public function reset_password(): void
    {

        setJsConfig('curPage', __FUNCTION__);

        removeLayout('header', 'header');
        removeLayout('footer', 'footer');

        //form is submitted
        if (!empty($this->request->data)) {

            $email_send = request_data('email');

            //api get token for reset password
            try {
                $response = Account::get('user/reset_password/' . $email_send);

                //send the email
                $data = [
                    'token' => SITE_URL . '/new-password?token=' . $response['token'],
                ];

                $user = Account::get("user?email=" . $email_send);
                if ($user) {
                    $user = array_shift($user);
                    Email::send([
                        'sender'     => ['id' => $user['id']],
                        'template' => 'Reset Password',
                        'to'       => $email_send,
                        'extra'    => $data
                    ], 'clink');
                }

                //redirect the user to the success page
                redirect(SITE_URL . '/reset-password?send=true');
            } catch (\Exception $e) {
                Session::setMessage('The email address does not exist', 'reset_password_error');
            }
        }

        $this->view->setContextItem("message", [
            "type" => "error!",
            "content" => Session::getMessages("reset_password_error")
        ]);

        $this->view->setContext(["react_app" => "clink"]);
        $this->view->setContext(["version" => 2]);
        renderLayouts('../users/main-contractor/pages/react');
    }

    public function new_password(): void
    {

        setJsConfig('curPage', __FUNCTION__);

        addJsLib(static_path('js/pass-reset-validator.js'));

        removeLayout('header', 'header');
        removeLayout('footer', 'footer');

        // Jquery Confirm
        addCssLib('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css');
        addJsLib('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');

        $token = $this->request->query['token'] ?? null;

        $valid = false;
        $user_id = null;
        $error = '';

        if ($token) {
            /*
                 * verifiy the session
                 */
            try {
                $response = Account::get('user/session/' . $token);
                $valid = true;
                $user_id = $response['user_id'] ?? null;
            } catch (\Exception $e) {
                redirect(SITE_URL . '/login');
            }
        }

        /*
             * the token is not valid or is expired
             * or
             * the user id is not provided from the api
             */
        if (!$valid || !$user_id) {
            redirect(SITE_URL . '/login');
        }

        /*
             * form is submitted
             */
        if (!empty($this->request->data)) {

            $password = request_data('password');
            $password_repeat = request_data('repeat-password');

            if ($password !== $password_repeat) {
                $error .= 'The password don\'t match';
            }

            $data = [
                'token' => $token,
                'password' => $password
            ];

            $user_info = Account::getUser($user_id);

            if (!$error) {

                /*
                     * Renew the password on account service
                     */

                $response = Account::post('user/renew_password', $data)->json();
                if (isset($response['error'])) {
                    $error = $response['error']['friendly'];
                }

                if (isset($response['data'])) {

                    /*
                         * send the email
                         */
                    $data = [
                        'reset_url' => SITE_URL . '/new-password?token=' . $token,
                        'expiring_time' => '1 hour'
                    ];

                    $email = clink_email();
                    $email->from('no-reply@c-link.com', 'C-Link');
                    $email->subject('C-Link Password Reset Successfully');
                    $email->to($user_info['email']);
                    $email->template('reset-password', $data);
                    $email->send();

                    /*
                         * remove the renew password token
                         */
                    Account::delete('token/' . $token);

                    /*
                       * Remove all cookie tokens
                       */
                    app()->Cookie->removeSessionTokens();

                    /*
                        * Redirect the user to the success page
                       */
                    redirect(SITE_URL . '/reset-success');
                }
            }
        }

        if ($error) {
            Session::setMessage($error, 'renew_password_error');
        }

        $this->view->setContextItem("message", [
            "type" => "error!",
            "content" => Session::getMessages("renew_password_error")
        ]);

        renderLayouts('new-password');
    }

    public function reset_success(): void
    {

        setJsConfig('curPage', __FUNCTION__);

        removeLayout('header', 'header');
        removeLayout('footer', 'footer');

        renderLayouts('reset-success-page');
    }

    public function auth(): void
    {
        /**
         * if the user is already logged in
         * redirect him to dashboard
         */
        if (isLoggedIn()) {
            redirect(self::DASHBOARD_URL);
        }
        removeLayout('header', 'header');
        removeLayout('footer', 'footer');
        $this->view->setContext(["react_app" => "clink", "version" => "2"]);
        renderLayouts('react', ['template_path' => 'main-contractor']);
    }

    public function upgrade_success(): void
    {
        setJsConfig('curPage', __FUNCTION__);

        renderLayouts('success-page');
    }

    public function sign_up_success(): void
    {
        setJsConfig('curPage', __FUNCTION__);

        renderLayouts('success-page');
    }

    public function maintenance(): void
    {
        setJsConfig('curPage', __FUNCTION__);

        renderLayouts('maintenance');
    }

    public function sign_up(): void
    {

        setJsConfig('curPage', __FUNCTION__);

        addJsLib(static_path('js/pass-reset-validator.js'));

        // Jquery Confirm
        addCssLib('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css');
        addJsLib('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');

        $subscriptions = Account::getSubscriptions();

        $plan = query_data('plan');
        $interval = query_data('interval');

        $subscription = false;
        foreach ($subscriptions as $k => $v) {
            if ($v['interval_type'] === $interval) {
                if ($v['price'] > 0 && strcasecmp($plan, $v['label']) === 0) {
                    $subscription = $v;
                    break;
                }
            }
        }

        if (!$subscription) {
            redirect(SITE_URL);
        }

        if (isLoggedIn()) {
            redirect(SITE_URL . "/relay?action=gocardless&method=upgradeRequest&sub_id=" . $subscription["id"]);
        }

        $this->view
            ->setContext(["title" => "Sign up for a C-Link Account | C-Link"])
            ->setContextElements(
                "meta",
                [
                    [[
                        "name" => "robots",
                        "content" => "noindex"
                    ]],
                    [[
                        "name" => "description",
                        "content" => "Complete your C-Link Sign-up"
                    ]]
                ]
            );

        $data['subscription'] = $subscription;
        $data['action'] = "gocardless";
        $data['method'] = "paymentRequest";

        $this->view->setContextItem("message", [
            "type" => "error!",
            "content" => Session::getMessages("form_error")
        ]);

        renderLayouts('sign-up', $data);
    }

    public function free_trial(): void
    {
        setJsConfig('curPage', __FUNCTION__);

        addJsLib(static_path('js/pass-reset-validator.js'));

        $subscriptions = Account::getSubscriptions();

        $plan = query_data('plan');
        $interval = query_data('interval');

        $subscription = false;
        foreach ($subscriptions as $k => $v) {
            if (strcasecmp($v['label'], "Free Trial") === 0) {
                $subscription = $v;
                break;
            }
        }

        $this->view
            ->setContext(["title" => "Sign up for a C-link Free Trial | C-Link"])
            ->setContextElements(
                "meta",
                [
                    [[
                        "name" => "robots",
                        "content" => "noindex"
                    ]],
                    [[
                        "name" => "description",
                        "content" => "Complete your C-Link free trial sign-up"
                    ]]
                ]
            );

        renderLayouts('sign-up', [
            "subscription" => $subscription,
            "action" => "account",
            "method" => "freeTrial"
        ]);
    }

    public function pricing(): void
    {
        redirect(config('url.c-link') . "/pricing");
    }

    public function index(): void
    {
        redirect(config('url.c-link'));
    }

    public function auto_loader(): void
    {
        $reviewToken = $this->request->query['review_token'] ?? null;
        $token = $reviewToken ?? ($this->request->query['token'] ?? null);
        $tokenLabel = $reviewToken ? 'review_token' : 'auto_loader';
        $redirect = $this->request->query['redirect'] ?? null;
        $rawRedirect = $this->request->query['plain_redirect'] ?? null;

        try {
            $response = Account::get('token/verify/' . $token, ['label' => $tokenLabel]);

            $user_id = $response['user_id'] ?? null;
            $aid = $response['account']['id'];

            /*
         * Logged in the user
         * Set the token cookie
        */
            $contractorModel = new UserModel($response['account'], $aid);
            $request = $contractorModel->createTokenByLabel($user_id, 'session');
            $json = $request->json()["data"] ?? [];

            /*
         * Store User session data
         * The data will be later used to check the user data
        */
            UserFactory::storeUserSession($user_id, $aid, $json['token']);
            $expires_time = time() + (strtotime($json['expires']) - strtotime($json['created_at']));
            $this->Cookie->setToken($json['token'], $expires_time);
            $this->Cookie->setUserId($user_id, $expires_time);

            // Conditional redirect logic
            if (!empty($rawRedirect)) {
                // Redirect the user to other page
                $redirect = config("url.site") . "/" . str_replace("//", "/", $redirect);
            } else {
                // Redirect the user to his dashboard
                $redirect = config("url.site") . "/main-contractor/" . str_replace("//", "/", $redirect);
            }
            redirect($redirect);
        } catch (\Exception $e) {
            redirect(SITE_URL . '/login');
        }
    }
}
