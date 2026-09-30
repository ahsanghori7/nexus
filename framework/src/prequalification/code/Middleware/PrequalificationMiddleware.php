<?php

namespace Prequalification\Middleware;

use Core\Data\Shape;
use Core\Data\Collection as CollectionClass;
use Core\Middleware\Service\UserMiddleware;
use Core\Service\Manager;
use Core\Config;
use Prequalification\Model\PrequalificationModel;
use Prequalification\Middleware\S3Middleware;
use Prosper\Model\TeamManager;
use ZipArchive;

class PrequalificationMiddleware
{

    const DEFAULT_JOB_TITLE = 'CEO/Director';

    /**
     * @var array|string[]
     */
    public static array $current_symbols = [
        1 => '£',
        2 => '$',
        3 => '€'
    ];

    /**
     * @param string $aidKey
     * @return callable
     */
    public static function loadCollection(string $aidKey = 'uriArgs.aid'): callable
    {
        return function ($action) use ($aidKey) {
            $aid = (int)$action->get($aidKey);
            try {
                $data = Manager::getService('account')->fetch("prequalification/$aid")->getCollection('data');
            } catch (\Exception $e) {
                $data = [];
            }
            $action->setItems([
                "collection" => $data,
                "aid" => $aid
            ]);
        };
    }

    /**
     * @param int $region_id
     * @return mixed
     */
    public static function getCurrencySymbolByRegionId(int $region_id): mixed
    {
        return self::$current_symbols[$region_id];
    }

    /**
     * @return callable
     */
    public static function loadCompanyInformation(): callable
    {
        return function ($action) {
            $collection = $action->getCollection("collection");

            $account = Manager::getService('account')->fetch("account/" . $action->get("aid"))->getShape('data');

            $company_data = [
                'name'        => $account->get("name"),
                'reg_number'  => $account->get("reg_number"),
                'landline'    => $account->get("landline"),
                'strapline'   => $account->get("slogan"),
                'description' => $account->get("description"),
                'website'     => $account->get("website"),
                'region_group_id' => $account->int("region_group_id"),
                'region_symbol'   => self::getCurrencySymbolByRegionId($account->int("region_group_id"))
            ];

            if ($collection->count()) {
                $items = $collection->getItems();

                $action->set("prequalification", ['company_information' => $company_data + [
                    'num_current_employees'         => (int)$items['meta']->get("num_current_employees"),
                    'num_current_contractors'       => (int)$items['meta']->get("num_current_contractors"),
                    'trading_name'                  => $items['meta']->get("trading_name"),
                    'min_order_value'               => $items['meta']->get("min_order_value"),
                    'avg_order_value'               => $items['meta']->get("avg_order_value"),
                    'max_order_value'               => $items['meta']->get("max_order_value"),
                    'utr_number'                    => $items['meta']->get("utr_number"),
                    'vat_number'                    => $items['meta']->get("vat_number"),
                    'bank_name'                     => $items['meta']->get("bank_name"),
                    'address'                       => $items['meta']->get("address"),
                    'sort_code'                     => $items['meta']->get("sort_code"),
                    'account_number'                => $items['meta']->get("account_number"),
                    'collateral_warranties'         => $items['meta']->get("collateral_warranties"),
                    'performance_guarantee_bonds'   => $items['meta']->get("performance_guarantee_bonds"),
                ]], true);

                if (isset($items['statuses'])) {
                    $action->set("prequalification", ['statuses' => new CollectionClass($items['statuses']->get(),  Shape::class)], true);
                }
            }
        };
    }

    /**
     * @return callable
     */
    public static function updateStatuses(): callable
    {
        return function ($action) {
            $data = $action->getRoute()->getRequest()->getData();
            $aid = (int)$action->get("aid");
            $json = $data->getShape("json");

            Manager::getService('account')->update("prequalification/$aid/statuses", new Shape([
                'data' => ['status' => $json->get()],
                'options' => [
                    CURLOPT_CUSTOMREQUEST => "PATCH"
                ]
            ]));
        };
    }

    /**
     * @return callable
     */
    public static function updateTurnover(): callable
    {
        return function ($action) {
            $data = $action->getRoute()->getRequest()->getData();
            $sid = (int)$action->get("aid");
            $json = $data->getShape("json");
            Manager::getService('account')->update("prequalification/$sid/turnover", new Shape([
                'data' => $json->get()
            ]));
        };
    }

    /**
     * @return callable
     */
    public static function updateOrganisation(): callable
    {
        return function ($action) {
            $data = $action->getRoute()->getRequest()->getData();
            $sid = (int)$action->get("aid");
            $json = $data->getShape("json");
            Manager::getService('account')->update("prequalification/$sid/organisation", new Shape([
                'data' => $json->get()
            ]));
        };
    }

