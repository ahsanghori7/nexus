<?php

namespace App\Api;

use App\Api\Client\Response\JsonResponse;
use App\core\Request;
use App\DocCreator\Signatory\Signatory;
use App\Models\DownloadAccess;
use App\Models\Transaction;
use App\Models\User;
use App\Utility\Url;
use CURLFile;
use App\Models\Order as OrderModel;

class Transactions extends Project
{
    const TRANSACTION_QUOTE_KEY = 'Quote';

    const TRANSACTION_QUOTE_ID = 1;

    const TRANSACTION_ORDER_ID = 2;

    const TRANSACTION_STATUS_SENT = 1;

    const TRANSACTION_STATUS_WITHDRAWN = 2;

    const TRANSACTION_STATUS_SUPERSEDED = 3;

    const TRANSACTION_STATUS_SIGNED_MANUALLY = 4;

    const TENDER_STATE = 1;

    const DEFAULT_SIGNATORY_SERVICE = 'docusign';

    const QUOTE_DUE_MILESTONE_LABEL = 'Quote Due';

    /* TODO: Remove if we decide to drop draft orders work */
    const TOGGLE_DRAFT_WORK = false;
    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "project";

    /**
     * @var array
     */
    protected static $forward_address = [];

    /**
     * @var array
     */
    protected static array $typeCache = [];

