<?php

namespace App\controllers;

use App\Api\Aws\Sns;
use App\core\Config;
use App\core\Controller;
use App\Api\Account;
use App\Api\Document;
use App\Api\Transactions;
use App\DocCreator\Signatory\Signatory;
use App\Models\UserModel;
use App\Models\Permission;
use App\Factory\UserFactory;
use App\Api\Account as AccountApi;
use App\Api\Project as ProjectApi;
use App\Models\Signatory as SignatoryModel;

use App\controllers\DownloadController;
use App\DocCreator\Signatory\Service\Docusign;

class SignatoryController extends Controller
{
    const TENDER_HISTORY_SIGNED = 13;
    const TENDER_HISTORY_REJECTED_ORDER = 14;
    const TENDER_HISTORY_AWARDED_ID = 7;
    const DEFAULT_SIGNATORY_SERVICE = 'docusign';
    const TYPE_CONTRACTOR_REQUEST = "Contractor";
    const TYPE_SUBCONTRACTOR_REQUEST = "Subcontractor";

    /**
     * @var string
     */
    protected $user_path = 'signatory';

    /**
     * @var UserModel
     * Keep a container for logged in user object
     */
    protected $user;

    /**
     * @var string[]
     */
    protected $methods = ["request", "redirect", "sign", "resend"];

    /**
     * @return \App\core\Response|void
     */
    public function startupProcess()
    {
        return parent::startupProcess();
    }

    public function beforeAction(): void
    {
        parent::beforeAction();
        $this->removeComponent('Auth');
    }

    public function index() {}

    /**
     * @return bool
     */
    public function isAuthorized(): bool
    {
        $action = $this->request->param('action');
        $resource = 'c-link';
        $config = array();

        Permission::allow('administrator', $resource, ['*']);
        Permission::allow('main-contractor', $resource, $this->methods);

        return Permission::check(user_role(), $resource, $action, $config);
    }

    /**
     * @param $id
     * @throws \Exception
     */
    public function sign($id): void
    {
        try {
            $transaction  = Transactions::get("transaction/$id");
            $transaction  = array_shift($transaction);
            $meta         = json_decode($transaction['meta'] ?? '', true);
            $template_id  = $meta['order_template_id'];

            $token = query_data('token') ?? request_data('token');
            if ($token) {
                $response = Account::get('token/verify/' . $token, ['label' => 'session']);
                $recipient_id = $response['user_id'];
            } else {
                $recipient_id = UserFactory::getUser()->getId();
            }

            //Check if the current logged in main contractor need to sign the document
            $signers = Document::get(sprintf("document/%s/signers", $template_id));
            $signers = array_shift($signers);

            $statuses = Document::get("signatory/status?uid=signed");
            $signed_statuses = array_map(
                function ($item) {
                    return $item['uid'] === 'signed';
                },
                $statuses
            );
            $signers_data = SignatoryModel::getSigners($signers, $signed_statuses, $recipient_id);
            $has_to_sign  = (bool)$signers_data['can_sign'];
            //Create the signatory request token which will create the docusign signatory url and redirect the user to it
            if ($has_to_sign) {
                $account   = AccountApi::getAccount(AccountApi::getAccountIdByUser($recipient_id));
                $userModel = new UserModel([], $recipient_id);

                if (AccountApi::isTypeOf($account['type_id'], AccountApi::getSpecialistTypes())) {
                    $subcontractor = $account['id'];
                    $type = self::TYPE_SUBCONTRACTOR_REQUEST;
                } else {
                    $contractor = $account['id'];
                    $type = self::TYPE_CONTRACTOR_REQUEST;
                }

                $request   = $userModel->createTokenByLabel($recipient_id, 'signatory_request', [
                    'envelope_id'    => Document::get("document/$template_id/signatory")['signatory_id'],
                    'recipient_id'   => $recipient_id,
                    'project_id'     => $transaction['tender']['project_id'],
                    'tender_id'      => $transaction['tender']['id'],
                    'contractor'     => $contractor    ?? 0,
                    'subcontractor'  => $subcontractor ?? $transaction['subcontractor_id'] ?? 0,
                    'type'           => $type,
                    'sign_shortcode' => sprintf("%s%s", Config::get("signatory.docusign.prefix"), $recipient_id),
                ]);
                $json = $request->json()["data"] ?? [];
                redirect(sprintf("%s/signatory/request/%s", Config::get("url.site"), $json['token']));
            }
        } catch (\Exception $e) {
            $message = "Signatory sign request transaction id: $id \n";
            $message .= 'Environment: ' . Config::get("environment") . "\n";
            $message .= $e->getMessage();
            Sns::send("failed_signatory", $message);
        }

        error_log("Signatory sign request: The contractor is not in the signers list");
        exit("Application Error");
    }