    /**
     * @param string $returnKey
     * @return callable
     */
    public static function updateReferences(string $returnKey = 'reference_id'): callable
    {
        return function ($action) use ($returnKey) {
            $data = $action->getRoute()->getRequest()->getData();
            $sid = (int)$action->get("aid");
            $form = $data->getShape("form");
            $res = Manager::getService('account')->update("prequalification/$sid/references", new Shape([
                'data' => $form->get()
            ]));
            if ($returnKey) {
                $content = $res->get("content");
                $json    = is_string($content) ? json_decode($content, true) : [];
                if (is_array($json)) {
                    $id = $json['data']['id'] ?? null;
                }
                $action->set($returnKey, $id ?? null);
            }
        };
    }

    /**
     * @param string $referenceKey
     * @param string $formDataKey
     * @return callable
     */
    public static function updateReference(string $referenceKey, string $formDataKey = ''): callable
    {
        return function ($action) use ($referenceKey, $formDataKey) {
            $sid  = (int)$action->get("aid");

            if ($formDataKey) {
                $form = $action->get($formDataKey);
            } else {
                $data = $action->getRoute()->getRequest()->getData();
                $form = $data->getShape($formDataKey)->get();
            }

            $id  = (int)$action->get($referenceKey);
            Manager::getService('account')->update("prequalification/$sid/reference/$id", new Shape([
                'data' => $form + ['updated_at' => date("Y-m-d H:i:s")]
            ]));
        };
    }

    /**
     * @return callable
     * Check for unique name as the company cannot change the name to an existing company
     */
    public static function checkUniqueCompanyName(): callable
    {
        return function ($action) {
            $data = $action->getRoute()->getRequest()->getData();
            $sid = (int)$action->get("aid");
            $json = $data->getShape("json");
            $name = $json->get("name");
            if ($name) {
                $account_exist = Manager::getService('account')->fetch("account", ['name' => $name])->getCollection('data');
                if ($account_exist->count()) {
                    $exist = $account_exist->filterByField("id", $sid, cast: "int");
                    if (!$exist->count()) {
                        throw new \Exception("Company Name is already used");
                    }
                }
            }
        };
    }

    /**
     * @return callable
     */
    public static function updateCompanyInformation(): callable
    {
        return function ($action) {
            $data = $action->getRoute()->getRequest()->getData();
            $sid = (int)$action->get("aid");
            $json = $data->getShape("json");

            Manager::getService('account')->update("account/$sid", new Shape([
                'data' => [
                    "name"       => $json->get("name"),
                    "reg_number" => $json->get("reg_number"),
                ]
            ]));

            Manager::getService('account')->update("prequalification/$sid/company_information", new Shape([
                'data' => $json->get()
            ]));
        };
    }

