<?php

namespace Api\Middleware;

use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;

/**
 * Middleware helpers for QSAI API integration
 *
 * Handles the various response formats and error types from the QSAI API
 * according to the QSAI error handling specification.
 */
class QsaiMiddleware
{
    const SERVICE_UNAVAILABLE_MSG = "We couldn’t complete the AI analysis. Something went wrong on our side while processing your request. \nPlease try running the analysis again. If this keeps happening, please contact support and mention this error.";

    /**
     * QSAI is unreachable (cURL failure, http_code 0) — log the transport error
     * server-side and surface only the user-facing service-unavailable message.
     *
     * @param Shape $response The response from the QSAI service
     * @param Shape $action The current action context
     * @param string $context Label for the server-side log entry
     * @throws MiddlewareException Always
     */
    private static function throwServiceUnavailable(Shape $response, Shape $action, string $context): void
    {
        $curlError = strval($response->get("error.message", ""));
        error_log("QSAI connection error ({$context}): " . ($curlError ?: "no cURL error message"));
        $action->setItems([
            "code" => 503,
            "qsai_response" => ["message" => self::SERVICE_UNAVAILABLE_MSG],
            "raw_response" => ""
        ]);
        throw new MiddlewareException("qsaiServerError", self::SERVICE_UNAVAILABLE_MSG);
    }

