<?php

use Core\Data\Shape;
use Core\Layer\Http\Code;
use Core\Middleware\Generic;
use Core\Router\Route\Helper;
use Core\Service\Manager as ServiceManager;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Exception as MiddlewareException;

use Api\Middleware\ProjectMiddleware;
use Api\Middleware\TenderMiddleware;
use Api\Middleware\QsaiMiddleware;
use Api\Middleware\Relay\BoqMiddleware;
use Api\Middleware\Relay\ProjectPlanMiddleware;
use Api\Middleware\TenderInsightsMiddleware;
use Core\Config;

const QSAI_ANALYSIS_ENDPOINT = '/api/clink_analysis';

return Helper::getTemplate(
    "api",
    // Actions
    [
        // === Tender Insights Routes ===

        // POST - Submit document for AI analysis
        [
            "id" => "tender-insights-post",
            "key" => "^tender-insights\/(?<enquiry_id>[0-9]+)$",
            "method" => "POST",
            "description" => "Submit tender document for AI analysis",
            "middleware" => [
                TenderMiddleware::fetchPackage("uriArgs.enquiry_id"),
                TenderInsightsMiddleware::resolveEnquiryDocument(),
                TenderInsightsMiddleware::downloadDocumentToTemp(),
                TenderInsightsMiddleware::relayToQsai(),
            ]
        ],

        // GET - Poll analysis status
        [
            "id" => "tender-insights-get",
            "key" => "^tender-insights\/(?<enquiry_id>[0-9]+)$",
            "method" => "GET",
            "description" => "Get tender document analysis status",
            "middleware" => [
                TenderMiddleware::fetchPackage("uriArgs.enquiry_id"),
                TenderInsightsMiddleware::resolveEnquiryDocument(
                    "package",
                    "account.id",
                    "tender_insights_doc_id",
                    true  // returnIdOnly = true for GET endpoint
                ),
                TenderInsightsMiddleware::verifyDocumentAccess(),
                TenderInsightsMiddleware::fetchFromQsai(),
            ]
        ],

        // === Quote Analysis Routes ===

        // GET - Initiate quote analysis
        [
            "id" => "quote-analysis-initiate-get",
            "key" => "^quote_analysis\/initiate\/(?<package_id>[0-9-]+)",
            "method" => "GET",
            "description" => "Get quote analysis status",
            "middleware" => [
                TenderMiddleware::fetchPackage("uriArgs.package_id"),
                ProjectMiddleware::checkProjectAccessById("package.project.group_id"),
                function ($a) {
                    try {
                        $args = $a->getRoute()->getRequest()->getArgs();
                    // Relay request to QSAI
                        $res = ServiceManager::getService("qsai")
                            ->fetch(QSAI_ANALYSIS_ENDPOINT . "/" . $a->get("package.id") . "/" . $args->get('type', "tender_analysis"));

                        // Store response for error handler
                        $a->set("qsai_response", $res);

                        // Handle QSAI response (always returns 200, check status field)
                        QsaiMiddleware::handleTenderAnalysisGetResponse($res, $a);
                    } catch (MiddlewareException $e) {
                        throw $e;
                    } catch (\Exception $e) {
                        QsaiMiddleware::handleRelayException($e, $a, "quote-analysis-initiate-get");
                    }
                },
            ]
        ],

        // GET - Export quote analysis
        [
            "id" => "quote-analysis-export",
            "key" => "^quote_analysis\/export\/(?<package_id>[0-9-]+)\/(?<format_type>[a-z]+)",
            "method" => "GET",
            "description" => "Export quote analysis in specified format",
            "middleware" => [
                TenderMiddleware::fetchPackage("uriArgs.package_id"),
                ProjectMiddleware::checkProjectAccessById("package.project.group_id"),
                function ($a) {
                    try {
                        $package_id = $a->get("package.id");
                        $args = $a->getRoute()->getRequest()->getArgs();

                        $res = ServiceManager::getService("qsai")
                            ->makeRequest(QSAI_ANALYSIS_ENDPOINT . "/{$package_id}/" . $args->get('type', "tender_analysis") . "/export")
                            ->setOptions([CURLOPT_HEADER => true])
                            ->getResponse();

                        $raw        = $res->get("content");
                        $headerSize = $res->get("info.header_size");
                        $rawHeaders = substr($raw, 0, $headerSize);
                        $body       = substr($raw, $headerSize);

                        // Forward upstream headers (Content-Type, Content-Disposition, etc.)
                        foreach (explode("\r\n", trim($rawHeaders)) as $line) {
                            if (!str_contains($line, ':')) {
                                continue;
                            }
                            [$name, $value] = explode(':', $line, 2);
                            if (in_array(strtolower(trim($name)), ['content-type', 'content-disposition'], true)) {
                                header(trim($name) . ': ' . trim($value));
                            }
                        }

                        // Allow the cross-origin browser fetch to read the download filename.
                        // Without this, Content-Disposition is on the wire but unreadable from JS.
                        header('Access-Control-Expose-Headers: Content-Disposition');

                        // ↓ This is the key line — replace combined content with just the body
                        $res->set("content", $body);

                        // Store response for error handler
                        $a->set("qsai_response", $body);

                        // Handle QSAI response (expects file content on 200)
                        QsaiMiddleware::handleTenderAnalysisExportResponse($res, $a);
                    } catch (MiddlewareException $e) {
                        throw $e;
                    } catch (\Exception $e) {
                        QsaiMiddleware::handleRelayException($e, $a, "quote-analysis-export");
                    }
                },
                Generic::set("json", function ($action) {
                    return $action->get("content");
                }),
            ]
        ],

        // PATCH - Initiate quote analysis with data
        [
            "id" => "quote-analysis-initiate-patch",
            "key" => "^quote_analysis\/initiate\/(?<package_id>[0-9-]+)",
            "method" => "PATCH",
            "description" => "Initiate quote analysis with tender and quote data",
            "middleware" => [
                AccountMiddleware::loadTrades(),
                TenderMiddleware::fetchTenderWithQuoteFiles("uriArgs.package_id"),
                // Map the Package trades to labels
                function ($a) {
                    $a->modify("package", function ($package) use ($a) {
                        $package->updateCollection("packages", function ($p) use ($a) {
                            return $a->getCollection("trades")
                                ->filterByField("id", (int)$p->int("package_id"), cast: "int")
                                ->first();
                        });
                        return $package;
                    });
                },
                ProjectMiddleware::checkProjectAccessById("package.project.group_id"),
                AccountMiddleware::loadAccountsByIdArray("sids", key: "subcontractors"),
                function ($a) {
                    try {
                        $args = $a->getRoute()->getRequest()->getArgs();
                        $reset = $args->get("reset", false);
                        $analysisType = $args->get('type', "tender_analysis");
                        $url = QSAI_ANALYSIS_ENDPOINT . "?reset={$reset}";
                        $timeout = Config::get('qsai.timeout', TenderInsightsMiddleware::QSAI_DEFAULT_TIMEOUT);

                        $payload = QsaiMiddleware::buildQuoteAnalysisPayload($a, $analysisType);

                        $res = ServiceManager::getService("qsai")
                            ->write($url, new Shape([
                                "data" => $payload,
                                "headers" => [
                                    "Content-Type" => "multipart/form-data"
                                ],
                                "options" => [
                                    CURLOPT_TIMEOUT => $timeout
                                ]
                            ]));

                        // Store response for error handler
                        $a->set("qsai_response", $res);

                        // Handle QSAI response (expects 202, handles all error types)
                        QsaiMiddleware::handleTenderAnalysisPostResponse($res, $a);
                    } catch (MiddlewareException $e) {
                        throw $e;
                    } catch (\Exception $e) {
                        QsaiMiddleware::handleRelayException($e, $a, "quote-analysis-initiate-patch");
                    }
                }
            ]
        ],

        // === Historical Analyses Routes ===

        // GET - List historical quote analyses for a package (paginated)
        [
            "id" => "quote-analyses-list",
            "key" => "^analyses\/(?<package_id>[0-9-]+)$",
            "method" => "GET",
            "description" => "List historical quote analyses for a package (paginated)",
            "middleware" => [
                TenderMiddleware::fetchPackage("uriArgs.package_id"),
                ProjectMiddleware::checkProjectAccessById("package.project.group_id"),
                function ($a) {
                    try {
                        $args      = $a->getRoute()->getRequest()->getArgs();
                        $packageId = $a->get("package.id");

                        // Allowlist pass-through; QSAI owns defaults + validation.
                        $qsaiParams = array_filter([
                            "analysis_type" => $args->get("analysis_type"),
                            "page"          => $args->get("page"),
                            "per_page"      => $args->get("per_page"),
                        ], fn($v) => $v !== null && $v !== "");

                        $url = QSAI_ANALYSIS_ENDPOINT . "/{$packageId}"
                            . ($qsaiParams ? "?" . http_build_query($qsaiParams) : "");

                        $res = ServiceManager::getService("qsai")->fetch($url);

                        $a->set("qsai_response", $res);

                        QsaiMiddleware::handleTenderAnalysisGetResponse($res, $a);
                    } catch (MiddlewareException $e) {
                        throw $e;
                    } catch (\Exception $e) {
                        QsaiMiddleware::handleRelayException($e, $a, "quote-analyses-list");
                    }
                },
            ]
        ],

        // GET - Fetch a specific historical quote analysis (JSON)
        [
            "id" => "quote-analysis-detail",
            "key" => "^analyses\/(?<package_id>[0-9-]+)\/(?<analysis_type>[a-z_]+)\/(?<analysis_id>[0-9]+)$",
            "method" => "GET",
            "description" => "Get a specific historical quote analysis by id",
            "middleware" => [
                TenderMiddleware::fetchPackage("uriArgs.package_id"),
                ProjectMiddleware::checkProjectAccessById("package.project.group_id"),
                function ($a) {
                    try {
                        $packageId    = $a->get("package.id");
                        $analysisType = $a->get("uriArgs.analysis_type");
                        $analysisId   = $a->get("uriArgs.analysis_id");

                        $url = QSAI_ANALYSIS_ENDPOINT . "/{$packageId}/{$analysisType}/{$analysisId}";

                        $res = ServiceManager::getService("qsai")->fetch($url);

                        $a->set("qsai_response", $res);

                        QsaiMiddleware::handleTenderAnalysisGetResponse($res, $a);
                    } catch (MiddlewareException $e) {
                        throw $e;
                    } catch (\Exception $e) {
                        QsaiMiddleware::handleRelayException($e, $a, "quote-analysis-detail");
                    }
                },
            ]
        ],

        // GET - Export a specific historical quote analysis (binary)
        [
            "id" => "quote-analysis-detail-export",
            "key" => "^analyses\/(?<package_id>[0-9-]+)\/(?<analysis_type>[a-z_]+)\/(?<analysis_id>[0-9]+)\/export$",
            "method" => "GET",
            "description" => "Export a specific historical quote analysis",
            "middleware" => [
                TenderMiddleware::fetchPackage("uriArgs.package_id"),
                ProjectMiddleware::checkProjectAccessById("package.project.group_id"),
                function ($a) {
                    try {
                        $packageId    = $a->get("package.id");
                        $analysisType = $a->get("uriArgs.analysis_type");
                        $analysisId   = $a->get("uriArgs.analysis_id");

                        $url = QSAI_ANALYSIS_ENDPOINT . "/{$packageId}/{$analysisType}/{$analysisId}/export";

                        $res = ServiceManager::getService("qsai")
                            ->makeRequest($url)
                            ->setOptions([CURLOPT_HEADER => true])
                            ->getResponse();

                        $raw        = $res->get("content");
                        $headerSize = $res->get("info.header_size");
                        $rawHeaders = substr($raw, 0, $headerSize);
                        $body       = substr($raw, $headerSize);

                        // Forward upstream headers (Content-Type, Content-Disposition, etc.)
                        foreach (explode("\r\n", trim($rawHeaders)) as $line) {
                            if (!str_contains($line, ':')) {
                                continue;
                            }
                            [$name, $value] = explode(':', $line, 2);
                            if (in_array(strtolower(trim($name)), ['content-type', 'content-disposition'], true)) {
                                header(trim($name) . ': ' . trim($value));
                            }
                        }

                        // Allow the cross-origin browser fetch to read the download filename.
                        header('Access-Control-Expose-Headers: Content-Disposition');

                        // Replace combined content with just the body
                        $res->set("content", $body);

                        $a->set("qsai_response", $body);

                        QsaiMiddleware::handleTenderAnalysisExportResponse($res, $a);
                    } catch (MiddlewareException $e) {
                        throw $e;
                    } catch (\Exception $e) {
                        QsaiMiddleware::handleRelayException($e, $a, "quote-analysis-detail-export");
                    }
                },
                Generic::set("json", function ($action) {
                    return $action->get("content");
                }),
            ]
        ],

        // === Plan My Project Routes (AI2-516) ===
        // BoQ/pricing spreadsheets in → suggested package names + trades per
        // tab out. "Plan My Project" is the FE assistant these suggestions
        // serve; the QSAI side is /api/project-plan.

        // POST - Submit BoQ/pricing documents for package & trade suggestions
        [
            "id" => "project-plan-post",
            "key" => "^project-plan\/(?<project_id>[0-9]+)$",
            "method" => "POST",
            "description" => "Submit BoQ/pricing documents for package and trade suggestions",
            "middleware" => [
                ProjectMiddleware::fetchProject('id', 'uriArgs.project_id'),
                ProjectMiddleware::checkProjectAccessById('project.group_id'),
                ProjectPlanMiddleware::relayToQsai(),
            ]
        ],

        // GET - Poll package & trade suggestion status
        [
            "id" => "project-plan-get",
            "key" => "^project-plan\/(?<project_id>[0-9]+)$",
            "method" => "GET",
            "description" => "Get package and trade suggestions for a project",
            "middleware" => [
                ProjectMiddleware::fetchProject('id', 'uriArgs.project_id'),
                ProjectMiddleware::checkProjectAccessById('project.group_id'),
                ProjectPlanMiddleware::fetchFromQsai(),
            ]
        ],

        [
            "id" => "generate-boq-post",
            "key" => "^generate-boq\/(?<entity_id>[0-9]+)$",
            "method" => "POST",
            "description" => "Generate BOQ for tender",
            "middleware" => [
                BoqMiddleware::relayToQsai(),
            ]
        ],
        [
            "id" => "generate-boq-get",
            "key" => "^generate-boq\/(?<entity_id>[0-9]+)$",
            "method" => "GET",
            "description" => "Get generated BOQ for tender",
            "middleware" => [
                BoqMiddleware::fetchFromQsai(),
            ]
        ],
    ],
    // Additional error handlers
    [
        // QSAI-specific error handlers
        "qsaiValidationError" => function ($e, $a) {
            $qsaiResponse = $a->get("qsai_response", []);
            $formatted = QsaiMiddleware::formatStructuredError($qsaiResponse, $e->getMessage());
            $message = is_array($qsaiResponse) ? ($qsaiResponse["message"] ?? $e->getMessage()) : $e->getMessage();
            error_log("QSAI validation error: " . $message);
            $a->set("headers", ["HTTP/1.0 422" => "Unprocessable Entity"]);
            $a->set("json", json_encode($formatted));
        },
        "qsaiRateLimitError" => function ($e, $a) {
            $qsaiResponse = $a->get("qsai_response", []);
            $retryAfter = $a->get("retry_after", 300);
            $formatted = QsaiMiddleware::formatRateLimitError($qsaiResponse, $retryAfter);
            $message = is_array($qsaiResponse) ? ($qsaiResponse["message"] ?? $e->getMessage()) : $e->getMessage();
            error_log("QSAI rate limit error [retry_after={$retryAfter}]: " . $message);
            $a->set("headers", [
                "HTTP/1.0 429" => "Too Many Requests",
                "Retry-After" => (string)$retryAfter
            ]);
            $a->set("json", json_encode($formatted));
        },
        "qsaiBadRequestError" => function ($e, $a) {
            $qsaiResponse = $a->get("qsai_response", []);
            $formatted = QsaiMiddleware::formatStructuredError($qsaiResponse, $e->getMessage());
            $message = is_array($qsaiResponse) ? ($qsaiResponse["message"] ?? $e->getMessage()) : $e->getMessage();
            error_log("QSAI bad request error: " . $message);
            $a->set("headers", ["HTTP/1.0 400" => "Bad Request"]);
            $a->set("json", json_encode($formatted));
        },
        "qsaiConflictError" => function ($e, $a) {
            $qsaiResponse = $a->get("qsai_response", []);
            $message = is_array($qsaiResponse) ? ($qsaiResponse["message"] ?? $e->getMessage()) : $e->getMessage();
            error_log("QSAI conflict error: " . $message);
            $a->set("headers", ["HTTP/1.0 409" => "Conflict"]);
            $a->set("json", json_encode([
                "error" => [
                    "code"    => "CONFLICT",
                    "type"    => "conflict_error",
                    "message" => $message ?: "A conflict occurred",
                ]
            ]));
        },
        "qsaiNotFoundError" => function ($e, $a) {
            $qsaiResponse = $a->get("qsai_response", []);
            $formatted = QsaiMiddleware::formatStructuredError($qsaiResponse, $e->getMessage());
            $message = is_array($qsaiResponse) ? ($qsaiResponse["message"] ?? $e->getMessage()) : $e->getMessage();
            error_log("QSAI not found error: " . $message);
            $a->set("headers", ["HTTP/1.0 404" => "Not Found"]);
            $a->set("json", json_encode($formatted));
        },
        "qsaiServerError" => function ($e, $a) {
            $qsaiResponse = $a->get("qsai_response", []);
            $httpCode = $a->get("code") ?: 500;
            $rawResponse = $a->get("raw_response", "");
            $qsaiMessage = is_array($qsaiResponse) ? ($qsaiResponse["message"] ?? "") : "";
            $message = $qsaiMessage ?: ($e->getMessage() ?: "QSAI service error");
            $formatted = QsaiMiddleware::formatStructuredError($qsaiResponse, $e->getMessage());
            $statusText = Code::get($httpCode);
            error_log("QSAI server error [http_code={$httpCode}]: " . $message . " | raw: " . $rawResponse);
            ServiceManager::getService("sns")->sendException(
                "failed_document_process",
                "QSAI Server Error [{$httpCode}]",
                new Shape([
                    "environment" => Config::get("environment"),
                    "http_code" => $httpCode,
                    "message" => $message,
                ])
            );
            $a->set("headers", ["HTTP/1.0 {$httpCode}" => $statusText]);
            $a->set("json", json_encode($formatted));
        },

        // Legacy/existing error handlers
        "error" => function ($e, $a) {
            $code = $a->get("code") ?: 500;
            $content = $a->get("response")->get('content');
            $safeMessage = str_replace(["\r", "\n"], ' ', $e->getMessage());
            $a->set("headers", ["HTTP/1.0 " . $code => $safeMessage]);
            $a->set("json", json_encode(["error" => $content]));
        },
        "tenderNotFoundError" => Generic::exceptionResponse("HTTP/1.0 404", "No Package found"),
        "projectNotFoundError" => Generic::exceptionResponse("HTTP/1.0 404", "No Project found"),
        "documentOwnershipError" => Generic::exceptionResponse("HTTP/1.0 403", "Document Access Denied"),
        "projectOwnershipError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "tenderInsightsServiceError" => function (MiddlewareException $e, $a) {
            $message = $e->getMessage() ?: "Service Error";
            error_log("QSAI tender insights service error: " . $message);
            ServiceManager::getService("sns")->sendException(
                "failed_document_process",
                "QSAI Tender Insights Service Error [500]",
                new Shape(["environment" => Config::get("environment"), "http_code" => 500, "message" => $message])
            );
            $a->set("headers", ["HTTP/1.0 500" => "Internal Server Error"]);
            $a->set("json", json_encode([
                "error" => [
                    "code"    => "SERVICE_ERROR",
                    "type"    => "service_error",
                    "message" => $message,
                ]
            ]));
        },
        "documentError" => function ($e, $a) {
            $code = $a->get("code") ?: 400;
            $safeMessage = str_replace(["\r", "\n"], ' ', $e->getMessage());
            $a->set("headers", ["HTTP/1.0 " . $code => $safeMessage]);
            $a->set("json", json_encode(["error" => $safeMessage]));
        }
    ]
);