    /**
     * @return callable
     */
    public static function updateSectionData(): callable
    {
        return function ($action) {

            $section          = $action->get("uriArgs.section");
            $data             = $action->getRoute()->getRequest()->getData();
            $form_data        = $data->getShape("form");
            $files            = $data->getShape("files")->get();
            $file             = $data->getShape("files")->get('document');

            $did              = $form_data->get("id");
            $sid              = (int)$action->get("aid");
            $document_type    = $action->get("document_type")->filterByField("uid", 'account-documents')->getFirst();
            $document_subtype = $action->get("document_subtype")->filterByField("uid", $section)->getFirst();

            if (!$document_subtype) {
                throw new \Exception("Wrong section key name " . $section);
            }

            $formData = [
                'price'   => $form_data->get("price"),
                'date'    => $form_data->get("date"),
                'description' => $form_data->get("description"),
                'checked' => filter_var($form_data->get("checked"), FILTER_VALIDATE_BOOLEAN),
            ];
            $data = [
                "name"      => $form_data->get("label"),
                "type"      => (int)$document_type->get("id"),
                "subtype"   => (int)$document_subtype->get("id"),
                "owner_id"  => (int)$sid,
                "meta"      => $formData,
            ];

            if ($did) {
                if (is_null($file)) {
                    $res = Manager::getService('document')->fetch("document/$did")->getShape("data");
                    $meta = $res->get("meta");
                    $meta = json_decode($meta, true);
                    $data["meta"]["file"] = $meta["file"];
                } else {
                    $data["meta"]["file"] = $file['name'];
                }
                Manager::getService('document')->update("document/$did", new Shape([
                    'data' => $data
                ]));

                // Update meta data for children
                $res = Manager::getService('document')->fetch("document/$did/children")->getShape('data');
                $children = $res->get("children", []);
                foreach ($children as $child) {
                    $meta = $child["meta"];
                    $meta = json_decode($meta, true);
                    foreach ($formData as $key => $value) {
                        if (array_key_exists($key, $meta)) {
                            $meta[$key] = $value;
                        }
                    }
                    $idChild = $child["id"];
                    $data = [
                        "meta" => $meta,
                    ];

                    Manager::getService('document')->update("document/$idChild", new Shape([
                        'data' => $data
                    ]));
                }
            } else {
                $data["meta"]["file"] = $file['name'] ?? null;
                $res = Manager::getService('document')->write("document", new Shape(['data' => $data]));
                $content = $res->get("content");
                $json    = is_string($content) ? json_decode($content, true) : [];
                if (is_array($json)) {
                    $did = $json['data']['id'] ?? null;
                }
            }

            $action->set("did", $did);

            S3Middleware::uploadFile()($action);
            PrequalificationMiddleware::updateDocumentS3Key()($action);

            // delete files
            $deleted = json_decode($form_data->get("deleted", "{}"));
            foreach ($deleted as $fileToDelete) {
                $idCertificate = intval(str_replace("document-", "", $fileToDelete));
                Manager::getService('document')->delete("document/$idCertificate");
            }

            // upload extra files
            $extraFiles = array_filter($files, function ($name) {
                return $name !== "document";
            }, ARRAY_FILTER_USE_KEY);

            if (!empty($extraFiles)) {
                $data["parent_id"] = $did;
                $defaultCertificates = Manager::getService('document')->fetch("document/preq_default_certificates")->getCollection('data');
                $docs = $defaultCertificates->filterByField('uid', $section)->first()->get("documents");
                $extraDocs = array_filter($docs, function ($doc) {
                    return isset($doc['extra']);
                });
                foreach ($extraFiles as $inputName => $extraFile) {
                    $idCertificate = intval(str_replace("document-", "", $inputName));
                    $extra = array_filter($extraDocs, function ($doc) use ($idCertificate) {
                        return $doc['extra'] && array_filter($doc['extra'], function ($d) use ($idCertificate) {
                            return intval($idCertificate) === intval($d["id"]);
                        });
                    });
                    $extra = array_shift($extra);
                    if ($extra) {
                        // upload file
                        $extraDoc = array_filter($extra["extra"], function ($doc) use ($idCertificate) {
                            return intval($idCertificate) === intval($doc["id"]);
                        });
                        $extraDoc = array_shift($extraDoc);
                        $data["name"] = $extraDoc['name'] ?? null;
                        $data["type"] = (int)$document_type->get("id");
                        $data["subtype"] = (int)$document_subtype->get("id");
                        $data["owner_id"] = (int)$sid;
                        $data["meta"]["file"] = $extraFile['name'] ?? null;
                        $data["meta"]["certificate"] = $idCertificate;
                        $res = Manager::getService('document')->write("document", new Shape(['data' => $data]));
                        $content = $res->get("content");
                        $json    = is_string($content) ? json_decode($content, true) : [];
                        if (is_array($json)) {
                            $extra_did = $json['data']['id'] ?? null;
                        }
                        $action->set("did", $extra_did);
                    } else {
                        // replace an existing file with the new uploaded file
                        $data["meta"]["file"] = $extraFile['name'];
                        Manager::getService('document')->update("document/$idCertificate", new Shape(['data' => $data]));
                        $action->set("did", $idCertificate);
                    }
                    S3Middleware::uploadFile($inputName)($action);
                    PrequalificationMiddleware::updateDocumentS3Key($inputName)($action);
                }
                $action->set("did", $did);
            }
        };
    }

    /**
     * @return callable
     */
    public static function updateDocumentS3Key(string $file_key = 'document'): callable
    {
        return function ($action) use ($file_key) {
            $did = $action->get("did");
            Manager::getService('document')->update("document/$did", new Shape([
                'data' => $action->get($file_key)
            ]));
        };
    }

    /**
     * @return callable
     */
    public static function updateMainDocument(): callable
    {
        return function ($action) {
            $did = $action->get("did");
            Manager::getService('document')->update("document/$did", new Shape([
                'data' => $action->get("document")
            ]));
        };
    }

    /**
     * @return callable
     */
    public static function updateExtraDocuments(): callable
    {
        return function ($action) {
            $did = $action->get("did");
            Manager::getService('document')->update("document/$did", new Shape([
                'data' => $action->get("document")
            ]));
        };
    }

    /**
     * @param int $previous_years
     * @return callable
     */
    public static function loadCompanyFinancials(int $previous_years = 2): callable
    {
        return function ($action) use ($previous_years) {
            $collection = $action->getCollection("collection");
            $last_years = range(date("Y", strtotime("-$previous_years year")), date("Y"));
            if ($collection->count()) {
                $items = $collection->getItems();

                $financials = [];
                array_map(function ($item) use (&$financials, $last_years) {
                    if ((bool)$item['active_trading']) {
                        if (in_array($item['year'], $last_years) !== false) {
                            if ($item['value']) {
                                $item['value'] = number_format(str_replace(",", "", $item['value']), 2);
                            }
                            if ($item['profit_before_tax']) {
                                $item['profit_before_tax'] = number_format(str_replace(",", "", $item['profit_before_tax']), 2);
                            }
                            $financials[] = [
                                'id' => (int)$item['id'],
                                'year' => $item['year'],
                                'value' => $item['value'],
                                'profit_before_tax' => $item['profit_before_tax'],
                                'active_trading' => (bool)$item['active_trading'],
                            ];
                        }
                    }
                }, $items['turnover']->get());

                $action->set("prequalification", ['financials' => $financials], true);
            }
        };
    }