    /**
     * Normalise an unexpected relay exception (e.g. RestException from the
     * service layer) into a qsaiServerError with client-safe response data.
     *
     * RestException messages are JSON: {type, url, code, message} — on
     * connection failures "code" holds the cURL errno, not an HTTP status,
     * and "message" holds the raw cURL error text, which must not reach the
     * client. Anything outside the HTTP error range is reported as a 503.
     *
     * @param \Exception $e The caught exception
     * @param Shape $action The current action context
     * @param string $context Label for the server-side log entry
     * @throws MiddlewareException Always
     */
    public static function handleRelayException(\Exception $e, Shape $action, string $context): void
    {
        $raw = json_decode($e->getMessage(), true);
        $raw = is_array($raw) ? $raw : [];
        $rawMessage = $raw["message"] ?? "";
        $rawMessageStr = is_string($rawMessage) ? $rawMessage : strval(json_encode($rawMessage));

        $qsaiResponse = is_array($rawMessage)
            ? $rawMessage
            : json_decode($rawMessageStr, true);
        if (!is_array($qsaiResponse)) {
            $qsaiResponse = [];
        }
        // Guarantee a client-safe message on qsai_response for truly
        // unstructured failures (raw cURL text, plain-text bodies, empty
        // exceptions) so the downstream qsaiServerError handler's
        // formatStructuredError() can't fall back to $e->getMessage() and
        // leak transport-layer strings to the browser. Structured QSAI
        // errors — top-level "message", errors.system (which formats using
        // system.user_message), or errors.json — are left untouched so
        // formatStructuredError() can render them with their own semantics.
        if (!isset($qsaiResponse["message"])
            && !isset($qsaiResponse["errors"]["system"])
            && !isset($qsaiResponse["errors"]["json"])
        ) {
            $qsaiResponse["message"] = self::SERVICE_UNAVAILABLE_MSG;
        }

        $httpCode = intval($raw["code"] ?? 0);
        $code = ($httpCode >= 400 && $httpCode < 600) ? $httpCode : 503;

        error_log("QSAI {$context} error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());

        $action->setItems([
            "code" => $code,
            "qsai_response" => $qsaiResponse,
            "raw_response" => $rawMessageStr
        ]);

        throw new MiddlewareException("qsaiServerError", $rawMessageStr);
    }

    /**
     * Handle QSAI Tender Analysis POST response
     *
     * POST /api/tender_analysis_clink expects:
     * - 202 Accepted (success)
     * - 400 Bad Request (structured error)
     * - 422 Unprocessable Entity (validation errors)
     * - 429 Too Many Requests (rate limit)
     * - 409 Conflict
     * - 500 Internal Server Error
     *
     * @param Shape $response The response from the QSAI service
     * @param Shape $action The current action context
     * @throws MiddlewareException On any non-202 response
     */
    public static function handleTenderAnalysisPostResponse(Shape $response, Shape $action): void
    {
        $httpCode = $response->get("info.http_code");
        $content = $response->get("content");
        $decoded = is_string($content) ? (json_decode($content, true) ?? []) : [];

        // Success case: 202 Accepted
        if ($httpCode === 202) {
            $action->set("json", $content);
            return;
        }

        // Connection error — QSAI unreachable (cURL code 0)
        if ($httpCode === 0) {
            self::throwServiceUnavailable($response, $action, "tender analysis POST");
        }

        // Error cases - set up response data
        $action->setItems([
            "code" => $httpCode,
            "qsai_response" => $decoded,
            "raw_response" => $content
        ]);

        // Determine error type and throw appropriate exception
        switch ($httpCode) {
            case 422:
                // Validation error - errors.json contains field-level errors
                throw new MiddlewareException("qsaiValidationError");

            case 429:
                // Rate limit - includes retry_after_seconds
                $action->set("retry_after", $decoded["retry_after_seconds"] ?? 300);
                throw new MiddlewareException("qsaiRateLimitError");

            case 400:
                // Bad request - structured error with errors.system
                throw new MiddlewareException("qsaiBadRequestError");

            case 409:
                // Conflict
                throw new MiddlewareException("qsaiConflictError");

            case 404:
                // Not found
                throw new MiddlewareException("qsaiNotFoundError");

            case 500:
            default:
                // Server error or unknown
                $errorMessage = $decoded["message"] ?? $response->get("error.message", "");
                throw new MiddlewareException("qsaiServerError", $errorMessage);
        }
    }

    /**
     * Handle QSAI Tender Analysis GET response
     *
     * GET /api/tender_analysis_clink/{package_id} always returns 200 if package exists.
     * The actual status is in the response body's "status" field:
     * - PENDING: accepted, not started
     * - STARTED: processing
     * - SUCCESS: completed successfully
     * - FAILURE/UNPROCESSABLE: failed
     *
     * @param Shape $response The response from the QSAI service
     * @param Shape $action The current action context
     * @throws MiddlewareException On HTTP error or analysis failure
     */
    public static function handleTenderAnalysisGetResponse(Shape $response, Shape $action): void
    {
        $httpCode = $response->get("info.http_code");
        $content = $response->get("content");
        $decoded = is_string($content) ? json_decode($content, true) : null;

        // HTTP-level errors (0, 404, 500, etc.)
        if ($httpCode !== 200) {
            if ($httpCode === 0) {
                self::throwServiceUnavailable($response, $action, "tender analysis GET");
            }

            $action->setItems([
                "code" => $httpCode,
                "qsai_response" => $decoded ?? [],
                "raw_response" => $content
            ]);

            if ($httpCode === 404) {
                throw new MiddlewareException("qsaiNotFoundError");
            }

            $errorMessage = $decoded["message"] ?? $response->get("error.message", "");
            throw new MiddlewareException("qsaiServerError", $errorMessage);
        }

        // HTTP 200 with an empty or non-JSON body (e.g. QSAI/PHP died mid-response) —
        // don't pass the unparseable body through, surface the friendly error instead
        if (!is_array($decoded)) {
            error_log("QSAI tender analysis GET returned 200 with an empty/non-JSON body");
            $action->setItems([
                "code" => 503,
                "qsai_response" => ["message" => self::SERVICE_UNAVAILABLE_MSG],
                "raw_response" => strval($content)
            ]);
            throw new MiddlewareException("qsaiServerError", self::SERVICE_UNAVAILABLE_MSG);
        }

        // HTTP 200 - check analysis status in body
        $analysisStatus = $decoded["status"] ?? "UNKNOWN";

        // For non-SUCCESS statuses, include status in response
        if (!in_array($analysisStatus, ["SUCCESS"], true)) {
            // Return the response as-is for PENDING/STARTED (client will poll)
            // or for FAILURE/UNPROCESSABLE (client needs to know it failed)
            $action->set("json", $content);
            return;
        }

        // SUCCESS - return the full analysis
        $action->set("json", $content);
    }

    /**
     * Handle QSAI Tender Analysis Export response
     *
     * GET /api/tender_analysis_clink/{package_id}/export/{format} returns:
     * - 200 OK with file content (Content-Type: application/vnd.openxmlformats...)
     * - 400 Bad Request (unsupported format or data not ready)
     * - 404 Not Found
     * - 500 Internal Server Error
     *
     * @param Shape $response The response from the QSAI service
     * @param Shape $action The current action context
     * @throws MiddlewareException On any non-200 response
     */
    public static function handleTenderAnalysisExportResponse(Shape $response, Shape $action): void
    {
        $httpCode = $response->get("info.http_code");
        $content = $response->get("content");

        // Success case: 200 OK with file content
        if ($httpCode === 200) {
            // Check if this is actually a JSON error (some APIs return JSON errors with 200)
            $decoded = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE && isset($decoded["error"])) {
                // This is actually an error response disguised as 200
                $action->setItems([
                    "code" => $decoded["code"] ?? 500,
                    "qsai_response" => $decoded,
                    "raw_response" => $content
                ]);
                throw new MiddlewareException("qsaiServerError");
            }

            // Valid file response
            $action->set("content", $content);
            return;
        }

        // Connection error — QSAI unreachable (cURL code 0)
        if ($httpCode === 0) {
            self::throwServiceUnavailable($response, $action, "tender analysis export");
        }

        // Error cases
        $decoded = is_string($content) ? (json_decode($content, true) ?? []) : [];
        $action->setItems([
            "code" => $httpCode,
            "qsai_response" => $decoded,
            "raw_response" => $content
        ]);

        switch ($httpCode) {
            case 400:
                throw new MiddlewareException("qsaiBadRequestError");
            case 404:
                throw new MiddlewareException("qsaiNotFoundError");
            case 500:
            default:
                throw new MiddlewareException("qsaiServerError");
        }
    }

