<?php

namespace Api\Middleware;

use Core\Config;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Exception\RestException;
use Core\Util\StructuredLogger;
use Prosper\Model\Document as DocumentModel;

/**
 * Middleware for Tender Insights AI analysis functionality
 *
 * Handles document resolution, S3 downloads, and QSAI service communication
 * for the tender insights feature.
 */
class TenderInsightsMiddleware
{
    /**
     * Default timeout for QSAI API calls (seconds)
     */
    public const QSAI_DEFAULT_TIMEOUT = 10;

    /**
     * Endpoint identifier for GET requests
     */
    public const ENDPOINT_GET = 'GET';

    /**
     * Endpoint identifier for POST requests
     */
    public const ENDPOINT_POST = 'POST';

    /**
     * Log prefix for Tender Insights operations
     */
    private const LOG_PREFIX = 'TI';

    private const DOC_TYPE_MAIN = "main";

    private const DOC_TYPE_ADDENDUM = "addendum";

    /**
     * MIME types supported by QSAI for tender document analysis, keyed by extension
     */
    private const QSAI_SUPPORTED_MIME_TYPES = [
        'pdf'  => 'application/pdf',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    /**
     * Structured logging for Tender Insights
     *
     * Wrapper around StructuredLogger for Tender Insights-specific logging.
     *
     * @param string $level Log level: DEBUG, INFO, WARNING, ERROR
     * @param string $endpoint Endpoint identifier (e.g., "POST", "GET")
     * @param string $message Human-readable message describing the event
     * @param array $context Additional context data (will be JSON-encoded)
     */
    private static function log(string $level, string $endpoint, string $message, array $context = []): void
    {
        StructuredLogger::log(
            self::LOG_PREFIX,
            $level,
            $endpoint,
            $message,
            $context,
            'tender_insights.debug'
        );
    }

    /**
     * Resolve the enquiry document for tender insights analysis
     *
     * Resolution strategy:
     * 1. Primary: Look up document in package.Enquiry[account_id].history[latest].meta.document
     * 2. Fallback: Query tender/history API for Enquiry type entries
     *
     * @param string $packageKey Where to read package data from
     * @param string $accountIdKey Where to read account ID from
     * @param string $saveKey Where to store result
     * @param bool $returnIdOnly If true, only store document ID string (for GET endpoint)
     * @return \Closure
     */
    public static function resolveEnquiryDocument(
        string $packageKey = "package",
        string $accountIdKey = "account.id",
        string $saveKey = "tender_insights_doc",
        bool $returnIdOnly = false
    ): \Closure {
        return function (Shape $action) use ($packageKey, $accountIdKey, $saveKey, $returnIdOnly) {
            $sid = $action->int($accountIdKey);
            $package = $action->get($packageKey);
            $tenderId = $package->get("id");

            self::log("INFO", $returnIdOnly ? self::ENDPOINT_GET : self::ENDPOINT_POST, "start", [
                "tender_id" => $tenderId,
                "account_id" => $sid
            ]);

            $enquiries = (array)($package->get("Enquiry") ?? []);

            // 1) Try primary source: package.Enquiry[account_id]
            $result = self::resolveFromEnquiryData($enquiries[$sid] ?? null, $sid, $tenderId, $returnIdOnly);

            if ($result) {
                self::log("INFO", $returnIdOnly ? self::ENDPOINT_GET : self::ENDPOINT_POST, "primary source success", [
                    "sid" => $sid,
                    "doc_id" => $returnIdOnly ? $result : $result->get('id')
                ]);
            }

            // 2) Fallback: fetch tender history and parse Enquiry
            if (!$result) {
                $result = self::resolveFromHistory($package, $sid, $returnIdOnly);
                if ($result) {
                    self::log("INFO", $returnIdOnly ? self::ENDPOINT_GET : self::ENDPOINT_POST, "history fallback success", [
                        "sid" => $sid,
                        "doc_id" => $returnIdOnly ? $result : $result->get('id')
                    ]);
                }
            }

            // 3) Fallback: reuse package history (same approach as /relay/v1/enquiries/latest)
            if (!$result) {
                $result = self::resolveFromCollection($tenderId, $sid, $returnIdOnly, $package);
                if ($result) {
                    self::log("INFO", $returnIdOnly ? self::ENDPOINT_GET : self::ENDPOINT_POST, "collection fallback success", [
                        "sid" => $sid,
                        "doc_id" => $returnIdOnly ? $result : $result->get('id')
                    ]);
                }
            }
            if (!$result) {
                $noDocMsg = "Tender Insights could not find a tender document (checked package, tender history, package history).";
                self::log("WARNING", $returnIdOnly ? self::ENDPOINT_GET : self::ENDPOINT_POST, "no document found", [
                    "tender_id" => $tenderId,
                    "sid" => $sid
                ]);
                throw new MiddlewareException(
                    "noEntityFound",
                    $noDocMsg
                );
            }

            $action->set($saveKey, $result);

            self::log("INFO", $returnIdOnly ? self::ENDPOINT_GET : self::ENDPOINT_POST, "resolved doc", [
                "doc_id" => $returnIdOnly ? $result : $result->get('id')
            ]);
        };
    }

    /**
     * Extract document from enquiry package data (primary resolution strategy)
     *
     * @param array|null $enquiryData Enquiry data from package.Enquiry[account_id]
     * @param int $sid Subcontractor/account ID to look up
     * @param int $tenderId Tender ID to look up
     * @param bool $returnIdOnly If true, return just ID string
     * @return Shape|string|null
     */
    public static function resolveFromEnquiryData($enquiryData, int $sid, int $tenderId, bool $returnIdOnly): mixed
    {
        if (!$enquiryData || empty($enquiryData["history"])) {
            return null;
        }

        $history = $enquiryData["history"];

        $count = 1;
        $resolved = [];
        foreach ($history as $i => $item) {
            $meta = $item['meta'];
            if (is_string($meta)) {
                $meta = json_decode($meta, true) ?: [];
            }
            if (!is_array($meta)) {
                return null;
            }

            $doc = $meta["document"] ?? [];

            // Try to find doc for specific subcontractor, or fall back to single entry
            if (is_array($doc) && isset($doc[$sid])) {
                $doc = $doc[$sid];
            } elseif (is_array($doc) && count($doc) === 1) {
                $doc = reset($doc);
            }

            if (!is_array($doc) || empty($doc["id"])) {
                continue;
            }

            $isAddendum = isset($doc['is_tender_addendum']) && $doc['is_tender_addendum'] === true;
            $key = $isAddendum ? self::DOC_TYPE_ADDENDUM : self::DOC_TYPE_MAIN;

            $value = $returnIdOnly ? $doc['id'] : new Shape([
                "id" => $doc["id"],
                "name" => $doc["name"] ?? ($isAddendum ? "tender-addendum-document_$count.pdf" : "tender-document.pdf"),
                "tender_id" => $tenderId,
                "subcontractor_id" => $sid,
                "version" => count($history),
            ]);

            if ($isAddendum) {
                $resolved[$key][] = $value;
            } else {
                $resolved[$key] = $value;
            }

            if ($isAddendum) {
                $count++;
            }
        }

        if (count($resolved)) {
            return new Shape($resolved);
        }

        return null;
    }

    /**
     * Fallback: build document from tender collection data (same approach as relay /enquiries/latest)
     *
     * @param int $tenderId
     * @param int $sid
     * @param bool $returnIdOnly
     * @return Shape|string|null
     */
    private static function resolveFromCollection(int $tenderId, int $sid, bool $returnIdOnly, ?Shape $package): mixed
    {
        try {
            if (!($package instanceof Shape)) {
                return null;
            }

            $tender = $package->get();
            $enquiryData = $tender['Enquiry'][$sid] ?? null;
            $resolved = self::resolveFromEnquiryData($enquiryData, $sid, $tenderId, $returnIdOnly);
            if ($resolved) {
                return $resolved;
            }

            // manual history walk like relay/latest
            $history = $enquiryData['history'] ?? [];
            // Iterate newest-first to match "latest" behaviour
            $count = 1;
            $resolved = [];
            foreach (array_reverse($history) as $entry) {
                if (!is_array($entry)) {
                    continue;
                }
                $meta = $entry["meta"] ?? null;
                if (!$meta) {
                    continue;
                }
                if (is_string($meta)) {
                    $meta = json_decode($meta, true) ?: [];
                }
                if (!is_array($meta)) {
                    continue;
                }

                $docModel = new DocumentModel($meta["document"] ?? [], $sid);
                if ($docModel->getID()) {
                    $docMeta = $meta["document"] ?? [];
                    // pick sid-specific doc array if present
                    if (is_array($docMeta) && isset($docMeta[$sid])) {
                        $docMeta = $docMeta[$sid];
                    }

                    $isAddendum = isset($docMeta['is_tender_addendum']) && $docMeta['is_tender_addendum'] === true;
                    $key = $isAddendum ? self::DOC_TYPE_ADDENDUM : self::DOC_TYPE_MAIN;
                    $name = is_array($docMeta) && isset($docMeta["name"]) ? $docMeta["name"] : ($isAddendum ? "tender-addendum-document_$count.pdf" : "tender-document.pdf");

                    $value = $returnIdOnly ? $docMeta['id'] : new Shape([
                        "id" => $docMeta['id'],
                        "name" => $name,
                        "tender_id" => $tenderId,
                        "subcontractor_id" => $sid,
                        "version" => count($history),
                    ]);

                    if ($isAddendum) {
                        $resolved[$key][] = $value;
                    } else {
                        $resolved[$key] = $value;
                    }

                    if ($isAddendum) {
                        $count++;
                    }
                }
            }

            if (count($resolved)) {
                return new Shape($resolved);
            }

            return null;
        } catch (\Exception $e) {
            self::log("ERROR", "collection", "collection fallback failed", [
                "tender_id" => $tenderId,
                "sid" => $sid,
                "error" => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Fetch document from tender history API (fallback resolution strategy)
     *
     * @param Shape $package Package/tender object containing tender ID
     * @param int $sid Subcontractor/account ID to filter by
     * @param bool $returnIdOnly If true, return just ID string
     * @return Shape|string|null
     */
    public static function resolveFromHistory(Shape $package, int $sid, bool $returnIdOnly): mixed
    {
        try {
            $tid = $package->get("id");
            $historyRes = Manager::getService("project")->fetch(
                "tender/history",
                ["tender_id" => $tid]
            )->getCollection("data");

            // Filter by specialist_id == $sid and type Enquiry
            $entries = $historyRes->filter(function ($item) use ($sid) {
                $isEnquiry = strtolower(strval($item->get("tender_history_type"))) === "enquiry";
                $meta = $item->get("meta");

                if (is_string($meta)) {
                    $meta = json_decode($meta, true) ?: [];
                }

                if (!$isEnquiry || empty($meta)) {
                    return false;
                }

                return intval($item->get("specialist_id")) === $sid;
            });

            if (!$entries->count()) {
                return null;
            }

            $count = 1;
            $resolved = [];
            foreach ($entries as $item) {
                $meta = $item->get("meta");
                if (is_string($meta)) {
                    $meta = json_decode($meta, true) ?: [];
                }

                if (!is_array($meta)) {
                    return null;
                }

                $doc = $meta["document"] ?? [];

                // Try to find doc for specific subcontractor, or fall back to single entry
                if (is_array($doc) && isset($doc[$sid])) {
                    $doc = $doc[$sid];
                } elseif (is_array($doc) && count($doc) === 1) {
                    $doc = reset($doc);
                }

                if (!is_array($doc) || empty($doc["id"])) {
                    return null;
                }

                $isAddendum = isset($doc['is_tender_addendum']) && $doc['is_tender_addendum'] === true;
                $key = $isAddendum ? self::DOC_TYPE_ADDENDUM : self::DOC_TYPE_MAIN;

                $value = $returnIdOnly ? $doc['id'] : new Shape([
                    "id" => $doc["id"],
                    "name" => $doc["name"] ?? ($isAddendum ? "tender-addendum-document_$count.pdf" : "tender-document.pdf"),
                    "tender_id" => $tid,
                    "subcontractor_id" => $sid,
                    "version" => $entries->count(),
                ]);

                if ($isAddendum) {
                    $resolved[$key][] = $value;
                } else {
                    $resolved[$key] = $value;
                }

                if ($isAddendum) {
                    $count++;
                }
            }

            if (count($resolved)) {
                return new Shape($resolved);
            }

            return null;
        } catch (\Exception $e) {
            self::log("ERROR", "history", "history fetch failed", [
                "tender_id" => $package->get('id'),
                "sid" => $sid,
                "error" => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Download the document to a temp file for QSAI upload
     *
     * Fetches document metadata, verifies ownership, and downloads from S3.
     *
     * @param string $docKey Key where document shape is stored
     * @return \Closure
     */
    public static function downloadDocumentToTemp(string $docKey = "tender_insights_doc"): \Closure
    {
        return function (Shape $action) use ($docKey) {
            $doc = $action->getShape($docKey);
            $accountId = $action->int("account.id");
            $tmpArr = [];

            try {
                $ids = [$doc->get("main.id")];

                if ($doc->has('addendum')) {
                    array_map(function ($d) use (&$ids) {
                        $ids[] = $d->get('id');
                    }, $doc->toArray()['addendum']);
                }

                // Fetch document metadata from document service
                // Note: ids must be passed as ids[] array params in the query string.
                // The framework's Outgoing layer strips non-scalar values via is_scalar(),
                // so we build the query string manually and append it to the path.
                $idsQuery = http_build_query(["ids" => $ids]);
                $documents = Manager::getService("document")
                    ->fetch("document?" . $idsQuery)
                    ->getCollection("data");

                if ($documents->count() === 0) {
                    self::log("ERROR", self::ENDPOINT_POST, "document not found in service", [
                        "doc_id" => $doc->get("id")
                    ]);
                    throw new MiddlewareException(
                        "noEntityFound",
                        "Document not found. The requested document may have been deleted."
                    );
                }

                $documents = $documents->getItemsAsArray();
                $docArr = $doc->toArray();

                // Verify ownership
                foreach ($documents as $i => $document) {
                    $document = new Shape($document);
                    $tmp = tempnam(sys_get_temp_dir(), "ti_");

                    self::verifyOwnership($document, $accountId, self::ENDPOINT_POST);

                    self::log("DEBUG", self::ENDPOINT_POST, "doc meta fetched", [
                        "doc_id" => $document->get('id'),
                        "type" => $document->get('type'),
                        "bucket" => $document->get('s3_bucket'),
                        "key" => $document->get('s3_key')
                    ]);

                    // Determine bucket alias (matches DocumentMiddleware pattern)
                    $bucketAlias = ($document->int("type") === DocumentMiddleware::CONTRACTUAL_DOCUMENT_TYPE_ID)
                        ? 'pdf'
                        : 'asset';

                    // Download from S3
                    $res = Manager::getService("s3")->save($bucketAlias, $document->get("s3_key"), $tmp);
                    if ($res === false) {
                        self::log("ERROR", self::ENDPOINT_POST, "s3 download failed", [
                            "doc_id" => $document->get('id'),
                            "bucket" => $bucketAlias,
                            "s3_key" => $document->get("s3_key")
                        ]);
                        throw new MiddlewareException(
                            "tenderInsightsServiceError",
                            "Unable to retrieve document for analysis. Please try again."
                        );
                    }

                    self::log("INFO", self::ENDPOINT_POST, "s3 download ok", [
                        "bucket" => $bucketAlias,
                        "key" => $document->get('s3_key')
                    ]);

                    $tmpArr[$document->get('id')] = [
                        "id" => $document->get('id'),
                        "tmp_path" => $tmp,
                        "url" => Config::get("relay.app_prosper", "#") . "/document/" . $document->get('id') . "/download?inline=true",
                    ];
                }

                $doc->get('main')->set('main_doc', $tmpArr[$doc->get('main.id')]);

                if (isset($docArr['addendum'])) {
                    array_map(function ($d) use ($tmpArr) {
                        if (isset($tmpArr[$d->get('id')])) {
                            $d->set('addendum_doc', $tmpArr[$d->get('id')]);
                        }

                        return $d;
                    }, array_values($docArr['addendum'] ?: []));
                }
            } catch (MiddlewareException $e) {
                // Clean up temp file on error
                self::cleanTempFiles($tmpArr);

                throw $e;
            } catch (\Exception $e) {
                // Clean up temp file on error
                self::cleanTempFiles($tmpArr);

                self::log("ERROR", self::ENDPOINT_POST, "download failed", ["error" => $e->getMessage()]);
                throw new MiddlewareException("tenderInsightsServiceError", "Failed to prepare document for analysis.");
            }
        };
    }

    /**
     * Resolve the MIME type for a QSAI upload from the document file name
     *
     * Falls back to application/pdf for unknown extensions to preserve
     * the previous behaviour.
     *
     * @param string|null $name Document file name
     * @return string
     */
    private static function mimeTypeFromName(?string $name): string
    {
        $ext = strtolower(pathinfo((string)$name, PATHINFO_EXTENSION));

        return self::QSAI_SUPPORTED_MIME_TYPES[$ext] ?? 'application/pdf';
    }

    /**
     * Remove any temporary file if any exception is thrown
     *
     * @param array $tempFiles Array of file paths on temp location
     */

    private static function cleanTempFiles(array $tempFiles) {
        foreach ($tempFiles as $tempFile) {
            if (file_exists($tempFile['tmp_path'])) {
                @unlink($tempFile['tmp_path']);
            }
        }
    }

    /**
     * Verify document ownership for current user
     *
     * @param Shape $document Document object with owners array
     * @param int $accountId Current user's account ID
     * @param string $endpoint Endpoint identifier for logging
     * @throws MiddlewareException If ownership denied
     */
    public static function verifyOwnership(Shape $document, int $accountId, string $endpoint): void
    {
        $owners = $document->get("owner") ?? [];
        $allowed = false;

        self::log("DEBUG", $endpoint, "ownership check", [
            "account_id" => $accountId,
            "document_id" => $document->get('id'),
            "owner_count" => count((array)$owners)
        ]);

        foreach ((array)$owners as $owner) {
            if ((int)($owner["owner_id"] ?? 0) === $accountId) {
                $allowed = true;
                self::log("INFO", $endpoint, "ownership check passed", ["owner_id" => $owner["owner_id"]]);
                break;
            }
        }

        if (!$allowed) {
            self::log("WARNING", $endpoint, "ownership check DENIED", [
                "account_id" => $accountId,
                "document_id" => $document->get('id')
            ]);
            throw new MiddlewareException(
                "documentOwnershipError",
                "Access denied. You do not have permission to access this document."
            );
        }
    }

    /**
     * Verify document access for GET endpoint
     *
     * Fetches document metadata and verifies ownership before allowing
     * access to analysis results.
     *
     * @param string $docIdKey Key where document ID is stored
     * @param string $accountIdKey Key where account ID is stored
     * @return \Closure
     */
    public static function verifyDocumentAccess(
        string $docIdKey = "tender_insights_doc_id",
        string $accountIdKey = "account.id"
    ): \Closure {
        return function (Shape $action) use ($docIdKey, $accountIdKey) {
            $docId = $action->get($docIdKey)->get('main');
            $accountId = $action->int($accountIdKey);

            self::log("DEBUG", self::ENDPOINT_GET, "verifying document access", [
                "doc_id" => $docId,
                "account_id" => $accountId
            ]);

            // Fetch document metadata from document service
            $document = Manager::getService("document")
                ->fetch("document", ["id" => $docId])
                ->getCollection("data")
                ->first();

            if (!$document) {
                self::log("ERROR", self::ENDPOINT_GET, "document does not exist in document service", [
                    "doc_id" => $docId,
                    "account_id" => $accountId
                ]);
                throw new MiddlewareException(
                    "noEntityFound",
                    "Document not found. The document may have been deleted."
                );
            }

            // Verify ownership
            self::verifyOwnership($document, $accountId, self::ENDPOINT_GET);

            self::log("INFO", self::ENDPOINT_GET, "document access verified", [
                "doc_id" => $docId,
                "account_id" => $accountId
            ]);
        };
    }

    /**
     * Relay document to QSAI for analysis (POST endpoint)
     *
     * Uploads the document to QSAI and returns the response.
     *
     * @param string $docKey Key where document shape is stored
     * @return \Closure
     */
    public static function relayToQsai(string $docKey = "tender_insights_doc"): \Closure
    {
        return function (Shape $action) use ($docKey) {
            $doc = $action->getShape($docKey);
            $timeout = Config::get('qsai.timeout', self::QSAI_DEFAULT_TIMEOUT);

            $main = $doc->get('main');

            $metadata = [
                "external_id_type" => "document_id",
                "enquiry_id" => $action->int("uriArgs.enquiry_id"),
                "document_id" => $main->get("id"),
                "tender_id" => $main->get("tender_id"),
                "subcontractor_id" => $main->get("subcontractor_id"),
                "filename" => $main->get("name"),
                "version" => $main->get("version"),
            ];

            $data = [
                "file" => new \CURLFile(
                    $main->get('main_doc.tmp_path'),
                    self::mimeTypeFromName($main->get("name")),
                    $main->get("name")
                ),
                "file_id" => $main->get("main_doc.id"),
                "file_url" => $main->get("main_doc.url"),
            ];

            if ($doc->has("addendum")) {
                foreach ($doc->get("addendum") as $index => $d) {
                    $data["addendums[$index]"] = new \CURLFile(
                        $d->get("addendum_doc.tmp_path"),
                        self::mimeTypeFromName($d->get("name")),
                        $d->get("name")
                    );

                    $data["addendum_id[$index]"] = (int) $d->get("addendum_doc.id");
                    $data["addendum_url[$index]"] = $d->get("addendum_doc.url");
                }
            }

            $data['external_id'] = $main->get("id");
            $data['external_metadata'] = json_encode($metadata);

            try {
                $res = Manager::getService("qsai")
                    ->write("/api/tender-insights", new Shape([
                        "data" => $data,
                        "headers" => [
                            "Content-Type" => "multipart/form-data"
                        ],
                        "options" => [
                            CURLOPT_TIMEOUT => $timeout
                        ]
                    ]));

                $code = $res->get("info.http_code");
                if (!in_array($code, [200, 202], true)) {
                    self::log("ERROR", self::ENDPOINT_POST, "qsai non-200 response", [
                        "http_code" => $code,
                        "body" => $res->get('content')
                    ]);

                    if ($code === 0) {
                        throw new MiddlewareException(
                            "qsaiNotFoundError",
                            "We couldn’t complete the AI analysis. Something went wrong on our side while processing your request. \nPlease try running the analysis again. If this keeps happening, please contact support and mention this error."
                        );
                    }

                    $action->setItems([
                        "code" => $code,
                        "response" => $res
                    ]);

                    throw new MiddlewareException("error");
                }

                $content = $res->get("content");
                $decoded = json_decode($content, true);
                if (is_array($decoded)) {
                    $decoded["qsai_external_id"] = $doc->get("main")->get("id");
                    $action->set("json", json_encode($decoded));
                } else {
                    $action->set("json", $content);
                }

                self::log("INFO", self::ENDPOINT_POST, "success", [
                    "doc_id" => $doc->get('id'),
                    "http_code" => $code
                ]);

            } finally {
                // Clean up temp file
                $tmpPath = $doc->get("tmp_path");
                if (is_string($tmpPath) && file_exists($tmpPath)) {
                    @unlink($tmpPath);
                }
            }
        };
    }

    /**
     * Fetch analysis status from QSAI (GET endpoint)
     *
     * Polls QSAI for the analysis status of a document.
     *
     * @param string $docIdKey Key where document ID is stored
     * @return \Closure
     */
    public static function fetchFromQsai(string $docIdKey = "tender_insights_doc_id"): \Closure
    {
        return function (Shape $action) use ($docIdKey) {
            $docId = $action->get($docIdKey)->get('main');

            try {
                $res = Manager::getService("qsai")
                    ->fetch("/api/tender-insights/" . $docId);

                $action->set("json", $res->get("content"));

            } catch (RestException $e) {
                self::log("ERROR", self::ENDPOINT_GET, "qsai error", [
                    "code" => $e->getCode(),
                    "message" => $e->getMessage()
                ]);
                $action->setItems([
                    "code" => $e->getCode() ?: 500,
                    "response" => new Shape([
                        "content" => $e->getMessage(),
                        "info" => ["http_code" => $e->getCode() ?: 500]
                    ])
                ]);
                throw new MiddlewareException("error");
            }
        };
    }
}