    /**
     * @param string $referenceIdKey
     * @return callable
     */
    public static function loadReferences(string $referenceIdKey = ''): callable
    {
        return function ($action) use ($referenceIdKey) {
            $collection = $action->getCollection("collection");
            if ($collection->count()) {
                $items = $collection->getItems();
                $references = [];
                $reference_id = 0;
                if ($referenceIdKey) {
                    $reference_id = (int)$action->get($referenceIdKey);
                }
                if (isset($items['references'])) {
                    (new CollectionClass($items['references']->get(), Shape::class))->map(function ($reference) use (&$references, $reference_id) {
                        if (!$reference_id || ($reference_id === (int)$reference->get("id"))) {
                            if ($reference->get("status") != 'deleted') {
                                if ($reference->get("reference_pdf")) {
                                    $reference_file = Config::getUrl("s3.documents", $reference->get("reference_pdf"));
                                }
                                $references[] = [
                                    'id' => (int)$reference->get("id"),
                                    'project_name' => $reference->get("project_name"),
                                    'client_name' => $reference->get("client_name"),
                                    'contract_value' => $reference->get("contract_value"),
                                    'contact_name' => $reference->get("contact_name"),
                                    'contact_email' => $reference->get("contact_email"),
                                    'completion_date' => $reference->get("completion_date"),
                                    'file' => $reference_file ?? null,
                                    'file_name' => basename($reference_file ?? ''),
                                    'sow' => $reference->get("sow"),
                                    'client_summary' => $reference->get("client_summary"),
                                    'status' => $reference->get("status"),
                                ];
                            }
                        }

                        return $reference;
                    });
                }
                if ($reference_id) {
                    $references = array_shift($references);
                }
                $action->set("prequalification", ['references' => $references], true);
            }
        };
    }

    /**
     * @param string $aidKey
     * @return callable
     */
    public static function loadOrganisation(string $aidKey = 'uriArgs.aid'): callable
    {
        return function ($action) use ($aidKey) {
            try {
                $aid = $action->int($aidKey);
                $members = Manager::getService('account')->fetch("account/$aid/organisation")->getCollection('data');

                $action->set("aids", array_filter($members->values("user_id")));
                UserMiddleware::loadUsersByIdArray("aids")($action);

                // Get all the users account ids from another organisation
                $whitness_from_other_organisations = [];
                array_map(function ($user) use ($aid, &$whitness_from_other_organisations) {
                    if ((int)$user['account_id'] !== $aid) {
                        $whitness_from_other_organisations[] = (int)$user['id'];
                    }
                }, $action->get("users"));

                if ($members) {
                    $members->map(function ($item) use (&$organisation, $whitness_from_other_organisations) {

                        // Only show users from the same organisations
                        if (in_array($item->int("user_id"), $whitness_from_other_organisations, true)) {
                            return $item;
                        }

                        $display_name = $item->get("firstname") && $item->get("lastname")
                            ? $item->get("firstname") . " " . $item->get("lastname")
                            : '';
                        $organisation[] = [
                            'id'        => $item->get("id"),
                            'user_id'   => $item->get("user_id"),
                            'title'     => $item->get("title"),
                            'phone'     => $item->get("phone"),
                            'firstname' => $item->get("firstname"),
                            'lastname'  => $item->get("lastname"),
                            'email'     => $item->get("email"),
                            'display_name'     => $display_name
                        ];
                    });
                }
            } catch (\Exception $e) {
                $organisation = [];
            }
            $action->set("prequalification", ['organisation' => $organisation ?? []], true);
        };
    }

    /**
     * @param string $accountIdKey
     * @return \Closure
     */
    public static function addOrganisationAccountOwner(string $accountIdKey)
    {
        return function ($a) use ($accountIdKey) {
            $user = $a->getShape("session")->getShape("user");
            $account_owner = TeamManager::getAccountOwner(intval($a->get($accountIdKey, $user->get("account_id"))));
            if ($account_owner) {
                $organisation = $a->get("prequalification.organisation");
                $organisation[] = [
                    'id'            => null,
                    'user_id'       => $account_owner->get("id"),
                    'title'         => $account_owner->get("job_title", self::DEFAULT_JOB_TITLE),
                    'email'         => $account_owner->get("email"),
                    'firstname'     => $account_owner->get("firstname"),
                    'lastname'      => $account_owner->get("lastname"),
                    'account_owner' => true
                ];
                $a->set("prequalification", ['organisation' => $organisation], true);
            }
        };
    }

    /**
     * @return callable
     */
    public static function loadDocumentTypes(): callable
    {
        return function ($action) {
            $action->setItems([
                "document_type"    => Manager::getService('document')->fetch("document/type")->getCollection('data'),
                'document_subtype' => Manager::getService('document')->fetch("document/subtype")->getCollection('data'),
            ]);
        };
    }