    /**
     * Handle a QSAI BoQ error response (GET /api/boq/{id} and POST /api/boq)
     *
     * Maps QSAI error codes onto the shared structured error handlers.
     * Unlike tender analysis (200 + status-in-body, where a 404 is anomalous),
     * QSAI genuinely 404s on the BoQ GET when no analysis has started — that
     * 404 is the normal empty-state and is passed through as a clean 404 via
     * qsaiNotFoundError. It must not be flattened into a 200 or escalated to a 500.
     *
     * Callers are expected to have handled the success codes already.
     *
     * @param Shape $response The response from the QSAI service
     * @param Shape $action The current action context
     * @param string $unavailableMessage Fallback message when QSAI is unreachable
     * @throws MiddlewareException Always
     */
    public static function handleBoqErrorResponse(
        Shape $response,
        Shape $action,
        string $unavailableMessage = self::SERVICE_UNAVAILABLE_MSG
    ): void {
        $httpCode = intval($response->get("info.http_code"));
        $content = strval($response->get("content"));
        $decoded = json_decode($content, true) ?? [];

        // Connection error — QSAI unreachable (cURL code 0). Log the transport
        // error server-side; only the user-facing message reaches the client.
        if ($httpCode === 0) {
            $curlError = strval($response->get("error.message", ""));
            error_log("QSAI connection error (boq): " . ($curlError ?: "no cURL error message"));
            $action->setItems([
                "code" => 503,
                "qsai_response" => ["message" => $unavailableMessage],
                "raw_response" => ""
            ]);
            throw new MiddlewareException("qsaiServerError", $unavailableMessage);
        }

        $action->setItems([
            "code" => $httpCode,
            "qsai_response" => $decoded,
            "raw_response" => $content
        ]);

        switch ($httpCode) {
            case 404:
                // Normal empty-state: no BoQ analysis started yet
                throw new MiddlewareException("qsaiNotFoundError");

            case 422:
                throw new MiddlewareException("qsaiValidationError");

            case 429:
                $action->set("retry_after", $decoded["retry_after_seconds"] ?? 300);
                throw new MiddlewareException("qsaiRateLimitError");

            case 400:
                throw new MiddlewareException("qsaiBadRequestError");

            case 409:
                throw new MiddlewareException("qsaiConflictError");

            case 500:
            default:
                $errorMessage = $decoded["message"] ?? $response->get("error.message", "");
                throw new MiddlewareException("qsaiServerError", strval($errorMessage));
        }
    }