    /**
     * @param string $token
     * @throws \Exception
     */
    public function request(string $token): void
    {
        if (!$token) {
            //@TODO
            //token missing error
            Sns::send("failed_signatory", "No signatory token provided");
        }

        //Generate signatory view url
        try {
            $response = Account::get('token/verify/' . $token, ['label' => 'signatory_request']);
            $user     = $response['user'];

            // The user is a contractor
            $meta     = json_decode($response['meta'], true);
            if (isset($meta['envelope_id'], $meta['sign_shortcode'])) {
                $envelope_id = $meta['envelope_id'];
                $userModel   = new UserModel($user, $user['id']);
                $request     = $userModel->createTokenByLabel($user['id'], 'signatory_event', ['envelope_id' => $envelope_id]);
                $json        = $request->json()["data"] ?? [];
                $signatory   = new Signatory();
                $stored_signatory = $this->getStoredSignatorySnapshot((string)$envelope_id, (int)$user['id']);

                if ($stored_signatory) {
                    $this->applyStoredSignatorySnapshot($userModel, $stored_signatory);
                }
                // Fallback for older documents that do not have a signatory snapshot stored in meta.
                elseif (isset($meta['contractor'])) {
                    $userModel->setSupplyChainDataFromMainContractor($meta['contractor']);
                }

                if ($signatory->isValidService(self::DEFAULT_SIGNATORY_SERVICE)) {
                    $signatory->setService(self::DEFAULT_SIGNATORY_SERVICE);
                    $client = $signatory->getService();
                    if ($client instanceof Docusign) {
                        $client->addSigner($userModel->setData("signatory", $meta['sign_shortcode']));
                        $return_url = sprintf("%s/signatory/redirect/%s", Config::get("url.site"), $json['token'] . "?pid=" . $meta['project_id'] . "&tid=" . $meta['tender_id'] . "&contractor=" . $meta['contractor'] . "&subcontractor=" . $meta['subcontractor']);
                        echo "<script>window.location.href='" . $client->getSignerLink($envelope_id, $return_url) . "';</script>";
                    }
                    exit;
                }
            }
        } catch (\Exception $e) {
            $message = "Signatory user token: $token \n";
            $message .= $e->getMessage();
            Sns::send("failed_signatory", $message);
            error_log($message);
            exit();
            //@TODO
            //Redirect user to error page?
        }
    }

    /**
     * @param string $envelopeId
     * @param int $userId
     * @return array
     * @throws \App\Api\Exception
     */
    private function getStoredSignatorySnapshot(string $envelopeId, int $userId): array
    {
        $signatory_document = Document::get("document/envelope/$envelopeId");
        $document_id = (int)($signatory_document['document_id'] ?? 0);
        if (!$document_id) {
            return [];
        }

        $document = Document::get("document/$document_id");
        $meta = $document['meta'] ?? [];
        if (is_string($meta)) {
            $meta = json_decode($meta, true);
        }
        return $meta['signatory_snapshot'][$userId] ?? [];
    }

    /**
     * @param UserModel $userModel
     * @param array $snapshot
     * @return void
     */
    private function applyStoredSignatorySnapshot(UserModel $userModel, array $snapshot): void
    {
        if (!empty($snapshot['email'])) {
            $userModel->setData('email', $snapshot['email']);
        }
        if (!empty($snapshot['full_name'])) {
            $userModel->setData('signatory_full_name', $snapshot['full_name']);
        }
    }