    /**
     * @return callable
     */
    public static function loadSections(): callable
    {
        return function ($action) {
            $sections = Manager::getService('account')->fetch("prequalification/sections")->getCollection('data');
            $action->set("sections", $sections);
        };
    }

    /**
     * @return callable
     */
    public static function loadDocumentsSections(): callable
    {
        return function ($action) {
            try {
                $data = Manager::getService('account')->fetch("prequalification/sections")->getCollection('data');
                $sections = [];
                foreach ($data->getItemsAsArray() as $item) {
                    if (!isset($sections[$item["label"]])) {
                        $sections[$item["label"]] = [$item];
                    } else {
                        $sections[$item["label"]][] = $item;
                    }
                }
                $sectionsKeys = array_keys($sections);
                $subtypes = Manager::getService('document')->fetch("document/subtype")->getCollection("data");

                $result = $subtypes->filter(function ($subtype) use ($sectionsKeys) {
                    return array_search($subtype->get("uid"), $sectionsKeys);
                });
            } catch (\Exception $e) {
                $result = [];
            }
            $action->set("document_sections", $result);
        };
    }

    /**
     * @return callable
     */
    public static function loadSectionStatuses(): callable
    {
        return function ($action) {

            $prequal = $action->get("prequalification");
            $statuses = $prequal['statuses'] ?? [];
            $status = [];

            $approved = true;

            foreach ($action->get('sections')->getItemsAsArray() as $key => $section) {
                $status[$section['label']]['status'] = false;
                $status[$section['label']]['message'] = '';
                if ($statuses) {
                    try {
                        $section_data = $statuses->filterByField("section_id", (int)$section['id'], cast: 'int')->getFirst();
                        $status[$section['label']]['status'] = (bool)$section_data->get("status");
                        $status[$section['label']]['message'] = $section_data->get("section_message");
                    } catch (\Exception $e) {
                    }
                }

                if (!$status[$section['label']]['status']) {
                    $approved = false;
                }

                $status[$section['label']]['id'] = (int)$section['id'];
            }

            $action->set("prequalification", [
                'statuses' => [
                    'approved' => $approved,
                    'sections' => $status
                ]
            ], true);
        };
    }

    /**
     * @return callable
     */
    public static function loadCertificates(): callable
    {
        return function ($action) {
            $sections = $action->get("document_sections");
            $collection    = $action->getCollection("collection");
            $document_type = $action->get("document_type")->filterByField("uid", 'account-documents')->getFirst();
            $requestor_id  = (int)$action->get("requestor_id");
            $aid = $action->get("aid");

            if ($collection->count()) {
                foreach ($sections->getItemsAsArray() as $section) {

                    $idSection = $section["id"];
                    $data = [
                        "type"           => $document_type->get("id"),
                        "subtype"        => $idSection,
                        "document_owner" => $aid,
                    ];
                    if ($requestor_id) {
                        $data['requestor_id'] = $requestor_id;
                    }

                    //GET CURRENT CERTIFICATE DOCUMENTS
                    $document = Manager::getService('document')->fetch('document', [
                        "type" => $document_type->get("id"),
                        "subtype" => $idSection,
                        "owner_id" => $aid
                    ])->getCollection('data');

                    //GET REQUESTED DOCUMENTS
                    //INCLUDING NOT PROVIDED DOCUMENTS
                    $requests = (new CollectionClass(PrequalificationModel::getCertificateRequests($data), Shape::class));

                    //MERGE TOGETHER CERTIFICATES FROM BOTH SOURCES
                    $documents_section = array_values(array_merge(
                        $document->getItemsAsArray(),
                        PrequalificationModel::getNotProvidedCertificates($document->values("name"), $requests)
                    ));

                    if ($requests->count()) {
                        $aids = $requests->values('requestor_id', true);
                        $accounts = Manager::getService('account')->fetch("account/[" . implode(",", $aids) . "]")->getCollection("data");
                        $requests = $requests->map(function ($item) use ($accounts) {
                            $request_account = $accounts->filterByField('id', $item->get('requestor_id'), cast: 'int');
                            if($request_account->count()) {
                                $account = $request_account->getFirst();
                                $item->set("main_contractor", $account->get("name"));
                            }

                            return $item;
                        });
                    }

                    $preqData = PrequalificationModel::aggregateCertificates($documents_section, $requests, $section['uid']);
                    $action->set("prequalification", [$section["uid"] => array_values($preqData)], true);
                }
            }
        };
    }

    /**
     * @return callable
     */
    public static function createTempDirectory(): callable
    {
        return function ($action) {
            $aid = $action->get("uriArgs.aid");
            $save_path = Config::getUrl('document.save.temp', strval($aid));
            if (!is_dir($save_path)) {
                $permission = intval(Config::get("document.save.permission"));
                if ($permission) {
                    mkdir($save_path, $permission, true);
                } else {
                    throw new \Exception("The temporary directory cannot be created. Permission not set");
                }
            }
            $action->set("save_path", $save_path);
        };
    }

