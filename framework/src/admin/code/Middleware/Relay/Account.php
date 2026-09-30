<?php

namespace Admin\Middleware\Relay;

use Admin\Middleware\Relay;
use Core\Data\Shape;
use Core\Data\Collection;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Exception\RestException;
use DateTime;

const LAST_DAYS = 30;
const FEATURE_BOQ_ID = 3;
const FEATURE_AI_ID = 4;

class Account
{

    /**
     * @param string $serviceId
     * @param Shape $config
     * @param string $field
     * @return Callable
     * @throws \Exception
     */
    public static function updateAccount(string $serviceId, Shape $config, string $field = "status"): callable
    {
        $service  = Manager::getService($serviceId);
        $resource = strval($config->get("resource", ""));
        $method   = strval($config->get("method", "fetch"));

        return function ($shape) use ($service, $resource, $method, $field) {
            if (method_exists($service, $method)) {
                $aid = $shape->get("uriArgs.aid");
                $data = $shape->getRoute()->getRequest()->getData();
                $json = $data->getShape("json");
                $data = [$field => $json->get($field)];

                try {
                    $service->update("$resource/$aid", new Shape(['data' => $data]));
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
     * @param string $serviceId
     * @param Shape $config
     * @return callable
     * @throws \Exception
     */
    public static function createContractor(string $serviceId, Shape $config): callable
    {
        $service = Manager::getService($serviceId);
        $resource = strval($config->get("resource", ""));
        $method = strval($config->get("method", "write"));

        return function ($shape) use ($service, $resource, $method) {
            if (method_exists($service, $method)) {

                $form = $shape->get("validated_form");

                $res = $service->write($resource, new Shape([
                    'data' => [
                        'name'       => $form->get("company_name"),
                        'email'      => $form->get("company_email"),
                        'type_id'    => $shape->get("type_id.account"),
                        'reg_number' => $form->get("registered_company_number"),
                        'landline'   => $form->get("company_landline"),
                        'mobile'     => $form->get("telephone"),
                        'address'    => $form->get("company_address"),
                        'website'    => $form->get("company_website")
                    ]
                ]));

                $content = $res->get("content");
                $json    = is_string($content) ? json_decode($content, true) : [];

                if (is_array($json)) {
                    $aid = $json['data']['id'] ?? null;

                    //Create user
                    $service->write("user", new Shape([
                        'data' => [
                            'account_id'      => $aid,
                            'firstname'       => $form->get("first_name"),
                            'lastname'        => $form->get("last_name"),
                            'display_name'    => $form->get("first_name") . " " . $form->get("last_name"),
                            'email'           => $form->get("email"),
                            'job_title'       => $form->get("job_title"),
                            'contact_number'  => $form->get("telephone"),
                            'password'        => $form->get("password"),
                            'type_id'         => $shape->get("type_id.user"),
                        ]
                    ]));

                    //Update membership
                    $service->update("account/$aid/membership", new Shape([
                        'data' => [
                            'subscription_id' => $form->get("subscription_id")
                        ]
                    ]));

                    //auto add the featue flag for digital boq
                    $res = Manager::getService('account')->update("feature/accounts", new Shape([
                        'data' => [$aid],
                        'options' => [
                            CURLOPT_CUSTOMREQUEST => "PATCH"
                        ]
                    ]));
                    $json = $res->json("content");
                    $data = $json['data'] ?? [];
                    if($data) {
                        $feature = array_shift($data);
                        if($feature) {
                            Manager::getService('account')->update(sprintf("feature/%s/account_mapping/%s", FEATURE_BOQ_ID, $feature), new Shape([
                                'options' => [
                                    CURLOPT_CUSTOMREQUEST => "PATCH"
                                ]
                            ]));

                            // Also map AI feature for the new account
                            Manager::getService('account')->update(sprintf("feature/%s/account_mapping/%s", FEATURE_AI_ID, $feature), new Shape([
                                'options' => [
                                    CURLOPT_CUSTOMREQUEST => "PATCH"
                                ]
                            ]));
                        }
                    }

                    return;
                }

                throw new MiddlewareException("failedCreateAccount");
            }
        };
    }

    /**
     * @return Callable
     */
    public static function flatten(): callable
    {
        return Relay::flattenData(function (array $account): array {
            $data = [];
            $data[] = [
                "id"                => (int) $account["id"],
                "name"              => $account["name"],
                "type_id"           => (int) $account["type_id"],
                "subscription_id"   => $account["subscription_id"],
                "subscription"      => $account["subscription"],
                "first_pqq_sent"    => (bool) $account["first_pqq_sent"],
                "status"            => (int) $account["status"],
                "created_at"        => $account["created_at"]
            ];

            return $data;
        });
    }

    /**
     * @param string $key
     * @return callable
     */
    public static function getProjectsByAccounts(string $key = "collection"): callable
    {
        return function ($a) use ($key) {
            $collection = $a->get($key);
            if ($collection) {
                $aids = $collection->values('id');
                $projects = Manager::getService('project')->fetch("project", ['group_ids' => implode(",", $aids)])->getCollection('data');
                $result = [];
                $usedAccounts = [];
                if ($projects->count()) {
                    $pids = implode(',', $projects->values('id'));
                    $categories = Manager::getService('document')->fetch('category?pids=[' . $pids . ']&entity_type=tender_template')->getCollection('data');
                    $transactions = Manager::getService('project')->fetch('project/customer_health_score/[' . $pids . "]")->getCollection('data');
                    $tenders = Manager::getService('project')->fetch('tender/[' . $pids . "]")->getCollection('data');
                    $today = new DateTime();
                    foreach ($projects->getItems() as $project) {
                        // Check if we already have some data for this account (group_id)
                        if (!isset($result[$project->get('group_id')])) {
                            $result[$project->get('group_id')] = [];
                            $usedAccounts[] = intval($project->get('group_id'));
                        }

                        // Init values with true if they were filled previously
                        $tenderTemplateCompleted = false;
                        $orderIssued = false;
                        $hasBudget = false;
                        $nProjects = 0;
                        if (isset($result[$project->get('group_id')])) {
                            $preventValues = $result[$project->get('group_id')];
                            $tenderTemplateCompleted = $preventValues['tender'];
                            $orderIssued = $preventValues['issued'];
                            $hasBudget = $preventValues['budget'];
                            $nProjects = $preventValues['projects'];
                        }

                        // Checking if exists tender templates completed
                        if (!$tenderTemplateCompleted) {
                            $filteredCategories = $categories->filter(function ($category) use ($project) {
                                return intval($category->get('parent_id')) === intval($project->get('id')) && $category->getCollection("documents")->count();
                            })->map(function ($category) {
                                return $category->get('documents');
                            })->getItemsAsArray();
                            $filteredCategoriesJoined = [];
                            foreach ($filteredCategories as $category) {
                                foreach ($category as $document) {
                                    $filteredCategoriesJoined[] = $document;
                                }
                            }
                            $documents = new Collection($filteredCategoriesJoined, Shape::class);
                            $tenderTemplateCompleted = (bool) $documents->filter(function ($document) use ($today) {
                                $publishedDocument = 1;
                                $createdAt = new DateTime($document->get("created_at"));
                                return intval($document->get('status')) === $publishedDocument
                                    && $today->diff($createdAt)->days < LAST_DAYS;
                            })->count();
                        }

                        if (!$orderIssued) {
                            $orderIssued = (bool) $transactions->filter(function ($transaction) use ($project, $today) {
                                if (!$transaction->get("order_created")) {
                                    return false;
                                }
                                $createdAt = new DateTime($transaction->get("order_created"));
                                return $transaction->get('tender')
                                    && intval($transaction->getShape('tender')->get('project_id')) === intval($project->get('id'))
                                    && $today->diff($createdAt)->days < LAST_DAYS;
                            })->count();
                        }

                        if (!$hasBudget) {
                            $hasBudget = (bool) $tenders->filter(function ($tender) use ($project, $today) {
                                if (!$tender->get('budget')) {
                                    return false;
                                }
                                $updatedAt = new DateTime($tender->get("budget_updated_at"));
                                return intval($tender->get("project_id")) === intval($project->get('id'))
                                    && $today->diff($updatedAt)->days < LAST_DAYS;
                            })->count();
                        }

                        $account = $collection->filter(function ($item) use ($project) {
                            return intval($item->get('id')) === intval($project->get('group_id'));
                        })->first();

                        if (!$account->get("id", 0)) {
                            continue;
                        }

                        $nProjects = $projects->filter(function ($p) use ($project, $today) {
                            $createdAt = new DateTime($p->get("created_at"));
                            $projectsCreatedLast30Days = $today->diff($createdAt)->days < LAST_DAYS;
                            return $p->get('group_id') === $project->get('group_id') && $projectsCreatedLast30Days;
                        })->count();

                        $result[$project->get('group_id')] = [
                            'id' => $account ? $account->get('id') : 0,
                            'account' => $account ? $account->get('name') : '',
                            'users' => $account ? $account->getCollection('users')->count() : 0,
                            'projects' => $nProjects,
                            'tender' => $tenderTemplateCompleted,
                            'issued' => $orderIssued,
                            'budget' => $hasBudget
                        ];
                    }

                    foreach (array_diff($aids, $usedAccounts) as $aid) {
                        $account = $collection->filter(function ($item) use ($aid) {
                            return intval($item->get('id')) === intval($aid);
                        })->first();

                        $result[$aid] = [
                            'id' => $account ? $account->get('id') : 0,
                            'account' => $account ? $account->get('name') : '',
                            'users' => $account ? $account->getCollection('users')->count() : 0,
                            'projects' => 0,
                            'tender' => false,
                            'issued' => false,
                            'budget' => false
                        ];
                    }
                }
                $a->set('collection', $result);
            } else {
                $a->set('collection', []);
            }
        };
    }


    /**
     * @param string $key
     * @return Callable
     */
    public static function getActiveUsersLastMonth(string $key = "collection"): callable
    {
        return function ($a) use ($key) {
            $collection = $a->get($key);
            $aids = implode(',', array_keys($collection));
            if ($aids) {
                $engagement = Manager::getService('account')->fetch("account/[" . $aids . "]/engagements")->getCollection('data');
                $today = new DateTime();
                $collection = $a->getCollection($key);
                $collection->map(function ($item, $key) use ($engagement, $today) {
                    $filteredEngagements = $engagement->filter(function ($e) use ($key) {
                        return intval($e->get('account_id')) === intval($key);
                    });
                    $monthlyUsers = [];
                    foreach ($filteredEngagements->getItems() as $filteredEngagement) {
                        $createdAt = new DateTime($filteredEngagement->get("created_at"));
                        if ($today->diff($createdAt)->days < LAST_DAYS) {
                            $monthlyUsers[$filteredEngagement->get('user_id')] = 0;
                        }
                    }
                    $item->set('monthly_users', count($monthlyUsers));
                    return $item;
                });

                $a->set($key, $collection);
            } else {
                $a->set($key, null);
            }
        };
    }
}