    /**
     * @param string $token
     * @throws \App\Api\Exception
     */
    public function redirect(string $token): void
    {
        if (!$token) {
            Sns::send("failed_signatory", "No signatory token provided");
            error_log("Signatory sign redirect: No signatory token provided");
            exit("Application Error");
        }

        try {
            $response = Account::get('token/verify/' . $token, ['label' => 'signatory_event']);
        } catch (\Throwable $th) {
            error_log("Signatory sign redirect: Token not found");
            exit("Application Error");
        }

        $event = query_data('event') ?? request_data('event');
        $pid = query_data('pid') ?? request_data('pid');
        $tid = query_data('tid') ?? request_data('tid');
        $contractor = query_data('contractor') ?? request_data('contractor');
        $subcontractor = query_data('subcontractor') ?? request_data('subcontractor');

        $project = ProjectApi::getProject($pid);
        if (!$contractor) {
            $contractor = $project['group_id'];
        }

        $uid = $response["user_id"];
        $user = $response["user"];
        $account = AccountApi::getAccount(AccountApi::getAccountIdByUser($response["user_id"]));
        $type    = (AccountApi::isTypeOf($account['type_id'], AccountApi::getSpecialistTypes())) ? self::TYPE_SUBCONTRACTOR_REQUEST : self::TYPE_CONTRACTOR_REQUEST;
        $userModel = new UserModel($user, $uid);
        $request = $userModel->createTokenByLabel($uid, 'auto_loader');
        $json = $request->json()["data"] ?? [];

        $user_types = AccountApi::get('user/type');
        $user_witness_type_id = 0;
        array_map(function ($type) use (&$user_witness_type_id) {
            if ($type['label'] === AccountApi::WITNESS_USER_TYPE) {
                $user_witness_type_id = $type['id'];
            }
        }, $user_types);
        $is_witness = ($user['type_id'] === $user_witness_type_id);

        if ($type === self::TYPE_SUBCONTRACTOR_REQUEST) {
            $data["token_url"] = Config::get("url.app_prosper") . "" . $json["token"];
            $redirectPage = sprintf(
                "%s/account/auto_loader/%s/redirect=/projects/enquiries",
                config('url.app_prosper'),
                $json['token']
            );
            if ($is_witness) {
                $redirectPage = config('url.prosper');
            }
        } else {
            $redirectPage = sprintf(
                "%s/auto_loader?token=%s&redirect=project/%s/orders",
                config("url.site"),
                $json['token'],
                $project['slug']
            );
            if ($is_witness) {
                $redirectPage = config('url.c-link');
            }
        }

        if ($event) {
            $meta     = json_decode($response['meta'], true);
            //sign successfully
            if ($event === 'signing_complete') {
                try {
                    $status   = Document::get("signatory/status", ['uid' => 'signed']);
                    $status_id = array_shift($status)['id'];
                    Document::patch(sprintf("signatory/%s/signer", $meta['envelope_id']), [
                        'user_id'   => $response['user_id'],
                        'status_id' => $status_id
                    ]);

                    $signers = Document::get("signatory?id=" . $meta['envelope_id']);
                    $signed = true;
                    $nr = 0;
                    $sign_data = [
                        'total_signatory_users' => count($signers['signer']),
                        'user_id'               => $response['user_id'],
                        'signatory_order'       => SignatoryModel::getSignatoryOrder()
                    ];

                    $signer_orders = SignatoryModel::getSignerOrdersFromStoredSigners($signers['signer'] ?? []);

                    if (!$subcontractor) {
                        foreach ($signers['signer'] ?? [] as $item) {
                            $user = AccountApi::get("user/" . $item['signer_user_id'] . "/profile");
                            $account = AccountApi::getAccount($user['account_id']);
                            if (AccountApi::isTypeOf($account['type_id'], AccountApi::getSpecialistTypes())) {
                                $subcontractor = $account['id'];
                                break;
                            }
                        }
                    }

                    $subcontractor_data = AccountApi::getAccount($subcontractor);
                    $signatory_orders = [];
                    array_map(function ($item) use ($status_id, &$signed, &$nr, &$signatory_orders, $sign_data, $subcontractor_data, $contractor, $signer_orders) {
                        if ($status_id !== $item['signer_status_id']) {
                            $signed = false;
                        }

                        $user = AccountApi::get("user/" . $item['signer_user_id'] . "/profile");
                        $userModel = new UserModel($user, $item['signer_user_id']);
                        $userModel->setSupplyChainDataFromMainContractor($contractor);
                        $account = AccountApi::getAccount($user['account_id']);
                        $signatory_order = $signer_orders[$item['signer_user_id']] ?? $nr;
                        if (($status_id !== $item['signer_status_id']) && $sign_data['user_id'] !== $item['signer_user_id']) {
                            $signatory_orders[$signatory_order] = [
                                'user_id'       => $userModel->getId(),
                                'email'         => $userModel->getData("email"),
                                'display_name'  => $userModel->getData("display_name"),
                                'company_name'  => $subcontractor_data['name'],
                                'type_id'       => $account['type_id']
                            ];
                        }
                        $nr++;
                    }, $signers['signer'] ?? []);
                    //send email to the next person that needs to sign the document
                    if ($signatory_orders) {
                        ksort($signatory_orders);
                        SignatoryModel::sendSignQueueEmail($meta['envelope_id'], [
                            'signatory_users' => $signatory_orders,
                            'pid' => $pid,
                            'tid' => $tid,
                            'meta' => $meta,
                            'contractor_id' => $contractor,
                            'subcontractor_id' => $subcontractor,
                        ]);
                    }

                    if ($signed) {
                        self::addTenderHistory($pid, $tid, $contractor, $subcontractor, self::TENDER_HISTORY_SIGNED);
                    }
                } catch (\Exception $e) {
                    $message = $e->getMessage();
                    Sns::send("failed_signatory", $message);
                }
            } elseif ($event === 'viewing_complete') {
                //the user opens again the signing link but signed already
                //@TODO
                //Sign in complete show message
            } elseif ($event === 'session_timeout') {
                //session timeout
                //@TODO
                //Session Expired show message
            } elseif ($event === 'ttl_expired') {
                //@TODO
                //Url expired show message
            } elseif ($event === 'decline') {
                $status   = Document::get("signatory/status", ['uid' => 'declined']);
                Document::patch(sprintf("signatory/%s/signer", $meta['envelope_id']), [
                    'user_id'   => $response['user_id'],
                    'status_id' => array_shift($status)['id']
                ]);
                self::addTenderHistory($pid, $tid, $contractor, $subcontractor, self::TENDER_HISTORY_REJECTED_ORDER);
            } elseif ($event === 'cancel') {
                //@TODO
                // Complete later
            }

            redirect($redirectPage);
        }
    }