    /**
     * @return callable
     */
    public static function loadReferenceDocument(): callable
    {
        return function ($action) {

            $prequal = $action->get("prequalification");

            if (isset($prequal['references']['file']) && $prequal['references']['file']) {
                $document = [
                    'id' => basename($prequal['references']['file_name']),
                    's3_key' => substr(strval(parse_url($prequal['references']['file'], PHP_URL_PATH)), 1)
                ];
            }

            $action->set("document", $document ?? []);
        };
    }

    /**
     * @return callable
     */
    public static function loadDocument(): callable
    {
        return function ($action) {
            $aid = (int)$action->get("uriArgs.aid");
            $did = (int)$action->get("uriArgs.did");

            try {
                $document = Manager::getService('document')->fetch('document', [
                    "id" => $did,
                    "owner_id" => $aid
                ])->getShape('data');

                if ($document->get()) {
                    $document = (array)$document->get();
                    $document = array_shift($document);
                    $action->set("document", $document);
                } else {
                    throw new \Exception("Document not found");
                }
            } catch (\Exception $e) {
                throw new \Exception("The docucment cannot be loaded");
            }
        };
    }

    /**
     * @return callable
     */
    public static function downloadDocument(): callable
    {
        return function ($action) {
            if ($document = $action->get("document")) {
                $meta = strval($document['meta'] ?? '');
                $meta = (array)json_decode($meta, true);
                $name = $meta['file'] ?? $document['id'];
                $save_to = $action->get("save_path") . "/" . $name;
                $path = $action->get("save_path");

                $documents = [];
                (new CollectionClass($action->get("prequalification"), Shape::class))->map(function ($section) use ($document, &$documents, $path) {
                    (new CollectionClass($section->toArray(), Shape::class))->map(function ($item) use ($document, &$documents, $path) {
                        if ($item->get("id") === $document['id']) {
                            $documents[] = [
                                'name' => $path . "/" . $item->get("original_file"),
                                'path' => $item->get("s3_key"),
                                'file' => $item->get("original_file"),
                                'save' => $path
                            ];
                            if ($item->get("extra")) {
                                (new CollectionClass($item->get('extra'), Shape::class))->map(function ($file) use (&$documents, $path) {
                                    $documents[] = [
                                        'name' => $path . "/" . $file->get("original_file"),
                                        'path' => $file->get("s3_key"),
                                        'file' => $file->get("original_file"),
                                        'save' => $path
                                    ];
                                });
                            }
                        }
                    });
                });
                try {
                    if (count($documents) <= 1) {
                        $document = array_shift($documents);
                        if ($document) {
                            S3Middleware::downloadFile('document', $document['path'], $save_to)($document['path'], $save_to);
                        }
                    } else {
                        S3Middleware::downloadFiles("document", $documents)("document", $documents);
                        $zip     = new ZipArchive;
                        $save_to = $action->get("save_path") . '/documents.zip';
                        if (file_exists($save_to)) {
                            unlink($save_to);
                        }
                        if ($zip->open($save_to, ZipArchive::CREATE) === TRUE) {
                            foreach ($documents as $document) {
                                $zip->addFile($document['save'] . "/" . $document['file'], $document['file']);
                            }
                            $zip->close();
                            array_map('unlink', array_filter((array) glob($action->get("save_path") . "/*")));
                        }
                    }
                } catch (\Exception $e) {
                    throw new \Exception("The document cannot be downloaded");
                }
                $action->set("output", $save_to);
            }
        };
    }

    /**
     * @return callable
     */
    public static function outputCertificate(): callable
    {
        return function ($action) {
            $output = $action->get("output");
            if ($output) {
                header('Content-Description: File Transfer');
                header('Content-Type: application/octet-stream');
                header('Content-Disposition: attachment; filename=' . basename($output));
                header('Content-Transfer-Encoding: binary');
                header('Expires: 0');
                header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
                header('Pragma: public');
                header('Content-Length: ' . filesize($output));
                ob_clean();
                flush();
                echo file_get_contents($output);
                exit;
            }
        };
    }

    /**
     * @param string $sectionIdKey
     * @param bool $status
     * @param string $message
     * @return callable
     */
    public static function updateSectionStatus(string $sectionIdKey, bool $status, string $message = 'Approved'): callable
    {
        return function ($action) use ($sectionIdKey, $status, $message) {
            $aid = (int)$action->get("aid");
            $section_id = (int)$action->get($sectionIdKey);
            Manager::getService('account')->update("prequalification/$aid/section", new Shape([
                'data' => [
                    'id'      => $section_id,
                    'status'  => $status,
                    'section_message' => $message
                ]
            ]));
        };
    }