    /**
     * Create middleware for handling QSAI tender analysis POST responses
     *
     * @return \Closure
     */
    public static function handleTenderAnalysisPost(): \Closure
    {
        return function (Shape $action) {
            $response = $action->get("qsai_response");
            if ($response instanceof Shape) {
                self::handleTenderAnalysisPostResponse($response, $action);
            }
        };
    }

    /**
     * Create middleware for handling QSAI tender analysis GET responses
     *
     * @return \Closure
     */
    public static function handleTenderAnalysisGet(): \Closure
    {
        return function (Shape $action) {
            $response = $action->get("qsai_response");
            if ($response instanceof Shape) {
                self::handleTenderAnalysisGetResponse($response, $action);
            }
        };
    }

    /**
     * Create middleware for handling QSAI tender analysis export responses
     *
     * @return \Closure
     */
    public static function handleTenderAnalysisExport(): \Closure
    {
        return function (Shape $action) {
            $response = $action->get("qsai_response");
            if ($response instanceof Shape) {
                self::handleTenderAnalysisExportResponse($response, $action);
            }
        };
    }

    /**
     * Build the multipart payload for a POST /api/clink_analysis request.
     *
     * Expects $action to carry: package (Shape), quote_files (array of per-file
     * entries yielded by TenderMiddleware::fetchTenderWithQuoteFiles) and
     * subcontractors (collection loaded via AccountMiddleware::loadAccountsByIdArray).
     *
     * All five bracket arrays — files, subcontractor_name, transaction_id,
     * quote_external_id, subcontractor_external_id — stay parallel by
     * construction: files with an unknown extension or an unresolvable
     * subcontractor name are dropped by the pre-filter, and the subsequent
     * loop appends all five fields atomically per surviving entry.
     *
     * Field semantics (per AI2-465):
     *  - transaction_id[i]            → Nexus's transaction.id (per-transaction).
     *  - quote_external_id[i]         → Nexus's transaction_document.id (per-file).
     *                                   QSAI accepts blank as null.
     *  - subcontractor_external_id[i] → transaction.subcontractor_id, or ''
     *                                   for the legacy transaction.subcontractor_id
     *                                   = -1 case where the name is instead
     *                                   pulled from meta['subcontractor_name'].
     *
     * @param Shape  $action        Action shape with tender + quote data
     * @param string $analysisType  One of: tender_analysis | equalization | tender_levelling
     * @return array                Multipart form payload
     */
    public static function buildQuoteAnalysisPayload(Shape $action, string $analysisType): array
    {
        $payload = [
            "tender_data"   => json_encode($action->get("package")),
            "analysis_type" => $analysisType,
        ];

        $files          = $action->get("quote_files");
        $subcontractors = $action->getCollection("subcontractors");

        $fileExts = [
            'pdf'  => "application/pdf",
            'docx' => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            'xlsx' => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            'xls'  => "application/vnd.ms-excel",
            'csv'  => "text/csv",
            'txt'  => "text/plain",
        ];

        // Pre-filter: keep only entries we can definitely send. Anything skipped
        // here never reaches the append loop, which guarantees array parity.
        $entries = [];
        foreach ($files as $file) {
            $ext = strtolower(pathinfo($file['quotes_tmp_path'], PATHINFO_EXTENSION));
            if (!array_key_exists($ext, $fileExts)) {
                continue;
            }

            $subId = (int) $file['subcontractor_id'];
            if ($subId === -1) {
                $meta = is_string($file['meta'] ?? null) ? json_decode($file['meta'], true) : null;
                $name = is_array($meta) ? ($meta['subcontractor_name'] ?? '') : '';
                $externalId = '';
            } else {
                $resolvedSub = null;
                foreach ($subcontractors as $sub) {
                    if ($subId === $sub->int("id")) {
                        $resolvedSub = $sub;
                        break;
                    }
                }
                if ($resolvedSub === null) {
                    error_log("buildQuoteAnalysisPayload: dropping file for unresolvable subcontractor_id={$file['subcontractor_id']}");
                    continue;
                }
                $name = $resolvedSub->get("name");
                $externalId = $subId;
            }

            $entries[] = [
                'path'          => $file['quotes_tmp_path'],
                'ext'           => $ext,
                'mime'          => $fileExts[$ext],
                'name'          => $name,
                'externalId'    => $externalId,
                'transactionId' => $file['transaction_id'],
                'documentId'    => $file['transaction_document_id'] ?? null,
            ];
        }

        // Atomic append: every iteration writes all five bracket arrays,
        // keeping their lengths equal by construction. quote_external_id
        // falls back to '' when the iterator couldn't attach a
        // transaction_document.id
        foreach ($entries as $i => $entry) {
            $payload["files[{$i}]"] = new \CURLFile(
                $entry['path'],
                $entry['mime'],
                basename($entry['path'])
            );
            $payload["subcontractor_name[{$i}]"]        = $entry['name'];
            $payload["transaction_id[{$i}]"]            = $entry['transactionId'];
            $payload["quote_external_id[{$i}]"]         = $entry['documentId'] ?? '';
            $payload["subcontractor_external_id[{$i}]"] = $entry['externalId'];
        }

        return $payload;
    }