    /**
     * @var array
     */
    protected static array $historyCache = [];

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "getQuotes" => [
                "type" => "GET",
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int"
                ]
            ],
            "getQuotesFiles" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "getQuoteDocuments" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "getPrequalDocument" => [
              "type" => "GET",
              "requires_session" => true
            ],
            "addQuote" => [
                "type" => "POST",
                "requires_session" => true
            ],
            "updateQuote" => [
                "type" => "PATCH",
                "requires_session" => true
            ],
            "deleteQuote" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "getSummary" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "award" => [
                "type" => "POST",
                "requires_session" => true
            ],
            "withdrawAward" => [
                "type" => "POST",
                "requires_session" => true
            ],
            "issueOrder" => [
                "type" => "POST",
                "requires_session" => true,
                "required_args" => [
                    "id" => "int",
                    "tid" => "int",
                    "qid" => "int",
                    "sid" => "string"
                ]
            ],
            "toggledSelected" => [
                "type" => "POST",
                "requires_session" => true
            ],
            "toggledCompliant" => [
                "type" => "POST",
                "requires_session" => true
            ],
            "getItemsPerTender" => [
                "type" => "GET",
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int",
                    "tid" => "int",
                    "type" => "string"
                ]
            ],
            "editOrder" => [
              "type" => "GET",
              "requires_session" => true,
              "pre_checks" => [
                "validateProjectOwner"
              ],
              "required_args" => [
                "pid" => "int",
                "id" => "int",
              ]
            ],
            "downloadOrder" => [
              "type" => "GET",
              "requires_session" => true,
              "pre_checks" => [
                "validateProjectOwner"
              ],
              "required_args" => [
                "pid" => "int",
                "id" => "int",
              ]
            ],
            "withdrawOrder" => [
              "type" => "PATCH",
              "requires_session" => true,
              "pre_checks" => [
                "validateProjectOwner"
              ],
              "required_args" => self::TOGGLE_DRAFT_WORK ? [
                "pid" => "int",
                "id" => "int",
                "did" => "int"
              ] : [
                "pid" => "int",
                "id" => "int"
              ]
            ],
            "downloadTenderAnalysis" => [
                "type" => "GET",
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int",
                    "id" => "int",
                ]
            ],
            "markAsSigned" => [
                "type" => "PATCH",
                "requires_session" => true,
                "pre_checks" => [
                    "validateProjectOwner"
                ],
                "required_args" => [
                    "pid" => "int",
                    "id" => "int",
                ]
            ],
        ]
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
     * @return array|\array[][]
     */
    public static function getSecurity() {
        return self::$security;
    }

    /**
     * @param string $step
     * @param string $url
     */
    public static function setForwardingAddress($step, $url) {
        self::$forward_address[$step] = $url;
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Exception
     */
    public static function getSummary(Request $request)
    {
        $pid = (int) $request->getQueryValue("pid");
        try {
            $project = self::getProject($pid);
        }
        catch(\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        $result = self::get(sprintf('project/%s/tender/transaction/summary', $pid));

        if(!$result) {
            return self::jsonResponse(["error" => "bad_request"]);
        }

        return self::jsonResponse($result);
    }

    /**
     * @param array $data
     * @param array|string[] $keys
     * @return array
     */
    public static function covertToPennyValue(array $data, array $keys=["price", "order_value", "measured_work", "prelims", "other_items"]) : array {

        foreach ($keys as $key) {
            if(isset($data[$key])) {
                $v = str_replace("£", "", (string) $data[$key]);
                $decimal = strpos($v, ".");
                if($decimal === false) {
                    $v .= "00";
                }
                elseif((strlen($v) - $decimal) !== 3) {
                    list($pre, $suf) = explode(".", $v);
                    $suf = (strlen($suf) < 2) ? str_pad($suf, 2, "0") : substr($suf, 0, 2);
                    $v = $pre . $suf;
                }
                $data[$key] = (int) str_replace(".", "", $v);
            }
        }
        return $data;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function addQuote(Request $request, User $user)
    {
        $pid = $request->getQueryValue("pid");
        $tid = $request->getQueryValue("tid");

        $data = $request->getData();
        $data['pid'] = $pid;
        $data['tid'] = $tid;
        $data['type_id'] = self::TRANSACTION_QUOTE_ID;
        $data['source'] = 'C-Link Upload';
        $data['uploaded_by_user_id'] = $user->getId();

        try {
            $data = self::covertToPennyValue($data);
            self::ownsProject($user, $pid);
            $res = self::post("tender/$tid/transaction", $data);

            if(!$res->getStatus() === 203) {
                throw new \Exception("Api Failure");
            }

            ProcurementScheduleOverview::milestoneInProgress($tid, self::QUOTE_DUE_MILESTONE_LABEL);
            ProcurementScheduleOverview::milestoneComplete($tid, self::QUOTE_DUE_MILESTONE_LABEL);

            $qid = $res->json()['data']['id'];
            foreach ($_FILES as $key => $file) {
                unset($data[$key]);
            }

            foreach ($_FILES as $file) {
                if ($qid !== null) {
                    $data["qid"] = $qid;
                }
                $data["file"] = new CURLFile($file['tmp_name'], $file['type'], $file['name']);
                self::post(
                    'tender/' . $tid . '/transaction/file',
                    $data,
                    ["Content-Type" => 'multipart/form-data']
                );
            }

            $transaction = self::get(sprintf("transaction/%s", $qid));

            if (!empty($transaction)) {
                $transaction = reset($transaction);

                $sid = $transaction['subcontractor_id'];
                $qid = $transaction['id'] ?: null;

                $transactionFile = S3::getTransactionQuoteFile($pid, $tid, $sid, $qid);

                $transaction['has_boq_quotes'] = count($transaction['quote'] ?? []) > 0;
                $transaction['zip'] = $transactionFile;

                /*
                * Get Quote subcontractor by the account id or the meta value if the account id is -1
                * -1 is an id for legacy_acount account types
                */

                if($transaction['subcontractor_id'] != -1){
                    $subcontractor = Account::getAccount($transaction['subcontractor_id']);

                    $transaction['subcontractor']['id'] = $subcontractor['id'];
                    $transaction['subcontractor']['name'] = $subcontractor['name'] ?? null;
                }else{
                    $subcontractor = json_decode($transaction['meta'], true);

                    $transaction['subcontractor']['id'] = $transaction['subcontractor_id'];
                    $transaction['subcontractor']['name'] = $subcontractor['subcontractor_name'] ?? null;
                }

                return self::jsonResponse($transaction);
            }

            return self::jsonResponse((array) $res->json());
        }
        catch(\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()]);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     */
    public static function updateQuote(Request $request, User $user) {
        $pid = $request->getQueryValue("pid");
        $tid = $request->getQueryValue("tid");

        try {
            self::ownsProject($user, $pid);
            $data = self::covertToPennyValue($request->getRequiredJson());
            $res = self::patch("project/" . $pid . '/tender/transaction/' . $tid,
                $data
            );

            if(!$res->getStatus() === 203){
                throw new \Exception("Api Failure");
            }
        }
        catch(\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()]);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function deleteQuote(Request $request, User $user) : jsonResponse {
        $pid = $request->getQueryValue("pid");
        $tid = $request->getQueryValue("tid");
        try {
            self::ownsProject($user, $pid);
            $res = self::delete("project/" . $pid . '/tender/transaction/' . $tid);
            if(!$res->getStatus() === 203){
                throw new \Exception("Api Failure");
            }
            return self::jsonResponse(["success" => true]);
        }
        catch(\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()]);
        }
    }


    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function getQuotesFiles(Request $request, User $user) {
        $pid = $request->getQueryValue("pid");

        $links = [];
        try {
            self::ownsProject($user, $pid);
            $response = self::get(sprintf('project/%s/tender/transaction/files', $pid));

            if(!$response) {
                return self::jsonResponse(["error" => "bad_request"], 400);
            }

          foreach ($response as $tid => $files){
            foreach ($files as $qid => $file){
              if ($qid === "sid") {
                continue;
              }
              $file = explode("/",(string)$file);
              $file = str_replace(".zip","",end($file));
              $file_path = null;
              if($file) {
                $file_path = sprintf(
                    "%s/quote/%s/%s/%s/%s",
                    config('document.download.url'),
                    $pid,
                    $tid,
                    $qid,
                    $file
                );
              }

              $links[$tid][$qid] = $file_path;
            }
          }

          //BOQ QUOTES
          $boqDocs = self::get(sprintf('boq/%s/quote_documents', $pid));
          if ($boqDocs) {
              foreach ($boqDocs as $tid => $transactions) {
                  foreach ($transactions as $qid => $eid) {
                      // A quote can have both a zip upload and boq documents; the
                      // zip download link from the first pass must keep winning.
                      if (empty($links[$tid][$qid])) {
                          $links[$tid][$qid] = sprintf("%s/boq/%s", config('document.download.url'), $eid);
                      }
                  }
              }
          }

          return self::jsonResponse($links);
        }
        catch(\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    /**
     * Per-file quote document metadata keyed by tender id and transaction id.
     *
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function getQuoteDocuments(Request $request, User $user) {
        $pid = $request->getQueryValue("pid");

        try {
            self::ownsProject($user, $pid);
            $documents = self::get(sprintf('project/%s/transaction/documents', $pid));

            return self::jsonResponse($documents ?: []);
        }
        catch(\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    /**
     * @param int $pid
     * @param string $type
     * @return array
     * @throws Exception
     */
    public static function projectAwardedTenders(int $pid, string $type = 'Enquiry'): array
    {
        return self::get("project/" . $pid . "/tender/history",
            ["tender_history_type" => $type, "status_id" => self::TENDER_AWARDED_STATUS]
        );
    }

    /**
     * Get All quotes or orders for a tender
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function getItemsPerTender(Request $request, User $user, array $args) : jsonResponse {
        $items = [];
        list("pid" => $pid, "tid" => $tid, "type" => $type) = $args;

       $data = self::get("project/$pid/tender/$tid/transaction", [
            "type_id" => ($type === "quote") ? self::TRANSACTION_QUOTE_ID : self::TRANSACTION_ORDER_ID
       ]);

       if($data) {
           $transactions = $data[0]["transaction"] ?? [];
           $sids = array_map(function($item) { return $item["subcontractor_id"]; }, $transactions);
           $accounts = ($sids) ? Account::getAccounts($sids) : [];
           foreach($transactions as $transaction) {
               $items[$transaction["id"]] = $transaction;
               $items[$transaction["id"]]["subcontractor"] = $accounts[$transaction["subcontractor_id"]] ?? [];
           }
       }
        return self::jsonResponse($items);
    }

    /**
     * @param int $num
     * @return string
     */
    public static function pennyToFloat(int $num)
    {
        $numStr = str_replace('.', '', strval($num));
        $testOnlyNumber = str_replace('-', '', $numStr);
        if (strlen($testOnlyNumber) < 3) {
            return $numStr;
        }

        $formattedNum = substr($numStr, 0, strval($numStr) - 2) . substr($numStr, strval($numStr) - 2);

        return intval($formattedNum) / 100;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws Exception
     */
    public static function getQuotes(Request $request, User $user, array $args) {
        $pid = $args["pid"];
        try {
            return self::jsonResponse(self::getQuotesList($pid));
        }
        catch(\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    /**
     * @param int $pid
     * @return array
     * @throws Exception
     */
    public static function getQuotesList(int $pid) : array {
        $result = self::get(
            sprintf('project/%s/tender/transaction', $pid), [
                "type_id" => self::TRANSACTION_QUOTE_ID
            ]
        );

        $data = $result[$pid] ?? [];

        if(!$data) {
            return $data;
        }

        $response = [
            "name" => $data['name'],
            'gross_internal_value' => $data['gia'],
            "summary" => $data["summary"],
            "tenders" => [],
            "subcontractors" => []
        ];

        /*
         * Don't try to get the account for an external user that is not in our database
         */
        unset($data['sids'][-1]);

        $sids = array_keys($data['sids']);
        $accounts = ($sids) ? Account::getAccounts($sids) : [];
        $packages = [];
        $default_logo = Account::getProsperDefaultLogo();
        $awardedTenders = self::get("project/{$pid}/awarded-tenders",
            ["tender_history_type" => "Enquiry", "status_id" => self::TENDER_AWARDED_STATUS]
        );

        $recommendations = self::get("project/$pid/tender_recommendation/recommendation_status", []);
        $recommendationMap = [];
        if (!empty($recommendations) && is_array($recommendations)) {
            foreach ($recommendations as $rec) {
                if (isset($rec['transaction_id'])) {
                    $recommendationMap[$rec['transaction_id']] = strtolower($rec['status'] ?? '');
                }
            }
        }
        foreach($data['tender'] as $tid => $tender) {

            if(Tender::isState($tender['state'], Tender::SUGGESTED_STATE_LABEL)){
              continue;
            }

            $packages[$tid] = [
                "id" => $tid,
                "label"   => $tender["label"],
                "awarded" => $tender["awarded"],
                "is_custom" => $tender['is_custom'],
                "budget" => $tender['budget'],
                "has_boq" => false,
                "actual_value" => 0
            ];

            /**
             * If the awarded is for older tenders we dont know to whom the tender was awarded
             */
            if($tender["awarded"]){
                $packages[$tid]['awarded_to'] = [
                    'name' => 'Non C-Link Subcontractor',
                    'id' => null
                ];
            }

            /*
             * Adding the default quotes key as not all tenders have transactions
             */
            $packages[$tid]["quotes"] = [];
            if(isset($tender[self::TRANSACTION_QUOTE_KEY]['transactions'])){
                $selectedPrice = null;
                $lowestPrice   = null;

                foreach($tender[self::TRANSACTION_QUOTE_KEY]['transactions'] as $sid => $transaction){
                    if (isset($awardedTenders[$tid])) {
                        $packages[$tid]['awarded_to'] = [
                            'name' => $awardedTenders[$tid]['name'],
                            'id'   => $awardedTenders[$tid]['id'] ?? $sid
                        ];
                    }

                    foreach($transaction['transaction'] as $value){

                        $meta = json_decode($value['meta'] ?? "", true);

                        $packages[$tid]["quotes"][$value['id']] = $value;
                        $account = $accounts[$sid] ?? [];

                        if (!isset($response["subcontractors"][$sid])) {
                            if($account){
                                $response["subcontractors"][$sid] = [
                                    'id' => $sid,
                                    'name'   => $account["name"],
                                    'email' => $account['email'],
                                    'logo'   => $account["logo"],
                                    'type_id' => (int)$account['type_id']
                                ];
                            } else {
                                $response["subcontractors"][$sid] = [
                                    'id' => $sid,
                                    'name'   => $meta['subcontractor_name'] ?? '',
                                    'email' => null,
                                    'logo'   => $default_logo,
                                    'type_id' => null
                                ];
                            }
                        }

                        /*
                         * Legacy subcontractors are typed manually onto a quote and have no account, so
                         * project_service groups their transactions under md5(subcontractor_name) while the
                         * quote row itself keeps subcontractor_id = -1. The root "subcontractors" map is keyed
                         * by that group key, so a consumer resolving a quote by its own subcontractor_id finds
                         * nothing. Embed the details on those quotes only - every subcontractor that does have
                         * an account still resolves through the map.
                         */
                        if ((string)$sid !== (string)($value['subcontractor_id'] ?? '')) {
                            $packages[$tid]["quotes"][$value['id']]['subcontractor'] = $response["subcontractors"][$sid];
                        }

                        $txId = $value['id'];
                        $status = $recommendationMap[$txId] ?? null;
                        $packages[$tid]["quotes"][$value['id']]['can_issue_order'] = ($status === 'approved');

                        $price = $value['price'] ?? 0;
                        if (!$tender["awarded"]) {

                            // if price_selected = 1 -> this takes priority
                            if (!empty($value['price_selected']) && $value['price_selected'] == 1) {
                                $selectedPrice = $price;
                            }

                            // track lowest price
                            if ($lowestPrice === null || $price < $lowestPrice) {
                                $lowestPrice = $price;
                            }
                        } else {
                            $transactionStatus = OrderModel::getDocumentStatus($value);
                            if (in_array($transactionStatus, ['Signed', 'Sent'])) {
                                $packages[$tid]['actual_value'] = $price;
                            }
                        }
                    }
                }

                // after loop -> set actual_value if not awarded
                if (!$tender["awarded"]) {
                    $packages[$tid]['actual_value'] = $selectedPrice ?? $lowestPrice ?? 0;
                }
            }
        }

        //QUOTE HAS BOQ
        $boqPresence = self::get("boq/{$pid}/quote_presence");
        if (!empty($boqPresence)) {
            foreach ($boqPresence as $tenderId => $hasBoq) {
                if (isset($packages[$tenderId])) {
                    $packages[$tenderId]['has_boq'] = (bool)$hasBoq;
                }
            }
        }

        $response["tenders"] = $packages;
        return $response;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function award(Request $request, User $user) {
        $qid = (int) $request->getQueryValue("id");
        $pid = (int) $request->getQueryValue("pid");
        $tid = (int) $request->getQueryValue("tid");

        try {
            $json = $request->getRequiredJson(["order_value", "order_date"]);
            $project = self::ownsProject($user, $pid);

            $pennyVal = self::covertToPennyValue($json, ["order_value"]);
            $order_created = (new \DateTime($json["order_date"]))->format('Y-m-d H:i:s');
            $order_price = $pennyVal["order_value"];

            $res = self::patch("project/$pid/tender/transaction/$qid", [
                "order_price"   =>  $order_price,
                "order_created" => $order_created,
                'order_updated' => date("Y-m-d H:i:s")
            ]);

            if(!$res->getStatus() === 203){
                throw new \Exception("Api Failure");
            }

            $res = self::patch("project/$pid/tender/$tid", [
                "awarded" => 1
            ]);

            /**
             * Get Transaction data
             */
            $transaction = self::get(sprintf('transaction?id=%s', $qid));
            if($transaction){
              $transaction = array_shift($transaction);

              /*
               * The package is settled, so the download links held by the
               * subcontractors who were not selected stop working here.
               */
              DownloadAccess::revokeForTender((int)$tid, (int)($transaction['subcontractor_id'] ?? 0));
              /*
               * Get Quote subcontractor by the account id or the meta value if the account id is -1
               * -1 is an id for legacy_acount account types
               */
              if($transaction['subcontractor_id'] != -1){
                $subcontractor = Account::getAccount($transaction['subcontractor_id']);
              }else{
                $subcontractor = json_decode($transaction['meta'], true);
                $subcontractor['name'] = $subcontractor['subcontractor_name'] ?? null;
              }
              /**
               * Send email to admin
               */

              /*
               * Formatting the order price
               */
              $order_price = substr_replace((string)$order_price, ".", -2, 0);
              $order_price = number_format($order_price,2);

              $email = admin_email();
              $email->subject(sprintf('Package Awarded: %s on %s', $transaction['tender']['label'], $project['name']));
              $email->to(config('email.clink.default.email'));
              $email->template('award-quote-manually', [
                'project_name' => $project['name'],
                'package_name' => $transaction['tender']['label'],
                'name' => $user->getFullName(),
                'subcontractor' => $subcontractor['name'],
                'price' => $order_price,
                'date' => (new \DateTime($json["order_date"]))->format('d-m-Y H:i:s'), //uk date format
              ]);
              $email->send();
            }

            self::addHistory($request, "Enquiry", "awarded", $user->getId());
            return self::addHistory($request, "Order", "awarded", $user->getId());
        }
        catch(\Exception $e) {
            return self::jsonResponse(["error" => "bad_request"]);
        }
    }
    public static function withdrawAward(Request $request, User $user) {
        $qid = (int) $request->getQueryValue("id");
        $pid = (int) $request->getQueryValue("pid");
        $tid = (int) $request->getQueryValue("tid");
        try {
            self::ownsProject($user, $pid);
            $res = self::patch("project/$pid/tender/transaction/$qid", [
                "order_price"   => 0
            ]);

            if(!$res->getStatus() === 203){
                throw new \Exception("Api Failure");
            }

            $res = self::patch("project/$pid/tender/$tid", [
                "awarded" => 0
            ]);

            // delete last history record of package awarded
            try {
                $tenderHistory = self::get(sprintf("project/%s/tender/%s/history", $pid, $tid));
            }catch(\Exception $e) {
                $tenderHistory = [];
            }
            if (!empty($tenderHistory)) {
                $tenderHistory = array_shift($tenderHistory);
                $history = $tenderHistory["history"];
                $lastHistory = array_shift($history);
                if (!empty($lastHistory)) {
                    self::delete(sprintf("project/tender/history/%s", $lastHistory['id']));
                }

                $secondLastHistory = array_shift($history);
                if (!empty($secondLastHistory)) {
                    self::delete(sprintf("project/tender/history/%s", $secondLastHistory['id']));
                }
            }
            return self::jsonResponse(["success" => true]);
        }
        catch(\Exception $e) {
            return self::jsonResponse(["error" => "bad_request"]);
        }
    }

    /**
     * @param int $pid
     * @param int $tid
     * @return array|mixed
     * @throws Exception
     */
    public static function getTenderQuotes(int $pid, int $tid) {
        $result = self::get("project/$pid/tender/transaction", [
            "type_id" => self::TRANSACTION_QUOTE_ID
        ]);

        $tender =  $result[$pid]['tender'][$tid] ?? [];
        return $tender['Quote']['transactions'] ?? [];
    }

    /**
     * @param int $qid
     * @param int $sid
     * @param array $transactions
     * @return mixed
     * @throws \Exception
     */
    public static function getContractorTransaction(int $qid, string $sid, array $transactions) {
        if(!isset($transactions[$sid])) {
            throw new \Exception("Not Quote for sub id: $sid");
        }

        $item = false;
        foreach($transactions[$sid] as $transactionList){
            foreach($transactionList as $transaction) {
                if((int)$transaction['id'] === $qid){
                    $item = $transaction;
                    break;
                }
            }
        }

        if(!$item) {
            throw new \Exception("No Transaction found for id $qid");
        }
        return $item;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws \Exception
     */
    public static function issueOrder(Request $request, User $user, array $args)
    {
        list("id" => $pid, "tid" => $tid) = $args;
        try {
            self::ownsProject($user, $pid);
            $data = $request->getRequiredJson();
            $data["transaction"] = self::getContractorTransaction(
                $args["qid"], $args["sid"], self::getTenderQuotes($pid, $tid)
            );

            $res = Legacy::createOrderTemplate($pid, $tid, $user->getAccountId(), $data);
            $json = $res->json();
            $url = $json['data']['url'] ?? null;
        }
        catch(\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        return self::jsonResponse(($url) ? ['url' => $url] : ["error" => "failed legacy request"]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param string $key
     * @return JsonResponse
     */
    public static function toggleQuote(Request $request, User $user, string $key) {

        try {
            $qid = (int) $request->getQueryValue("id");
            $pid = (int) $request->getQueryValue("pid");
            $data = $request->getRequiredJson();
            self::ownsProject($user, $pid);
            $toggle = $data["toggle"] ?? null;
            if(is_null($toggle)) {
                throw new \Exception("Missing toggle key $key");
            }

            $res = self::patch("project/$pid/tender/transaction/$qid", [
                $key => (int) $toggle
            ]);

            if(!$res->getStatus() === 203){
                throw new \Exception("Api Failure");
            }

            return self::jsonResponse(["success" => true]);
        }
        catch(\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()]);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return mixed
     */
    public static function toggledSelected(Request $request, User $user) {
        return self::toggleQuote($request, $user, "price_selected");
    }

    /**
     * @param Request $request
     * @param User $user
     * @return mixed
     */
    public static function toggledCompliant(Request $request, User $user) {
        return self::toggleQuote($request, $user, "compliant");
    }

  /**
   * @param Request $request
   * @param User $user
   * @return JsonResponse
   */
    public static function getPrequalDocument(Request $request,User $user)
    {
      $uid = (int) $request->getQueryValue("uid");
      $res = Legacy::download_prequalification($uid);

      if($res){
        $res = json_decode($res, true);
        if(isset($res['prequal_file'])){
          return self::jsonResponse(["url" => $res['prequal_file']]);
        }
      }
      return self::jsonResponse(["url" => null]);
    }

  /**
   * @param Request $request
   * @param User $user
   * @param array $args
   * @return JsonResponse
   * @throws Exception
   */
    public static function editOrder(Request $request, User $user, array $args) : JsonResponse
    {
      list("id" => $id) = $args;

      try {
          $res = self::get("transaction/$id");
      }
      catch(\Exception $e) {
          self::throwJsonException("Failed to get transaction", 404, $e);
      }

      $transaction = new Transaction($res[0], $id);
      $orderDoc = $transaction->getMeta("order_template_id");
      if($orderDoc) {
          $url = Url::getSiteUrl(
              "document-creator/template/$orderDoc/order/" . $transaction->getData("tender_id")
          );
      }

      return self::jsonResponse(['url' => $url ?? null]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws Exception
     */
    public static function downloadOrder(Request $request, User $user, array $args)
    {
      list("pid" => $pid, "id" => $id) = $args;
      try{
        $transaction = self::get("transaction/$id");
        if($transaction){

          $transaction = array_shift($transaction);

          $meta = json_decode($transaction['meta'] ?? '', true);
          if(isset($meta['document']['url'])){
              $url = $meta['document']['url'];
          }else {
            //legacy orders
            return self::jsonResponse(["error" => "Order archived", "status" => 'archived']);
          }
        }
      }
      catch(\Exception $e){
        return self::jsonResponse(["error" => $e->getMessage()]);
      }

      return self::jsonResponse(['url' => $url ?? null]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @throws \Exception
     */
    public static function downloadTenderAnalysis(Request $request, User $user, array $args): void
    {
        list("pid" => $pid, "id" => $file_id) = $args;

        $files = [
            1 => 'The Arlington - Dry-Lining Tender Analysis.xlsx',
            2 => 'The Arlington - Dry-Lining Tender Analysis.pdf',
        ];

        $file = $files[$file_id] ?? null;
        if($file) {
            try{
                $download = S3::download(S3::getBucket('docs'), S3::getKey($file, 'documents/tender-analysis'));
                if ($download){
                    header("Content-Type: ".$download['ContentType']);
                    header('Content-disposition: attachment;filename="'.$file.'"');
                    echo $download['Body'];
                    exit;
                }
            }catch (\Exception $e){
                header("HTTP/1.1 404 Not Found");
                exit();
            }
        }

        header("HTTP/1.1 404 Not Found");
        exit();
    }

  /**
   * @param Request $request
   * @param User $user
   * @param array $args
   * @return JsonResponse
   */
    public static function withdrawOrder(Request $request, User $user, array $args)
    {
      $pid = $args["pid"];
      $id = $args["id"];
      $project = $args["project"] ?? [];
      if (self::TOGGLE_DRAFT_WORK) {
        $did = $args["did"];
      }

      try{
        $transaction = self::get("transaction/$id");
        if($transaction){
          $transaction = array_shift($transaction);
          try {
            $approvals = OrderApprover::get(sprintf("order_approver/transaction/%s", $id));
          } catch (\Exception $e) {
            $approvals = [];
          }

          if (!empty($approvals)) {
            $tender = $transaction['tender'] ?? [];
            if (empty($tender)) {
              try {
                $tender = self::get("project/$pid/tender/" . $transaction['tender_id']);
              } catch (\Exception $e) {
                $tender = [];
              }
            }

            OrderApprover::delete(sprintf("order_approver/transaction/%s", $id));
            OrderApprover::post("order_approver/log", [
              'user_id' => $user->getId(),
              'transaction_id' => $id,
              'meta' => json_encode([
                'user_name' => $user->getFullName(),
                'description' => sprintf(
                  "%s withdrew approval for %s, %s",
                  $user->getFullName(),
                  $project['name'] ?? '',
                  $tender['label'] ?? ''
                )
              ]),
              'type' => 'Withdrawn'
            ]);
          }

          /*
           * Set the order price to 0 and the status to withdrew
           */
          $obj = self::TOGGLE_DRAFT_WORK ? [
            "order_price" => 0,
            "status_id"   => self::TRANSACTION_STATUS_WITHDRAWN,
            "meta"        => Transaction::setMetaDocumentStatus($transaction, $did, 'withdrew')
          ] : [
            "order_price" => 0,
            "status_id"   => self::TRANSACTION_STATUS_WITHDRAWN
          ];
          self::patch("project/$pid/tender/transaction/$id", $obj);

          /*
           * Set the tender award status to 0
           */
          self::patch("project/$pid/tender/".$transaction['tender_id'], [
            "awarded" => 0
          ]);

          /*
           * Clear any existing order approvals so the order can be re-submitted
           * for approval after withdrawal without stale approved/rejected rows
           * blocking a new approval cycle.
           */
          $existingApprovals = self::get("order_approver/transaction/$id");
          if (!empty($existingApprovals)) {
              self::delete("order_approver/transaction/$id");
          }

          /*
           * Void the signatory document on DOCUSIGN
           */
          $meta = json_decode($transaction['meta'] ?? '', true);
          $template_id = (int)$meta['order_template_id'];
          $signatory_document = Document::get("document/$template_id/signatory");
          if (isset($signatory_document['signatory_id'])) {
              $signatory = new Signatory();
              $signatory_service = self::DEFAULT_SIGNATORY_SERVICE;
              if ( $signatory->isValidService($signatory_service) ) {
                  $signatory->setService($signatory_service);
                  $signatory->getService()->void($signatory_document['signatory_id']);
              }
          }

        }
      }
      catch(\Exception $e){
        return self::jsonResponse(["error" => $e->getMessage()]);
      }

      return self::jsonResponse(['success' => true]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function markAsSigned(Request $request, User $user, array $args): JsonResponse
    {
        list("pid" => $pid, "id" => $id) = $args;
        try{
            $transaction = self::get("transaction/$id");
            if($transaction){
                $transaction = array_shift($transaction);
                self::patch("project/$pid/tender/transaction/$id", [
                    "status_id" => self::TRANSACTION_STATUS_SIGNED_MANUALLY
                ]);
            }
        }
        catch(\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()]);
        }
        return self::jsonResponse(['success' => true]);
    }
}
