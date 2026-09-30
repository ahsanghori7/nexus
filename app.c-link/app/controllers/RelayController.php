<?php

namespace App\controllers;

use App\Api\CompanyProfile;
use App\Api\FileManager;
use App\Api\GoCardless;
use App\Api\Project;
use App\Api\ProjectManagement;
use App\Api\Prequalification;
use App\core\Controller;
use App\core\Environment;
use App\core\Session;
use App\Factory\UserFactory;
use App\Api\Client;
use App\Api\Account as Account;
use App\Api\Util as Util;
use App\Api\SupplyChain;
use App\Api\V2\SupplyChain as V2SupplyChain;
use App\Api\Trade;
use App\Api\PricingDoc;
use App\Api\Transactions;
use App\Api\Document;
use App\Api\Analyser;
use App\Api\Document\Category as DocCategory;
use App\Api\Tender;
use App\Api\TenderRecommendation;
use App\Api\Document\Template;
use App\Api\Document\TenderTemplate;
use App\Api\Document\Sow;
use App\Api\Document\NumberDocument;
use App\Api\Tender\Order;
use App\Api\Client\Response\JsonResponse;
use App\Api\Client\Response\JsonException;
use App\Api\Stripe;
use App\Api\CompanyHouse;
use App\Api\Feedback;
use App\Api\Analytics;
use App\Api\BoQ\BoQ;
use App\Api\Unit;

header('Access-Control-Allow-Origin: ' . config('url.c-link'));
header("Access-Control-Allow-Methods: HEAD, GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method,Access-Control-Request-Headers, Authorization");
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
if ($method == "OPTIONS") {
    header("HTTP/1.1 200 OK");
    die();
}

class RelayController extends Controller
{
    /**
     * @var string
     */
    protected $lastError = "";

    /**
     * @var string
     */
    protected $user_path = 'relay';

    /*
         * @var bool
         */
    protected $authed = false;

    /**
     * @var string[]
     */
    protected $actions = [
        "account" => Account::class,
        "supply_chain" => SupplyChain::class,
        "v2_supply_chain" => V2SupplyChain::class,
        "trade" => Trade::class,
        "project" => Project::class,
        "util" => Util::class,
        "pricing_doc" => PricingDoc::class,
        "transaction" => Transactions::class,
        "file_manager" => FileManager::class,
        "document" => Document::class,
        "document_category" => DocCategory::class,
        "tender" => Tender::class,
        "template" => Template::class,
        "tender_template" => TenderTemplate::class,
        "analyser" => Analyser::class,
        "sow" => Sow::class,
        "number_document" => NumberDocument::class,
        "order" => Order::class,
        "stripe" => Stripe::class,
        "company_house" => CompanyHouse::class,
        "project_management" => ProjectManagement::class,
        "feedback" => Feedback::class,
        "analytics" => Analytics::class,
        "prequalification" => Prequalification::class,
        "company_profile" => CompanyProfile::class,
        "boq" => BoQ::class,
        "unit" => Unit::class,
    ];

    /**
     * Keep a container for logged in user object
     */
    protected $user;

    /**
     * Attempt to match the action param to a api client class and the method
     * param to a authorised class function
     * @return array
     */
    public function getRequestedRelay(): array
    {
        $action = $this->request->getQueryValue("action");
        $method = $this->request->getQueryValue("method");
        $relay = [];

        if ($action && $method) {
            $cls = $this->actions[$action] ?? false;
            if ($cls) {
                $security = $cls::getSecurity();
                if (isset($security["methods"][$method])) {
                    $relay = [$cls, $method];
                }
            }
        }

        return $relay;
    }

    /**
     * @param array $relay
     */
    public function isValidRelay(array $relay): bool
    {
        if (count($relay) !== 2) {
            $this->response->setStatusCode(400);
            $this->response->setContent("Invalid Action");
            return false;
        }
        return true;
    }

    /**
     * @param array $relay
     * @param array $args
     * @return bool
     */
    public function preChecks(array $relay, array &$args)
    {
        $valid = true;
        try {
            $user = UserFactory::getUser();
        } catch (\Throwable $e) {
            $user = false;
        }

        $security = $relay[0]::getSecurity();
        $checks = $security["methods"][$relay[1]]["pre_checks"] ?? [];

        if (($this->requiresSession($relay[0], $relay[1]) || !empty($checks)) && !$user) {
            $this->response->setStatusCode(401);
            $this->response->setContent(json_encode([
                "error" => "Unauthorized",
                "message" => "Your session has expired. Please log in again.",
            ]));
            $this->response->type("application/json");
            $valid = false;
        }

        if ($valid) {
            foreach ($checks as $check) {
                if (is_array($check)) {
                    forward_static_call_array($check, [$this->request, $user, &$args]);
                } else {
                    $relay[0]::$check($this->request, $user, $args);
                }
            }
        }
        return $valid;
    }