    /**
     * @param string $sectionIdKey
     * @param string $resultKey
     * @return callable
     */
    public static function hasSectionAccess(string $sectionIdKey, string $resultKey = 'access'): callable
    {
        return function ($action) use ($sectionIdKey, $resultKey) {
            $ids = [];
            (new \Core\Data\Collection($action->get("prequalification"), Shape::class))->map(function ($item) use (&$ids) {
                $values = (new \Core\Data\Collection($item->get(), Shape::class))->values("id");
                $ids = array_merge($ids, $values);
            });
            $action->set($resultKey, in_array((int)$action->get($sectionIdKey), $ids, true));
        };
    }

    /**
     * @param string $sectionIdKey
     * @return callable
     */
    public static function removeSectionData(string $sectionIdKey): callable
    {
        return function ($action) use ($sectionIdKey) {
            $section_id = (int)$action->get($sectionIdKey);
            Manager::getService('document')->delete("document/$section_id");

            // Handle removing of extra documents
            $collection = Manager::getService('document')->fetch("document", ['parent_id' => $section_id])->getCollection('data');
            foreach ($collection->values("id") as $id) {
                Manager::getService('document')->delete("document/$id");
            }
        };
    }

    /**
     * @return callable
     */
    public static function generatePqqEmailContent(): callable
    {
        return function ($action) {
            $missingSectionFieldsHtml = '';
            $pqqData = $action->get("prequalification");
            $pqqFinancials = $pqqData['financials'] ?? [];
            $financialData = [];
            if (reset($pqqFinancials)) {
                $financials = $pqqFinancials[0];
                if ($financials['value'] === '0') {
                    $financialData[] = 'Turn Over Y1';
                }
            }
            $pqqCompanyInformation = $pqqData['company_information'] ?? [];
            if ($pqqCompanyInformation['min_order_value'] == '0') {
                $financialData[] = 'Order Val Min';
            }
            if ($pqqCompanyInformation['max_order_value'] == '0') {
                $financialData[] = 'Order Val Max';
            }
            if ($pqqCompanyInformation['num_current_employees'] == 0) {
                $financialData[] = 'Number of Employees';
            }

            if (!empty($financialData)) {
                $missingSectionFieldsHtml = '<p>Financials:</p><ul>';
                foreach ($financialData as $field) {
                    $missingSectionFieldsHtml .= "<li>$field</li>";
                }
                $missingSectionFieldsHtml .= '</ul>';
            }

            $pqqOrganisation = $pqqData['organisation'] ?? [];
            $hasCeoTitle = array_filter($pqqOrganisation, function ($person) {
                return trim($person['title']) === 'CEO/Managing Director';
            });
            if (empty($hasCeoTitle)) {
                $htmlValue = '<p>Organisation:</p><ul><li>CEO/Managing Director</li></ul>';

                if (!empty($missingSectionFieldsHtml)) {
                    $missingSectionFieldsHtml .= $htmlValue;
                } else {
                    $missingSectionFieldsHtml = $htmlValue;
                }
            }

            $pqqReferences = $pqqData['references'] ?? [];
            $hasApproved = array_filter($pqqReferences, function ($item) {
                return isset($item['status']) && $item['status'] === 'approved';
            });

            if (empty($hasApproved)) {
                $htmlValue = '<p>References:</p><ul><li>First ref</li></ul>';

                if (!empty($missingSectionFieldsHtml)) {
                    $missingSectionFieldsHtml .= $htmlValue;
                } else {
                    $missingSectionFieldsHtml = $htmlValue;
                }
            }

            $pqqInsurance = $pqqData['insurances'] ?? [];
            $requiredLabels = [
                'Employers Liability',
                'Products Liability',
                'Schedule Public Liability',
                'Schedule Professional Indemnity'
            ];
            $today = date('Y-m-d');

            // Create a map of label => date from the data in "insurances" section
            $labelDateMap = [];

            foreach ($pqqInsurance as $item) {
                if ($item['section'] === 'insurances') {
                    $labelDateMap[$item['label']] = $item['date'];
                }
            }
            $insuranceHtml = '';

            // Check each required label
            foreach ($requiredLabels as $label) {
                if (!isset($labelDateMap[$label]) || $labelDateMap[$label] < $today) {
                    if (!empty($insuranceHtml)) {
                        $insuranceHtml .= "<li>$label</li>";
                    } else {
                        $insuranceHtml = "<p>Insurances:</p><ul><li>$label</li>";
                    }
                }
            }
            if (!empty($insuranceHtml)) {
                $insuranceHtml .= '</ul>';

                if (!empty($missingSectionFieldsHtml)) {
                    $missingSectionFieldsHtml .= $insuranceHtml;
                } else {
                    $missingSectionFieldsHtml = $insuranceHtml;
                }
            }

            $action->set("user_email", $action->get("contact.email"));
            $action->set("user_name", $action->get("contact.display_name"));
            $action->set("missing_section_fields_html", $missingSectionFieldsHtml);
        };
    }

