<?php

use Core\Service\Manager;
use Core\Data\Shape;
use Core\Config;
use Prosper\Middleware\Cron\PrequalificationMiddleware;

return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "onError" => [],
    "actions" => [
        [
            "key" => "update_pqq_statuses",
            "middleware" => [
                function () use ($sections) {
                    $environment = Config::get("environment");
                    $notifyFailure = function (string $message, array $context) use ($environment) {
                        Manager::getService('sns')->sendException(
                            'failed_pqq_statuses_cron',
                            $message,
                            new Shape(array_merge($context, ['environment' => $environment]))
                        );
                    };

                    $assertSuccess = function (Shape $response, string $request) {
                        $code = (int) $response->get("info.http_code");
                        if ($code < 200 || $code >= 300) {
                            throw new \RuntimeException(sprintf(
                                "%s failed (HTTP %d): %s",
                                $request,
                                $code,
                                (string) $response->get("content")
                            ));
                        }
                    };

                    try {
                        $res = Manager::getService("account")->fetch("account/all");
                        $data = $res->getCollection("data")->getItemsAsArray();

                        $subContractors = array_filter($data, function ($item) {
                            return in_array($item['type_id'], [3, 4]);
                        });

                        $accountIds = array_column($subContractors, 'id');
                        $supplyChainIds = array_keys(array_flip($accountIds));

                        $sections = Manager::getService("account")->fetch("prequalification/section_list")->getCollection("data");

                        $allRecordsKey = "prequalification/0/sections";
                        $records = Manager::getService("account")->fetch($allRecordsKey)->getCollection("data")->getItemsAsArray();

                        $accountsWithRecords = [];
                        foreach ($records as $record) {
                            $accountsWithRecords[$record['account_id']][] = $record;
                        }

                        $documentTypes = Manager::getService('document')->fetch("document/type")->getCollection('data');
                        $documentSubtypes = Manager::getService('document')->fetch("document/subtype")->getCollection('data');
                        $certificates = Manager::getService('document')->fetch("document/preq_default_certificates")->getCollection('data');

                        $document_type = $documentTypes->filterByField("uid", 'account-documents')->getFirst();
                        $type = $document_type->get("id");

                        $preqChecking = new PrequalificationMiddleware();
                        $preqChecking->setDocumentTypes($documentTypes);
                        $preqChecking->setDocumentSubtypes($documentSubtypes);
                        $preqChecking->setCertificates($certificates);
                        $preqChecking->setPrequalificationSections($sections);

                        foreach ($supplyChainIds as $id) {
                            try {
                                if (!isset($accountsWithRecords[intval($id)])) {
                                    // Create status records for this account
                                    $data = [];
                                    foreach ($sections as $section) {
                                        $idSection = $section->int("id");
                                        if (!isset($preqChecking->getConfig()[$idSection])) {
                                            continue;
                                        }

                                        $data = [
                                            'section_id'   => $idSection,
                                            'account_id'   => $id,
                                        ];
                                        $res = Manager::getService("account")->write("prequalification/$id/sections", new Shape(["data" => $data]));
                                        $assertSuccess($res, "POST prequalification/$id/sections");

                                        $subsections = $preqChecking->getConfig()[$idSection] ?? false;
                                        if ($subsections) {
                                            foreach ($subsections as $subSection) {
                                                $data = [
                                                    'parent_id'    => $idSection,
                                                    'section_id'   => $subSection,
                                                    'account_id'   => $id,
                                                ];
                                                $res = Manager::getService("account")->write("prequalification/$id/sections", new Shape(["data" => $data]));
                                                $assertSuccess($res, "POST prequalification/$id/sections");
                                            }
                                        }
                                    }
                                } else {
                                    $documentsAccount = Manager::getService('document')->fetch('document', [
                                        "type"     => $type,
                                        "owner_id" => $id,
                                    ])->getCollection('data')->getItemsAsArray();
                                    $preqChecking->setDocumentsAccount($documentsAccount);

                                    // Update status records for this account
                                    $data = $preqChecking->checkStatus($id);

                                    $recordsToCheck = $accountsWithRecords[intval($id)];

                                    foreach ($recordsToCheck as $record) {
                                        $idRecord = $record["id"];
                                        $idSection = intval($record["section_id"]);
                                        $oldStatus = intval($record["status"]);

                                        if (!array_key_exists($idSection, $data)) {
                                            continue;
                                        }

                                        $newStatus = intval($data[$idSection]);

                                        // Make the request just if the status has changed
                                        if ($newStatus !== $oldStatus) {
                                            $res = Manager::getService("account")->update(
                                                "prequalification/$idRecord/sections",
                                                new Shape(["data" => ["status"  => $newStatus]])
                                            );
                                            $assertSuccess($res, "PATCH prequalification/$idRecord/sections");
                                        }
                                    }
                                }
                            } catch (\Exception $e) {
                                // A single account failing (e.g. a non-200 from a service
                                // fetch inside checkStatus) must not abort the whole run;
                                // skip it so every other account still gets updated.
                                error_log(sprintf(
                                    "update_pqq_statuses: skipped account %s - %s",
                                    $id,
                                    $e->getMessage()
                                ));
                                $notifyFailure(
                                    'PQQ statuses cron: skipped account ' . $id,
                                    [
                                        'account_id' => $id,
                                        'message'    => $e->getMessage(),
                                    ]
                                );
                                continue;
                            }
                        }
                    } catch (\Exception $e) {
                        error_log('PQQ statuses cron failed: ' . $e->getMessage());
                        $notifyFailure(
                            'PQQ statuses cron failed: ' . $e->getMessage(),
                            ['message' => $e->getMessage()]
                        );
                    }
                },
            ]
        ],

    ]
];