    /**
     * Format QSAI structured error for client response
     *
     * Extracts user-facing message and relevant details from QSAI's structured error format
     *
     * @param array $qsaiResponse Decoded QSAI response
     * @return array Formatted error for client
     */
    public static function formatStructuredError(array $qsaiResponse, string $fallbackMessage = ""): array
    {
        // If it has errors.system, it’s a structured error
        if (isset($qsaiResponse["errors"]["system"])) {
            $system = $qsaiResponse["errors"]["system"];
            return [
                "error" => [
                    "code" => $system["code"] ?? "UNKNOWN_ERROR",
                    "type" => $system["type"] ?? "system_error",
                    "message" => $qsaiResponse["message"] ?? $system["user_message"] ?? "An error occurred",
                    "details" => $system["details"] ?? null,
                    "suggestions" => $system["suggestions"] ?? []
                ]
            ];
        }

        // If it has errors.json, it’s a validation error
        if (isset($qsaiResponse["errors"]["json"])) {
            return [
                "error" => [
                    "code" => "VALIDATION_ERROR",
                    "type" => "validation_error",
                    "message" => $qsaiResponse["message"] ?? "Validation failed",
                    "validation_errors" => $qsaiResponse["errors"]["json"]
                ]
            ];
        }

        // Generic error fallback — qsai message > exception fallback > default
        $message = $qsaiResponse["message"]
            ?? ($fallbackMessage ?: "We couldn’t complete the AI analysis. Something went wrong on our side while processing your request. \nPlease try running the analysis again. If this keeps happening, please contact support and mention this error.");
        return [
            "error" => [
                "code" => "SERVICE_UNAVAILABLE",
                "type" => "system_error",
                "message" => $message,
            ]
        ];
    }

    /**
     * Format rate limit error for client response
     *
     * @param array $qsaiResponse Decoded QSAI response
     * @param int|null $retryAfter Retry-After value in seconds
     * @return array Formatted error for client
     */
    public static function formatRateLimitError(array $qsaiResponse, ?int $retryAfter = null): array
    {
        $retrySeconds = $retryAfter ?? $qsaiResponse["retry_after_seconds"] ?? 300;

        return [
            "error" => [
                "code" => "RATE_LIMIT_EXCEEDED",
                "type" => "rate_limit",
                "message" => $qsaiResponse["message"] ?? "Too many requests. Please try again later.",
                "retry_after_seconds" => $retrySeconds
            ]
        ];
    }
}