    /**
     * @param int $id
     * @throws \App\Api\Exception
     */
    public function resend(int $id)
    {
        $transaction = Transactions::get("transaction/$id");
        $transaction = array_shift($transaction);
        $meta        = json_decode($transaction['meta'] ?? '', true);
        $template_id = (int)$meta['order_template_id'];

        try {
            $document = Document::load($template_id);
            if ($document->isOwner(UserFactory::getUser())) {
                $status             = Document::get("signatory/status", ['uid' => 'signed']);
                $status_id          = array_shift($status)['id'];
                $signatory_document = Document::get("document/$template_id/signatory");
                $signers            = Document::get("signatory", ['id' => $signatory_document['signatory_id']]);
                $nr = 0;
                $main_contractor_id = UserFactory::getUser()->getAccountId();
                $signer_orders = SignatoryModel::getSignerOrdersFromStoredSigners($signers['signer'] ?? []);
                $signatory_orders = [];
                array_map(function ($item) use ($status_id, &$nr, &$signatory_orders, $signer_orders, $main_contractor_id) {
                    $user            = AccountApi::get(sprintf("user/%s/profile", $item['signer_user_id']));
                    $account         = AccountApi::getAccount($user['account_id']);
                    $signatory_order = $signer_orders[$item['signer_user_id']] ?? $nr;
                    if ($status_id !== $item['signer_status_id']) {
                        $userModel = new UserModel($user, $item['signer_user_id']);
                        $userModel->setSupplyChainDataFromMainContractor($main_contractor_id);
                        $signatory_orders[$signatory_order] = [
                            'user_id'      => $userModel->getId(),
                            'email'        => $userModel->getData("email"),
                            'display_name' => $userModel->getData("display_name"),
                            'type_id'      => $account['type_id']
                        ];
                    }
                    $nr++;
                },  $signers['signer'] ?? []);

                if ($signatory_orders) {
                    ksort($signatory_orders);
                    SignatoryModel::sendSignQueueEmail($signatory_document['signatory_id'], [
                        'signatory_users'   => $signatory_orders,
                        'pid'               => $transaction['tender']['project_id'],
                        'tid'               => $transaction['tender']['id'],
                        'meta'              => ['envelope_id' => $signatory_document['signatory_id']],
                        'contractor_id'     => UserFactory::getUser()->getAccountId(),
                        'subcontractor_id'  => null,
                        'template'          => SignatoryModel::TEMPLATE_REMINDER,
                        'sender_user_id'    => (int)UserFactory::getUser()->getId(),
                    ]);
                }
            }
        } catch (\Exception $e) {
            $message = "Transaction id: $id \n";
            $message .= $e->getMessage();
            Sns::send("failed_signatory", $message);
            error_log($message);
            exit("Application Error");
        }
    }

