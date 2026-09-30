<?php

namespace Api\Middleware;

use Core\Data\Shape;
use Core\Data\Collection;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use ZipArchive;

class TenderMiddleware
{

    public CONST BOQ_TENDER_HISTORY_META_KEY = 'boq_available';

    const SUGGESTED_STATE_LABEL = 'suggested';

    const PUBLISHED_STATE_LABEL = 'published';

    const DRAFT_STATE_LABEL = 'draft';


    /**
     * @param string $idKey
     * @return \Closure
     */
    public static function fetchPackage(string $idKey = "tender_id"): \Closure
    {
        return function (Shape $action) use ($idKey) {
            try {
                $tid = $action->int($idKey);
                $response = Manager::getService("project")->fetch("tender/" . $tid);
                $data = $response->get("data");
                if ($data->count()) {

                    return $action->set("package", new Shape(
                        array_merge(
                            ["id" => $tid],
                            $data->get($tid),
                            ["project" => $data->getShape("project")]
                        )
                    ));
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("tenderNotFoundError", $e->getMessage());
            }

            throw new MiddlewareException("tenderNotFoundError", "The tender with the id " . $idKey ." has not been found");
        };
    }

    /**
     * @param string $idKey
     * @return \Closure
     */
    public static function fetchPackageQuotes(
        string $idKey = "tender_id", $onSuccess = null, $filesKey="quote_files"
        ): \Closure
    {
        return function (Shape $action) use ($idKey, $onSuccess, $filesKey) {
            try {
                $tid = $action->int($idKey);
                $response = Manager::getService("project")->fetch("tender/$tid/quoteFiles");
                $data = $response->get("data");
                if ($data->count()) {
                    $action->set("package", $data->getShape("package"));
                    $action->set($filesKey, $data->get("quotes"));

                    if(is_callable($onSuccess)) {
                        $onSuccess($action, $data);
                    }
                    return $action;
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("tenderNotFoundError", $e->getMessage());
            }

            throw new MiddlewareException("tenderNotFoundError", "The tender with the id " . $idKey ." has not been found");
        };
    }

    /**
     *  TODO: Refactor this method,
     *      a) the name is wrong as it retutns a tender or the full data from project service for a package, nothing to do with the history,
     *      b) $returnAsList if true, returns the project data as well, not as a list, so the name is confusing
     * @param string $idKey
     * @param bool $returnAsList
     *
     * @return \Closure
     */
    public static function fetchTenderHistoryByTenderId(string $idKey = "tender_id", bool $returnAsList = false): \Closure
    {
        return function (Shape $action) use ($idKey, $returnAsList) {
            try {
                $tenders = Manager::getService("project")->fetch("tender/" . $action->int($idKey))->getCollection('data');
                if ($tenders->count()) {
                    $history = $returnAsList ? $tenders : $tenders->first();

                    return $action->set("tender", $history);
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("tenderNotFoundError", $e->getMessage());
            }

            throw new MiddlewareException("tenderNotFoundError", "The tender with the id " . $idKey ." has not been found");
        };
    }

    /**
     * @param string $tenderDataKey
     * @param string $history_type
     * @param string $saveKey
     * @return \Closure
     */
    public static function getBoqSubcontractorsFromTender(string $tenderDataKey = "tender", string $history_type = 'Enquiry', string $saveKey = "subcontractors"): \Closure
    {
        return function (Shape $action) use ($tenderDataKey, $history_type, $saveKey) {
            $subcontractors = [];
            if($action->get($tenderDataKey)->has($history_type)) {
                $action->get($tenderDataKey)->getCollection($history_type)->map(function ($history) use (&$subcontractors) {
                    $last_entry = $history->getCollection("history")->getLast();
                    $subcontractors[] = new Shape([
                        'sent_date' => $last_entry->get("created_at"),
                        'id' => $last_entry->get("specialist_id"),
                    ]);
                });
            }
            $action->set($saveKey, $subcontractors);
        };
    }

    /**
     * @return \Closure
     */
    public static function updateTenderBudget(): \Closure
    {
        return function (Shape $action) {
            $boq = $action->get("boq");
            $tid = $boq->int("tender_id");
            $pid = $boq->int("tender.project_id");
            $items = new Collection($action->get("json.entries", []), Shape::class);
            $items = $items->filter(function($item){
                return $item->get("type") === "item";
            });
            $totalBudget = 0;
            foreach($items as $item) {
                if ($item->get("budget_total")) {
                    $totalBudget = $totalBudget + $item->get("budget_total");
                } else {
                    $totalBudget = $totalBudget + $item->get("budget_rate") * $item->get("quantity");
                }
            }
            $totalBudget = $totalBudget * 100;
            try {
                Manager::getService("project")->update("project/".$pid."/tender/". $tid, new Shape(["data" => ["budget" => $totalBudget]]));
            } catch (\Exception $e) {
                throw new MiddlewareException("badRequest", $e->getMessage());
            }
        };
    }


    /**
     * @param string $pidKey
     * @param string $tidKey
     * @param string $postDataKey
     * @return \Closure
     */
    public static function createTenderHistory(string $pidKey = "pid", string $tidKey = "tid", string $postDataKey = "th_post_data"): \Closure
    {
        return function (Shape $action) use ($pidKey, $tidKey, $postDataKey) {
            $pid = $action->get($pidKey);
            $tid = $action->get($tidKey);
            if (!$pid || !$tid) {
                throw new MiddlewareException("badRequest", "Project ID or Tender ID is missing.");
            }
            $postData = $action->get($postDataKey);
            if (!$postData) {
                throw new MiddlewareException("badRequest", "Post data is missing.");
            }
            try {
                Manager::getService("project")->write("project/{$pid}/tender/{$tid}/history", new Shape(['data' => $postData]));
            } catch (\Exception $e) {
                throw new MiddlewareException("badRequest", $e->getMessage());
            }
        };
    }

    /**
     * @param string $pidKey
     * @param string $tidKey
     * @param bool $returnAsList
     * @return \Closure
     */
    public static function fetchTenderHistory(string $pidKey = 'pid', string $tidKey = 'tid', bool $returnAsList = false): \Closure
    {
        return function (Shape $action) use ($pidKey, $tidKey, $returnAsList) {
            try {
                $pid = $action->get($pidKey);
                $tid = $action->get($tidKey);
                $tenderHistory = Manager::getService("project")->fetch("project/".$pid."/tender/".$tid."/history")->getCollection('data');
                return $action->set('tender_history', $returnAsList ? $tenderHistory->getItemsAsArray() : $tenderHistory);
            } catch (\Exception $e) {
                throw new MiddlewareException("TenderHistoryNotFoundError", $e->getMessage());
            }
        };
    }

    /**
     * @return array|mixed
     */
    public static function getTenderHistoryTypes()
    {
        return Manager::getService("project")->fetch("/tender/history/type")->getCollection('data')->getItemsAsArray();
    }

    /**
     * @return array|mixed
     * @throws Exception
     */
    public static function getTenderHistoryType(int $id): array
    {
        $types = self::getTenderHistoryTypes();
        foreach ($types as $type) {
            if ($id === (int) $type["id"]) {
                return $type;
            }
        }
        return [];
    }

    /**
     * @param string $label
     * @return mixed
     * @throws Exception
     */
    public static function getTenderHistoryTypeId(string $label)
    {

        $types = self::getTenderHistoryTypes();
        foreach ($types as $type) {
            if (strcasecmp($type["uid"], $label) === 0) {
                return $type["id"];
            }
        }

        throw new \Exception("Invalid Status Label $label");
    }

    /**
     * @param array $labels
     * @return array
     * @throws Exception
     */
    public static function getTenderHistoryTypeIds(array $labels)
    {
        $ids = [];
        foreach ($labels as $label) {
            if ($id = self::getTenderHistoryTypeId($label)) {
                $ids[] = $id;
            }
        }
        return $ids;
    }

    /**
     * @param string $tenderHistoryFieldKey
     * @param string $tenderHistoryValueKey
     * @param string $tenderHistoryTypeName
     * @param bool $returnAsList
     * @return \Closure
     *
     * Usage:
     * $action->get("tender_history_type_{$tenderHistoryTypeName}")
     */
    public static function fetchTenderHistoryType(string $tenderHistoryFieldKey = 'id', string $tenderHistoryValueKey = '', string $tenderHistoryTypeName = '', bool $returnAsList = false): \Closure
    {
        return function (Shape $action) use ($tenderHistoryFieldKey, $tenderHistoryValueKey, $tenderHistoryTypeName, $returnAsList) {
            try {
                $tenderHistoryType = Manager::getService("project")->fetch("tender/history/type")->getCollection('data')->filterByField($tenderHistoryFieldKey, $tenderHistoryValueKey);
                if ($tenderHistoryType->count()) {
                    return $action->set("tender_history_type_{$tenderHistoryTypeName}", $returnAsList ? $tenderHistoryType : $tenderHistoryType->first());
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("TenderHistoryTypeNotFoundError", $e->getMessage());
            }

            throw new MiddlewareException("TenderHistoryTypeNotFoundError", "The tender history type with " . $tenderHistoryFieldKey . "=" . $action->get($tenderHistoryValueKey) . " has not been found");
        };
    }

    /**
     * @param string $pidKey
     * @param array $params
     * @param bool $returnAsList
     * @return \Closure
     */
    public static function fetchTenderByProject(string $pidKey = 'request_args.pid', array $params = [], bool $returnAsList = false): \Closure
    {
        return function (Shape $action) use ($pidKey, $params, $returnAsList) {
            $pid = $action->get($pidKey);
            try {
                $tender = Manager::getService("project")->fetch(
                    sprintf("project/%s/tender", $pid),
                    $params
                )->getCollection('data');
                if ($tender->count() > 0) {
                    return $action->set("tender", $returnAsList ? $tender : $tender->first());
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("serviceError", $e->getMessage());
            }
            throw new MiddlewareException("noEntityFound", "The tender with Project ID: " . $pid . " and Params: ". json_encode($params)  ." has not been found");
        };
    }

    /**
     * @return array
     */
    public static function getState(): array
    {
        $constants = Manager::getService("project")->fetch("project/constants")->getShape('data')->get();
        return $constants["tender"]["state"];
    }

    /**
     * @param int $id
     * @return string|null
     */
    public static function getStateLabelById(int $id): ?string
    {
        $state = self::getState();
        return $state[$id] ?? null;
    }

    /**
     * @param int $id
     * @param string $state
     * @return bool
     */
    public static function isState(int $id, string $state): bool
    {
        return (self::getStateLabelById($id) === constant('self::' . strtoupper($state) . '_STATE_LABEL'));
    }

    /**
     * @param int $id
     * @param string $state
     * @return array
     */
    public static function stateLabel(int $id): array
    {
        return self::getState();
    }

    /**
     * Fetch tender with quote files from transactions.
     *
     * Uses existing project service endpoints to fetch tender data and quote file URLs.
     * This approach uses the transaction table as the source of truth for active quotes,
     * and leverages the centralized S3::getTransactionQuoteFile() method to build file URLs.
     *
     * The middleware makes three calls to project service:
     * 1. Fetch tender with project/packages data
     * 2. Fetch transactions for the tender (to get transaction_id => subcontractor_id mapping)
     * 3. Fetch S3 file URLs (which uses S3::getTransactionQuoteFile internally)
     *
     * @param string $idKey Key where tender ID is stored (e.g., "tender_id" or "uriArgs.package_id")
     * @param string $packageKey Key to store the package/tender data
     * @param string $filesKey Key to store quote files (maps subcontractor_id => S3 URL)
     * @return \Closure
     */
    public static function fetchTenderWithQuoteFiles(
        string $idKey = "tender_id",
        string $packageKey = "package",
        string $filesKey = "quote_files"
    ): \Closure
    {
        return function (Shape $action) use ($idKey, $packageKey, $filesKey) {
            try {
                $tid = $action->int($idKey);

                // 1. Fetch tender with project and packages
                $tenderResponse = Manager::getService("project")->fetch("tender/" . $tid);
                $tenderData = $tenderResponse->get("data");

                // The response structure is: {tender_id: {...tender data...}, project: {...}}
                // We need to extract the tender data from the tender_id key
                if (!$tenderData || !$tenderData->has($tid)) {
                    throw new MiddlewareException("tenderNotFoundError", "Tender not found");
                }

                // Extract tender data and merge with project info
                $tenderInfo = $tenderData->get($tid);

                // Transform packages from array of IDs to array of objects with package_id field
                // The route expects each package to have a package_id field for mapping to trades
                $packageIds = $tenderInfo["packages"] ?? [];
                $packageObjects = array_map(function($pkgId) {
                    return ["package_id" => $pkgId];
                }, $packageIds);

                // Get project data and ensure it has an 'id' field (QSAI expects this)
                $projectData = $tenderData->get("project");
                $projectData["id"] = $projectData["pid"] ?? $projectData["id"] ?? null;

                $package = new Shape(
                    array_merge(
                        ["id" => $tid],
                        $tenderInfo,
                        ["packages" => $packageObjects],
                        ["project" => $projectData]
                    )
                );

                // Get project_id from the tender data
                $pid = $package->int("project_id");

                // 2. Fetch transactions to get transaction_id => subcontractor_id mapping
                $transactionsResponse = Manager::getService("project")->fetch(
                    "project/{$pid}/tender/{$tid}/transaction"
                );

                // Build map: transaction_id => ['subcontractor_id' => ..., 'meta' => ...]
                // meta carries the JSON payload that holds subcontractor_name for the
                // legacy manual-subcontractor case (transaction.subcontractor_id = -1).
                $transactionData = [];

                // The response data contains tender(s) with nested transactions
                // The response is an array: [{tender_id: ..., transaction: [...]}]
                $responseData = $transactionsResponse->get("data");
                error_log("Transactions response data: " . json_encode($responseData));

                // Convert to array and get first element if it's a Collection/Shape
                $responseArray = is_array($responseData) ? $responseData : $responseData->toArray();

                if (!empty($responseArray)) {
                    $tenderWithTransactions = new Shape($responseArray[0]);

                    // Extract transactions if available
                    if ($tenderWithTransactions->has("transaction")) {
                        $transactions = $tenderWithTransactions->get("transaction");

                        if (is_array($transactions)) {
                            foreach ($transactions as $transaction) {
                                $txn = new Shape($transaction);
                                $transactionData[$txn->int("id")] = [
                                    "subcontractor_id" => $txn->int("subcontractor_id"),
                                    "meta"             => $txn->get("meta"),
                                ];
                            }
                        }
                    }
                }
                error_log("Transaction data map: " . count($transactionData) . " transactions");

                // 3. Fetch file URLs using existing endpoint (uses S3::getTransactionQuoteFile internally)
                $filesResponse = Manager::getService("project")->fetch(
                    "project/{$pid}/tender/transaction/files"
                );

                $allFiles = $filesResponse->get("data");
                error_log("All files response: " . json_encode($allFiles));
                $tenderFiles = $allFiles->get($tid, []);
                error_log("Tender files for tid {$tid}: " . json_encode($tenderFiles));

                unset($tenderFiles['sid']);

                $tmpFiles = self::downloadDocumentToTemp($tenderFiles);

                // 4. Fetch per-file document metadata and build
                // [transaction_id][name] => document_id lookup so the QSAI
                // POST can carry quote_external_id per file. Best-effort:
                // quote_external_id is optional per AI2-465, so a failure
                // (service down, malformed body) must not block the analysis
                // — we fall back to '' on the POST for every file.
                $documentIdByTransactionAndName = [];
                try {
                    $documentsResponse = Manager::getService("project")->fetch(
                        "project/{$pid}/transaction/documents"
                    );
                    $documentsData = $documentsResponse->get("data");
                    $documentsByTender = [];
                    if (is_array($documentsData)) {
                        $documentsByTender = $documentsData;
                    } elseif (is_object($documentsData) && method_exists($documentsData, "toArray")) {
                        $documentsByTender = $documentsData->toArray();
                    }
                    foreach ($documentsByTender[$tid] ?? [] as $transactionId => $group) {
                        foreach ($group["documents"] ?? [] as $doc) {
                            $documentIdByTransactionAndName[(int) $transactionId][$doc["name"]] = (int) $doc["id"];
                        }
                    }
                } catch (\Exception $e) {
                    error_log("fetchTenderWithQuoteFiles: transaction/documents lookup failed for pid={$pid}: " . $e->getMessage());
                }

                // 5. Map files to transaction ID because 1 sub-contractor can send multiple quotes and if we map transactions based on sub-contractor then
                // multiple quotations from a single subcontractor will be overwritten.
                $quotes = [];
                foreach ($tmpFiles as $transactionId => $tmpFile) {
                    foreach ($tmpFile as $filePath) {
                        if (isset($transactionData[$transactionId])) {
                            $fileName = basename($filePath);
                            $quotes[] = [
                                "transaction_id"          => (int) $transactionId,
                                "transaction_document_id" => $documentIdByTransactionAndName[(int) $transactionId][$fileName] ?? null,
                                "subcontractor_id"        => (string) $transactionData[$transactionId]["subcontractor_id"],
                                "quotes_tmp_path"         => $filePath,
                                "meta"                    => $transactionData[$transactionId]["meta"],
                            ];
                        }
                    }
                }
                error_log("Final quotes map: " . json_encode($quotes));

                $action->set($packageKey, $package);
                $action->set($filesKey, $quotes);
                $action->set("sids", array_unique(array_column($transactionData, "subcontractor_id")));

                return $action;
            } catch (MiddlewareException $e) {
                throw new MiddlewareException("documentError", $e->getMessage());
            } catch (\Exception $e) {
                // Log the actual error for debugging
                error_log("fetchTenderWithQuoteFiles error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
                error_log("Stack trace: " . $e->getTraceAsString());
                throw new MiddlewareException("tenderNotFoundError", "Error fetching tender data: " . $e->getMessage());
            }
        };
    }

    public static function cleanTempFiles(array $tempFiles) {
        foreach($tempFiles as $tempFile) {
            if (is_array($tempFile) && !array_key_exists('quotes_tmp_path', $tempFile)) {
                self::cleanTempFiles($tempFile);
                continue;
            }

            $path = is_array($tempFile) ? $tempFile['quotes_tmp_path'] : $tempFile;
            if (!empty($path) && file_exists($path)) {
                unlink($path);
            }
        }
    }

    /**
     * Download the document to a temp file for QSAI upload
     *
     * Fetches document metadata, verifies ownership, and downloads from S3.
     *
     * @param \Core\Data\Collection $documents
     * @return array
     */
    public static function downloadDocumentToTemp(array $tenderFiles): array
    {
        $tmpArr = [];
        // Replace this with the config alias for the bucket where quotes are stored (e.g. "project" or "document")
        $s3BucketAlias = "document";
        try {
            foreach ($tenderFiles as $transactionId => $fileUrl) {

                // Create temporary zip file
                $tmpZipFile = tempnam(sys_get_temp_dir(), 'ti_') . '.zip';

                // Download from S3
                $parsedPath = parse_url($fileUrl, PHP_URL_PATH);
                $s3Key = ltrim(urldecode($parsedPath), '/');

                $res = Manager::getService("s3")->save($s3BucketAlias, $s3Key, $tmpZipFile);

                if ($res === false) {
                    throw new MiddlewareException("documentError", "Unable to retrieve quotation document for analysis");
                }

                // Basic validation of downloaded file
                if (!file_exists($tmpZipFile) || filesize($tmpZipFile) === 0) {
                    throw new MiddlewareException("documentError", "Quotation file not found or empty for analysis");
                }

                // Create extraction directory
                $tmpDir = sys_get_temp_dir() . "/" . $transactionId . "/";
                if (is_dir($tmpDir)) {
                    array_map('unlink', glob($tmpDir . '*'));
                } else {
                    mkdir($tmpDir, 0777, true);
                }

                // Open ZIP
                $zip = new ZipArchive();
                if ($zip->open($tmpZipFile) === true) {
                    $zip->extractTo($tmpDir);
                    $zip->close();
                    unlink($tmpZipFile);
                } else {
                    throw new MiddlewareException("documentError", "Failed to open zip file for analysis");
                }

                // Discover extracted files case-insensitively: ZipArchive::extractTo() preserves
                // the original casing, so a lowercase-only glob would drop Quote.XLSX, quote.CSV, etc.
                // AI2-426: docx included in the supported set.
                $supportedExtensions = ['pdf', 'docx', 'xls', 'xlsx', 'csv', 'txt'];
                $files = array_values(array_filter(
                    glob($tmpDir . '*') ?: [],
                    function ($file) use ($supportedExtensions) {
                        return in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), $supportedExtensions, true);
                    }
                ));

                if (empty($files)) {
                    self::cleanTempFiles($files);
                    throw new MiddlewareException("documentError", "No PDF files found after extraction for analysis");
                }

                // Optional: Filter only valid files (recommended)
                $validFiles = array_filter($files, function($file) {
                    return is_file($file) && filesize($file) > 0;
                });

                $tmpArr[$transactionId] = $validFiles;   // Store array of PDF paths

                $files = [];
            }

            return $tmpArr;
        } catch (MiddlewareException $e) {
            // Clean up temp file on error
            self::cleanTempFiles($tmpArr);
            error_log("QSAI downloadDocumentToTemp error: " . $e->getMessage());
            throw $e;
        } catch (\Exception $e) {            // Clean up temp file on error
            self::cleanTempFiles($tmpArr);

            error_log("QSAI downloadDocumentToTemp unexpected error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            error_log("Stack trace: " . $e->getTraceAsString());
            throw new MiddlewareException("documentError", "Failed to prepare quotation document for analysis.");
        }
    }
}