    /**
     * @return callable
     */
    public static function checkPqqStatus(): callable
    {
        return function ($action) {
            $pqqStatus = true;
            $pqqData = $action->get("prequalification");
            $pqqFinancials = $pqqData['financials'] ?? [];
            if (reset($pqqFinancials)) {
                $financials = $pqqFinancials[0];
                if ($financials['value'] === '0') {
                    $pqqStatus = false;
                }
            }
            $pqqCompanyInformation = $pqqData['company_information'] ?? [];
            if ($pqqCompanyInformation['min_order_value'] == '0') {
                $pqqStatus = false;
            }
            if ($pqqCompanyInformation['max_order_value'] == '0') {
                $pqqStatus = false;
            }
            if ($pqqCompanyInformation['num_current_employees'] == 0) {
                $pqqStatus = false;
            }
            if ($pqqCompanyInformation['num_current_contractors'] == 0) {
                $pqqStatus = false;
            }

            $pqqOrganisation = $pqqData['organisation'] ?? [];
            $hasCeoTitle = array_filter($pqqOrganisation, function ($person) {
                return trim($person['title']) === 'CEO/Managing Director';
            });
            if (empty($hasCeoTitle)) {
                $pqqStatus = false;
            }

            $pqqReferences = $pqqData['references'] ?? [];
            $hasApproved = array_filter($pqqReferences, function ($item) {
                return isset($item['status']) && $item['status'] === 'approved';
            });

            if (empty($hasApproved)) {
                $pqqStatus = false;
            }

            $pqqInsurance = $pqqData['insurances'] ?? [];
            $requiredLabels = [
                'Employers Liability',
                'Products Liability',
                'Schedule Public Liability',
                'Schedule Professional Indemnity'
            ];
            $today = date('Y-m-d');

            // Create a map of label => date from the data in "insurances" section
            $labelDateMap = [];

            foreach ($pqqInsurance as $item) {
                if ($item['section'] === 'insurances') {
                    $labelDateMap[$item['label']] = $item['date'];
                }
            }

            $validCount = 0;

            // Check each required label
            foreach ($requiredLabels as $label) {
                if (isset($labelDateMap[$label]) && $labelDateMap[$label] >= $today) {
                    $validCount++;
                    break;
                }
            }

            $pqqStatus = ($validCount > 0) ? $pqqStatus : false;

            $action->set("pqq_status", $pqqStatus);
        };
    }

    /**
     * @return callable
     */
    public static function checkPqqNotificationStatus(): callable
    {
        return function ($action) {
            $receiverNotifications = $action->get('receiver_notifications');
            if ($action->get("receiver_notifications")->count() > 0) {

                $sorted = $receiverNotifications->sort(function ($a, $b) {
                    return strtotime($b['created_at']) <=> strtotime($a['created_at']);
                });
                $contractorUid = $sorted->first()->get("requester_id");
                $contractorUser = Manager::getService('account')->fetch("user/$contractorUid/profile")->getShape("data");
                $action->set('contractor_user', $contractorUser);
                $accountData = Manager::getService('account')->fetch("account/{$contractorUser->get('account_id')}")->getShape("data");
                $action->set('contractor_user_account', $accountData);
                $action->set('contractor_name', $accountData->get('name'));
            }
            $action->set("is_notify", $action->get("receiver_notifications")->count() > 0);
        };
    }

    /**
     * @param string $contractorKey
     * @param string $subcontractorUserKey
     * @return callable
     */
    public static function setUserNotificationStatus(string $contractorKey = 'uriArgs.contractor_aid', string $subcontractorUserKey = 'contact.id'): callable
    {
        return function ($action) use ($contractorKey, $subcontractorUserKey) {
            $requestorId = $action->get($contractorKey);
            $receiverId = $action->get($subcontractorUserKey);
            $userActionTypes = Manager::getService('account')->fetch("user/user_action_types")->getCollection('data');
            $actionType = $userActionTypes->filterByField('label', 'PQQ Request')->getFirst();
            $actionId = $actionType->get('id');

            $subcontractorPendingNotification = $action->get('receiver_notifications');
            if ($subcontractorPendingNotification->filterByField('requester_id', $requestorId)->count() == 0) {
                Manager::getService('account')->write("user/notifications", new Shape([
                    "data" => [
                        "action_id" => $actionId,
                        "requester_id" => $requestorId,
                        "receiver_id" => $receiverId
                    ]
                ]));
            }
        };
    }

    /**
     * @return callable
     */
    public static function getNotificationsByReceiverId(string $receiverKey = 'receiver_id'): callable
    {
        return function ($action) use ($receiverKey) {
            $receiverId = $action->get($receiverKey);
            $receiverNotifications = Manager::getService('account')->fetch("user/$receiverId/notifications")->getCollection('data');
            $action->set('receiver_notifications', $receiverNotifications);
        };
    }
}