    public static function addTenderHistory($pid, $tid, $contractor, $subcontractor, $status): void
    {
        $newTenderHistory = [
            "author_id" => $contractor,
            "specialist_id" => $subcontractor,
            "status_id" => $status,
            "tender_history_type" => "Order",
            "meta" => [] //TODO: Check data we want to add in meta
        ];
        Transactions::post("project/{$pid}/tender/{$tid}/history", $newTenderHistory);
    }

    /**
     * @param int $id
     * @return string[]|void
     */
    public function download(int $id)
    {
        try {

            $allow       = false;
            $transaction = Transactions::get("transaction/$id");
            $transaction = array_shift($transaction);
            $meta        = json_decode($transaction['meta'] ?? '', true);
            $template_id = (int)$meta['order_template_id'];
            $token       = query_data('token') ?? request_data('token');

            //check if the subcontractor can access the order
            if ($token) {
                $response = Account::get('token/verify/' . $token, ['label' => 'session']);
                $allow = ((int)$transaction['subcontractor_id'] === (int)($response['user']['account_id'] ?? 0));
            } else {
                //check if the contractor can access the order
                if (UserFactory::getUser()) {
                    $document = Document::load($template_id);
                    $allow = $document->isOwner(UserFactory::getUser());
                }
            }
            if ($allow) {
                $signatory_document = Document::get("document/$template_id/signatory");
                //download from signatory
                if ($signatory_document) {
                    $signatory = new Signatory();
                    $signatory_service = self::DEFAULT_SIGNATORY_SERVICE;
                    if ($signatory->isValidService($signatory_service)) {
                        $signatory->setService($signatory_service);
                        $service = $signatory->getService();
                        if ($service instanceof Docusign) {
                            $service->preview(
                                $signatory_document['signatory_id'],
                                (string)($meta['document']['name'] ?? '')
                            );
                        }
                        return;
                    }
                } else {
                    //download the document from document id
                    if (isset($meta['document']['id'])) {
                        $downloadController = new DownloadAllController();
                        $downloadController->download((int)$meta['document']['id']);
                        return;
                    }
                }
            }
        } catch (\Exception $e) {
            error_log($e->getMessage());
            exit("Application Error");
        }

        $this->notFound();
    }

    public function notFound()
    {
        header("HTTP/1.1 404 Not Found");
        exit();
    }
}
