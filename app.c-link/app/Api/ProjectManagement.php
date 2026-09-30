<?php

namespace App\Api;

use App\Api\Document as DocumentApi;
use App\Api\Document\Category;
use App\Api\Document\Validator as DocValidator;
use App\Api\Tender\Order;
use App\core\Request;
use App\controllers\DocumentCreatorController;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;
use App\Utility\Upload;
use App\Api\V2\SupplyChain;

class ProjectManagement extends Client
{

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "project";

    const MAX_DEFAULT_LIMIT = 100;

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "listInstruction" => [
                "type" => 'GET',
                "requires_session" => true,
                "required_args" => [
                    "pid" => "int",
                ]
            ],
            "listNcr" => [
                "type" => 'GET',
                "requires_session" => true,
                "required_args" => [
                    "pid" => "int",
                ]
            ],
            "listForecast" => [
                "type" => 'GET',
                "requires_session" => true,
                "required_args" => [
                    "pid" => "int",
                ]
            ],
            "getInstruction" => [
                "type" => 'GET',
                "requires_session" => true,
                "required_args" => [
                    "id" => "int",
                ]
            ],
            "createInstruction" => [
                "type" => 'POST',
                "requires_session" => true,
            ],
            "updateInstruction" => [
                "type" => 'PATCH',
                "requires_session" => true,
                "required_args" => [
                    "id" => "int",
                ]
            ],
            "deleteInstruction" => [
                "type" => 'DELETE',
                "requires_session" => true,
                "required_args" => [
                    "id" => "int",
                ]
            ],
            "getType" => [
                "type" => 'GET',
                "requires_session" => true,
            ],
            "getStatus" => [
                "type" => 'GET',
                "requires_session" => true,
            ],
            "addInstructionDocuments" => [
                "type" => 'POST',
                "requires_session" => true,
                "required_args" => [
                    "id" => "int",
                ],
                "pre_checks" => [
                    [DocValidator::class, "uploadedMultipleDocuments"],
                ],
            ],
            "getSubcontractors" => [
                "type" => 'GET',
                "requires_session" => true,
                "required_args" => [
                    "pid" => "int",
                ],
            ],
        ]
    ];

    /**
     * @var array
     */
    protected static $cache = [];

    /**
     * @return array|array[]
     */
    public static function getSecurity()
    {
        return self::$security;
    }

    /**
     * @return JsonResponse
     */
    public static function getType(): jsonResponse
    {
        if (!isset(self::$cache['type'])) {
            try {
                self::$cache['type'] = self::get("instruction/type");
            } catch (\Exception $e) {
                return self::jsonResponse(["error" => $e->getMessage()], 500);
            }
        }
        return self::jsonResponse(self::$cache['type'], 200);
    }

    /**
     * @return JsonResponse
     */
    public static function getStatus(): jsonResponse
    {
        if (!isset(self::$cache['status'])) {
            try {
                self::$cache['status'] = self::get("instruction/status");
            } catch (\Exception $e) {
                return self::jsonResponse(["error" => $e->getMessage()], 500);
            }
        }
        return self::jsonResponse(self::$cache['status'], 200);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function deleteInstruction(Request $request, User $user, array $args): jsonResponse
    {
        $id = (int)$args['id'];
        try {
            $res = self::delete("instruction/$id");
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }
        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function getInstruction(Request $request, User $user, array $args): jsonResponse
    {
        try {
            $instruction = self::get("instruction/" . (int)$args['id']);
            $pid = $instruction["pid"];
            $instructions = [$instruction];
            self::buildInstructions($instructions, $pid);
            return self::jsonResponse(array_shift($instructions), 200);
        } catch (\Exception $e) {
            return self::jsonResponse([], 200);
        }
    }

    /**
     * @param array $orders
     * @param array $instructions
     */
    public static function getInstructionFromIssuedOrders(array $orders, array &$instructions)
    {
        foreach ($orders as $order) {
            if (!isset($instructions[$order['tender']['id']])) {
                $instructions[$order['tender']['id']] = [
                    'tid'        => $order['tender']['id'],
                    'package'    => $order['tender']['label'],
                    'order'      => $order['order_price'],
                    'variations' => 0,
                    'omissions'  => 0,
                    'budget'     => 0,
                    'total'      => $order['order_price'],
                ];
            } else {
                $original_order = $instructions[$order['tender']['id']]['order'];
                $instructions[$order['tender']['id']]['order'] = $order['order_price'];
                $instructions[$order['tender']['id']]['total'] += $order['order_price'] - $original_order;
                $instructions[$order['tender']['id']]['issue_order'] = true;
            }
        }
    }

    /**
     * @param array $orders
     * @param array $instructions
     */
    public static function getInstructionFromDraftOrders(array $orders, array &$instructions)
    {
        foreach ($orders as $order) {
            if (!empty($order['documents'])) {
                $time = 0;
                foreach ($order['documents'] as $document) {
                    if ($document['status'] !== Order::PUBLISHED_DOC_STATUS) {
                        continue;
                    }
                    $meta = json_decode($document['meta'] ?? '', true);
                    if ($tid = $meta['quote']['tender_id'] ?? null) {
                        if (!isset($instructions[$tid])) {
                            $order_price = $meta['values']['order_value'] ?? $meta['quote']['price'];
                            $created_at = strtotime($document['created_at']);
                            if ($created_at > $time) {
                                $instructions[$meta['quote']['tender']['label']] = [
                                    'tid'        => $tid,
                                    'package'    => $meta['quote']['tender']['label'],
                                    'order'      => $order_price,
                                    'variations' => 0,
                                    'omissions'  => 0,
                                    'budget'     => 0,
                                    'total'      => $order_price
                                ];
                                $time = $created_at;
                            }
                        } else {
                            if (!isset($instructions[$tid]['issue_order'])) {
                                $order_price = $meta['values']['order_value'] ?? $meta['quote']['price'];
                                $original_price = $instructions[$tid]['order'];
                                $instructions[$tid]['order'] = $order_price;
                                $instructions[$tid]['total'] += $order_price - $original_price;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * @param int $pid
     * @param string $type
     * @return array
     */
    public static function getInstructionByType(int $pid, string $type = ""): array
    {
        try {
            $instructions = [];
            if (empty($type)) {
                $instructions = self::get("project/$pid/instruction");
            } else {
                $types = array_filter(self::getType()->getData(), function ($item) use ($type) {
                    return ($item['uid'] == $type);
                });
                $type_last = end($types);
                $instructions = self::get("project/$pid/instruction?type_id=" . $type_last['id']);
            }
            self::buildInstructions($instructions, $pid);
        } catch (\Exception $e) {
            return [];
        }

        return $instructions ?? [];
    }

    /**
     * @param array $instructions
     * @param int $pid
     * @return array
     */
    public static function buildInstructions(array &$instructions, int $pid)
    {
        $types = self::getType()->getData();
        $statuses = self::getStatus()->getData();
        $subcontractors = self::getSubcontractorsByProjectId($pid)->getData();
        $documents = Document::get("instruction/$pid");
        $nr = 1;
        $instructions = array_map(function ($i) use (&$nr, $types, $statuses, $subcontractors, $documents) {
            $type = array_filter($types, function ($t) use ($i) {
                return (int)$t['id'] === (int)$i['type_id'];
            });
            $i['type'] = array_shift($type);
            unset($i['type_id']);

            $status = array_filter($statuses, function ($s) use ($i) {
                return (int)$s['id'] === (int)$i['status'];
            });
            $i['status'] = array_shift($status);
            $subcontractor = array_filter($subcontractors, function ($s) use ($i) {
                return isset($s['id']) && (int)$s['id'] === (int)$i['subcontractor_id'];
            });

            $i['subcontractor'] = array_shift($subcontractor);
            unset($i['subcontractor_id']);

            $tender = array_filter($i['subcontractor']['packages'] ?? [], function ($t) use ($i) {
                return (int)$t['id'] === (int)$i['tid'];
            });
            $i['tender'] = array_shift($tender);
            unset($i['tid']);
            unset($i['tender_label']);

            $i['documents'] = [];
            if (isset($documents['documents'])) {
                $docs = array_filter($documents['documents'], function ($d) use ($i) {
                    return ((int)$d['instruction_id'] === (int)$i['id']);
                });
                $i['documents'] = array_values($docs);
            }

            $i['nr'] = $nr;
            $nr++;

            return $i;
        }, $instructions);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function getSubcontractors(Request $request, User $user, array $args): jsonResponse
    {
        /*
         * Get the orders
        */
        $pid = (int)$args['pid'];
        return self::getSubcontractorsByProjectId($pid, $user->getAccountId());
    }

    /**
     * @param int $pid
     * @param int $aid
     * @return JsonResponse
     * @throws Exception
     */
    public static function getSubcontractorsByProjectId(int $pid, int $aid = 0)
    {
        $transactions = self::get("project/" . $pid . "/transaction");
        $subcontractors = [];
        $sids = [];
        array_filter($transactions, function ($item) use (&$subcontractors, $pid, &$sids) {
            if (isset($item['tender'])) {
                if ($item['tender']['project_id'] == $pid) {
                    //external subcontractor and we will ignore them
                    if ((int) $item['subcontractor_id'] > 0) {
                        $sids[] = $item['subcontractor_id'];
                        $subcontractors[$item['subcontractor_id']]['packages'][$item['tender']['id']] = [
                            'id'    => $item['tender']['id'],
                            'label' => $item['tender']['label']
                        ];
                    }
                }
            }
            return $item;
        });

        /*
         * Get subcontractor data
         */
        $accounts = Account::getAccounts(array_unique($sids));
        $filter_external_subcontractors = false;
        $supply_chain_user_ids = [];
        //we only want to hide external subcontractors from the subcontractor list
        //but leave existing instructions that were sent to externals that were then removed from supply chain
        if ($aid) {
            $filter_external_subcontractors = true;
            $token = app()->Cookie->getCookie('token');
            $supply_chain = Api::get("account/supply-chain",[], ['Authorization' => "Bearer $token"]);
            array_filter($supply_chain, function ($item) use (&$supply_chain_user_ids) {
                foreach($item['users'] ?? [] as $user){
                    $supply_chain_user_ids[] = $user['id'];
                }
                return $item;
            });
        }

        foreach ($accounts as $account) {
            //if the user is external we need to make sure the contractor sill has it in his supply chain
            if ($filter_external_subcontractors) {
                if ((int)$account['type_id'] === Account::EXTERNAL_ACCOUNT_TYPE) {
                    if (!in_array($account['id'], $supply_chain_user_ids, false)) {
                        unset($subcontractors[$account['id']]);
                        continue;
                    }
                }
            }
            $subcontractors[$account['id']] += [
                'id' => $account['id'],
                'name' => $account['name'],
            ];
        }

        /*
         * Filter accounts that were coming from orders as "Non C-Link subcontractors"
         */
        $subcontractors = array_filter($subcontractors, function ($item) {
            if (isset($item['id'])) {
                return $item;
            }
        });

        return self::jsonResponse(array_values($subcontractors), 200);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function listInstruction(Request $request, User $user, array $args): jsonResponse
    {
        $pid = (int)$args['pid'];
        return self::jsonResponse(self::getInstructionByType($pid, 'instruction'), 200);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function listNcr(Request $request, User $user, array $args): jsonResponse
    {
        $pid = (int)$args['pid'];
        return self::jsonResponse(self::getInstructionByType($pid, 'ncr'), 200);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function listForecast(Request $request, User $user, array $args): jsonResponse
    {
        $pid = (int)$args['pid'];
        $instructions = self::getInstructionByType($pid);
        $results = [];
        $prices = [];
        foreach ($instructions as $i => $instruction) {

            $tid = $instruction["tender"]["id"];
            $orderValue = $instruction['order_value'];
            $variations = $instruction['type']['id'] === 1 ? $instruction['price'] : 0;
            $omissions = $instruction['type']['id'] === 2 ? $instruction['price'] : 0;
            $total = $variations - $omissions;
            $already = isset($results[$tid]['total']);
            $results[$tid] = [
                'tid' => $tid,
                'package' => $instruction["tender"]['label'],
                'order' => $orderValue,
                'variations' => $already ? $results[$tid]['variations'] + $variations : $variations,
                'omissions' => $already ? $results[$tid]['omissions'] + $omissions : $omissions,
                'budget' => $instruction['budget'],
                'total' => $already ? $results[$tid]['total'] + $total : $total,
            ];

            //add all variations
            $prices[$tid]['variations'][] = $variations;

            //add all ommissions
            $prices[$tid]['ommissions'][] = $omissions;

            //add the order value
            //override each time as we always want to use the latest order value
            $prices[$tid]['ordervalue'] = $orderValue;
        }

        //calculate final price
        foreach ($prices as $tid => $value) {
            $results[$tid]['total'] = $value['ordervalue'] + array_sum($value['variations']) - array_sum($value['ommissions']);
        }

        try {
            $issue_orders = self::get(sprintf('transaction?project_id=%s', $pid), ["type_id" => Transactions::TRANSACTION_QUOTE_ID]);
        } catch (\Exception $e) {
            $issue_orders = [];
        }
        if ($issue_orders) {
            self::getInstructionFromIssuedOrders($issue_orders, $results);
        }

        try {
            $draft_orders = Category::get("category", ["parent_id" => $pid, "entity_type" => Order::ENTITY_TYPE]);
        } catch (\Exception $e) {
            $draft_orders = [];
        }
        if ($draft_orders) {
            self::getInstructionFromDraftOrders($draft_orders, $results);
        }

        return self::jsonResponse(array_values($results), 200);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     */
    public static function createInstruction(Request $request, User $user, array $args): JsonResponse
    {
        $data = $request->getRequiredJson();
        $tid = (int)$data['tid'];
        $pid = (int)$data['pid'];
        $sid = (int)$data['sid'];
        $type = (int)$data['type'];

        try {
            /*
            * Get the order transaction id
            */
            $transactions = self::get("transaction", ["tender_id" => $tid, "subcontractor_id" => $sid]);
            $instruction = ['type_id' => $type];
            $instruction['transaction_id'] = null;
            array_filter($transactions, function ($item) use (&$instruction, $pid) {
                if (isset($item['tender'])) {
                    if ($item['tender']['project_id'] == $pid) {
                        $instruction['transaction_id'] = $item['id'];
                    }
                }
                return $item;
            });

            /*
            * Create the instruction
            */
            $instruction['date'] = date('Y-m-d H:i:s');
            $res = self::post("instruction", $instruction);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        $instruction_id = $res->iDResponse();
        return self::jsonResponse(["success" => !is_null($instruction_id), 'id' => $instruction_id]);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws Exception
     */
    public static function addInstructionDocuments(Request $request, User $user, array $args): JsonResponse
    {
        $instruction_id = (int)$args['id'];
        $instruction = self::get("instruction/$instruction_id");

        $transaction = self::get("transaction/" . $instruction['transaction_id']);
        $transaction = array_shift($transaction);
        $tid = $transaction['tender']['id'];
        $pid = $transaction['tender']['project_id'];

        /*
        * Create instruction category
        * We need to check if the category for the instruction was already created
        * There will be only 1 category created for a project id and a tender id
        * regardless of how many instructions will be created
        */
        $entity_type = 'instruction';
        $category = Category::get("category", ['entity_type' => $entity_type, 'entity_id' => $tid, 'parent_id' => $pid]);
        if (!$category) {
            $res = Category::post("category", [
                'entity_id'   => $tid,
                'entity_type' => $entity_type,
                'parent_id'   => $pid,
                'label'       => $transaction['tender']['label'] . ' - Instruction'
            ]);
            $category_id = $res->iDResponse();
        } else {
            $category = array_shift($category);
            $category_id = $category['id'];
        }

        /*
        * Add documents to the instruction
        */
        $type_uid = 'structural';
        $subtype_uid = 'instruction';
        $type = DocumentApi::getDocumentType($type_uid);
        $subtype = DocumentApi::getSubType($subtype_uid)->getId();
        $bucket = Document::getConfig()["s3_bucket"];
        $results = ['success' => [], 'error' => 0];
        foreach ($args['documents'] as $document) {
            $file = new Upload($document);
            $res = Document::post('document', [
                'owner_id'  => $user->getAccountId(),
                'subtype'   => $subtype,
                'type'      => $type,
                'category'  => $category_id,
                'meta'      => ['instruction_id' => $instruction_id],
                'name'      => $document['name'],
                's3_bucket' => 'asset',
                'file'      => $file
            ]);
            $did = $res->iDResponse();
            $upload = Document::upload($file, $did, $bucket, [$type_uid]);
            if ($did && $upload) {
                $url = parse_url($upload["ObjectURL"]);
                Document::patch("document/$did", ["s3_key" => ltrim($url["path"], "/")]);
                $results['success'][] = ['id' => (int)$did, 'name' => $document['name']];
            } else {
                $results['error'] = $results['error'] + 1;
            }
        }

        return self::jsonResponse($results);
    }


    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     * @throws \Exception
     */
    public static function updateInstruction(Request $request, User $user, array $args): JsonResponse
    {
        $data = $request->getRequiredJson();
        $id = (int)$args['id'];
        $type = isset($data['type']) ? (int)$data['type'] : 0;
        $status = isset($data['status']) ? (int)$data['status'] : 0;
        if ($type) {
            unset($data['type']);
        }
        try {
            $res = self::patch("instruction/$id", $data);
            if ($res && $status === 1) {
                $idTypeInstruction = 1;
                $docController = new DocumentCreatorController();
                $docController->beforeAction();
                $label = $type === $idTypeInstruction ? 'Instruction' : 'NCR';
                $template = $type === $idTypeInstruction ? 'instruction_template' : 'ncr_template';
                $docController->send_instruction($id, $template, $label);
            }
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }
        return self::jsonResponse(["success" => ($res->getStatus() === 203)]);
    }
}