    /**
     * @param array $relay
     * @return array
     * @throws \Exception
     */
    public function getRelayArgs(array $relay)
    {
        $args = [];
        $security = $relay[0]::getSecurity();
        $required =  $security["methods"][$relay[1]]["required_args"] ?? [];
        foreach ($required as $required => $type) {
            $v = $this->request->getQueryValue($required);
            if (!$v) {
                throw new \Exception("Missing required arguments");
            }
            switch ($type) {
                case "int":
                    $value = (int) $v;
                default:
                    $value = $v;
            }
            $args[$required] = $value;
        }

        return $args;
    }

    /**
     * @param Client $client
     * @param $method
     * @return bool
     */
    public function requiresSession($client, $mathodname): bool
    {
        $security = $client::getSecurity();
        $required = false;
        if (isset($security["methods"][$mathodname])) {
            $method   = $security["methods"][$mathodname];
            $required = $method["requires_session"] ?? false;
        }
        return ($required === true);
    }

    /**
     * The index action forwards all request onto relevant api classes and matched
     * method, it then attempts to either forward a user on,
     * or relay the api response or error
     */
    public function index()
    {
        $error = $output = false;
        $relay = $this->getRequestedRelay();
        if (!$this->isValidRelay($relay)) {
            return;
        }

        try {
            $args = $this->getRelayArgs($relay);
            if (!$this->preChecks($relay, $args)) {
                return;
            }
            //Remember to make api class method static
            $output = forward_static_call_array(
                $relay,
                [$this->request, UserFactory::getUser(), $args]
            );
        } catch (\App\Api\Exception $e) {
            $this->handleError($e->getMessage());
        } catch (JsonException $e) {
            $this->response->setStatusCode($e->getCode() ?? 500);
            $this->response->setContent(json_encode($e));
            $this->response->type("application/json");
            return;
        } catch (\Exception $ex) {
            //@ToDo Log this exception
            if (!Environment::isProduction()) {
                $status = (int) $ex->getCode();
                if ($status < 400 || $status >= 600) {
                    $status = 500;
                }
                $json = Client::jsonResponse([
                    "error" => "internal_error",
                    "message" => $ex->getMessage(),
                    "type" => get_class($ex),
                    "file" => $ex->getFile(),
                    "line" => $ex->getLine(),
                ], $status);

                if ($json->getStatus()) {
                    $this->response->setStatusCode($json->getStatus());
                }
                $this->response->setContent(json_encode($json));
                $this->response->type("application/json");
                return;
            }
            $this->handleError("An Error Occured");
        }

        if ($forwardingAddress = $relay[0]::getForwardingAddress($relay[1])) {
            $this->forward($forwardingAddress);
        }

        if ($this->lastError) {
            $this->response->setStatusCode(400);
            $this->response->setContent($error);
        } elseif ($output) {
            if (is_object($output) && $output instanceof JsonResponse) {
                if ($status = $output->getStatus()) {
                    $this->response->setStatusCode($status);
                }

                $this->response->setContent(
                    json_encode($output)
                );
                $this->response->type("application/json");
                return;
            }

            if (is_int($output)) {
                $this->response->setStatusCode($output);
            } else {
                $this->response->setContent($output);
            }
        }
    }

    /**
     * @param string $error
     */
    public function handleError(string $error)
    {
        if ($error && $this->request->isPost()) {
            Session::setMessage($error, "form_error");
        }

        $this->lastError = $error;
    }

    /**
     * @param string $forwardingAddress
     */
    public function forward(string $forwardingAddress)
    {
        if (!$this->lastError) {
            $this->response->redirect($forwardingAddress);
        } else {
            $this->response->redirectToReferrer();
        }
    }

    /**
     * @return bool
     */
    public function isAuthorized(): bool
    {
        return $this->authed;
    }

    public function beforeAction(): void
    {
        if (config("monitoring.newrelic.enabled") && extension_loaded('newrelic')) {
            newrelic_add_custom_parameter('query_string', $_SERVER['REQUEST_URI']);
        }

        parent::beforeAction();

        $this->removeComponent('Auth');

        $relay = $this->getRequestedRelay();
        if ($relay) {

            $security = $relay[0]::getSecurity();
            $methods = $security["methods"];
            if (in_array($relay[1], array_keys($methods))) {
                $method = $methods[$relay[1]];
                $type = $method["type"] ?? false;
                if (!$type) {
                    throw new \Exception("relay missing request type property");
                }
                if (!$this->request->isMethod($type)) {
                    return;
                }


                if ($method["type"] === "PATCH") {
                    //Custom validate csfr token, as param if content type is json
                }

                $this->Security->config("validateForm", false);
                $this->Security->config("validateCsrfToken", false);

                if ($method["type"] === "POST") {
                    $fields = $security["fields"] ?? [];
                    $this->Security->requirePost(["index"]);
                    if ($fields) {
                        $this->Security->config(
                            "form",
                            ['fields' => array_keys($fields)]
                        );
                    }
                }
            }
            $this->authed = true;
            return;
        }
    }
}
