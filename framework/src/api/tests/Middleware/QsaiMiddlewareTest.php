<?php

declare(strict_types=1);

namespace Tests\Middleware;

use Api\TestBootstrap;
use Api\Middleware\QsaiMiddleware;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;

/**
 * Unit tests for QsaiMiddleware.
 *
 * Two concerns covered:
 *  1. buildQuoteAnalysisPayload (AI2-465): the multipart payload the POST relay
 *     forwards to QSAI — five bracket arrays stay parallel by construction,
 *     transaction_id and quote_external_id populated per-file (quote_external_id
 *     falls back to '' for files uploaded before AI2-505's per-file capture),
 *     and the legacy subcontractor_id = -1 case resolves name from
 *     meta['subcontractor_name'] with empty subcontractor_external_id.
 *  2. Error handling (AI2-468): connection failures / non-JSON / non-2xx
 *     responses must surface the client-safe SERVICE_UNAVAILABLE_MSG rather
 *     than leaking raw cURL error text.
 */
class QsaiMiddlewareTest extends TestBootstrap
{
    private const CURL_ERROR = "Failed to connect to staging-qsai.c-link.com port 443 after 6 ms: Couldn't connect to server";

    /** @var string|false */
    private $previousErrorLog;

    protected function setUp(): void
    {
        parent::setUp();
        // Silence expected error_log() output from the code under test
        $this->previousErrorLog = ini_set("error_log", "/dev/null");
    }

    protected function tearDown(): void
    {
        if (is_string($this->previousErrorLog)) {
            ini_set("error_log", $this->previousErrorLog);
        } else {
            ini_restore("error_log");
        }
        parent::tearDown();
    }

    // ==================================================================
    // buildQuoteAnalysisPayload (AI2-465)
    // ==================================================================

    /**
     * @param array<int, array<string, mixed>> $files
     * @param array<int, array<string, mixed>> $subs
     */
    private function buildAction(array $files, array $subs): Shape
    {
        return new Shape([
            'package'        => ['id' => 1, 'label' => 'Test package'],
            'quote_files'    => $files,
            'subcontractors' => $subs,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function makeFile(
        int $transactionId,
        string $subcontractorId,
        string $path,
        ?string $meta = null,
        ?int $transactionDocumentId = null
    ): array {
        return [
            'transaction_id'          => $transactionId,
            'transaction_document_id' => $transactionDocumentId,
            'subcontractor_id'        => $subcontractorId,
            'quotes_tmp_path'         => $path,
            'meta'                    => $meta,
        ];
    }

    /**
     * Count bracket-array keys in the payload matching a given prefix.
     *
     * @param array<string, mixed> $payload
     */
    private function countBracketKeys(array $payload, string $prefix): int
    {
        return count(array_filter(
            array_keys($payload),
            static fn(string $k): bool => str_starts_with($k, $prefix)
        ));
    }

    public function testHappyPathSingleFile(): void
    {
        $action = $this->buildAction(
            files: [$this->makeFile(42, '5', '/tmp/acme.pdf')],
            subs:  [['id' => '5', 'name' => 'Acme Corp']],
        );

        $payload = QsaiMiddleware::buildQuoteAnalysisPayload($action, 'tender_analysis');

        $this->assertSame('tender_analysis', $payload['analysis_type']);
        $this->assertArrayHasKey('files[0]', $payload);
        $this->assertSame('Acme Corp', $payload['subcontractor_name[0]']);
        $this->assertSame(42, $payload['transaction_id[0]']);
        $this->assertSame('', $payload['quote_external_id[0]']);
        $this->assertSame(5, $payload['subcontractor_external_id[0]']);
    }

    public function testMultiFileTransactionSharesTransactionId(): void
    {
        // Three files from one transaction — the ZIP contained multiple docs.
        // Per AI2-465 (2026-07-27) they must all share the same transaction_id
        // and subcontractor_external_id, while quote_external_id is distinct
        // per file (from transaction_document.id).
        $action = $this->buildAction(
            files: [
                $this->makeFile(77, '10', '/tmp/a.pdf', transactionDocumentId: 501),
                $this->makeFile(77, '10', '/tmp/b.xlsx', transactionDocumentId: 502),
                $this->makeFile(77, '10', '/tmp/c.csv', transactionDocumentId: 503),
            ],
            subs: [['id' => '10', 'name' => 'Bravo Ltd']],
        );

        $payload = QsaiMiddleware::buildQuoteAnalysisPayload($action, 'equalization');

        // Same transaction_id across all three
        $this->assertSame(77, $payload['transaction_id[0]']);
        $this->assertSame(77, $payload['transaction_id[1]']);
        $this->assertSame(77, $payload['transaction_id[2]']);

        // Same subcontractor across all three
        $this->assertSame(10, $payload['subcontractor_external_id[0]']);
        $this->assertSame(10, $payload['subcontractor_external_id[1]']);
        $this->assertSame(10, $payload['subcontractor_external_id[2]']);
        $this->assertSame('Bravo Ltd', $payload['subcontractor_name[0]']);

        // Distinct quote_external_id per file
        $this->assertSame(501, $payload['quote_external_id[0]']);
        $this->assertSame(502, $payload['quote_external_id[1]']);
        $this->assertSame(503, $payload['quote_external_id[2]']);
    }

    public function testQuoteExternalIdFallsBackToEmptyForPreAi2505Uploads(): void
    {
        // Files uploaded before AI2-505's per-file capture have no
        // transaction_document row, so the iterator attaches null and the
        // payload sends '' (QSAI accepts blank per AI2-470).
        $action = $this->buildAction(
            files: [$this->makeFile(42, '5', '/tmp/legacy.pdf', transactionDocumentId: null)],
            subs:  [['id' => '5', 'name' => 'Acme Corp']],
        );

        $payload = QsaiMiddleware::buildQuoteAnalysisPayload($action, 'tender_analysis');

        $this->assertSame(42, $payload['transaction_id[0]']);
        $this->assertSame('', $payload['quote_external_id[0]']);
    }

    public function testLegacySubcontractorUsesMetaNameAndEmptySubExternalId(): void
    {
        // Legacy subcontractor: transaction.subcontractor_id = -1, real name lives
        // in transaction.meta['subcontractor_name']. Only subcontractor_external_id
        // is blanked out for legacy — transaction_id continues to carry the real
        // transaction.id (per AI2-465 2026-07-27: "transaction_id and quote_external_id
        // still populated normally").
        $meta   = json_encode(['subcontractor_name' => 'Manual Contractor Ltd']);
        $action = $this->buildAction(
            files: [$this->makeFile(99, '-1', '/tmp/manual.pdf', $meta)],
            subs:  [],
        );

        $payload = QsaiMiddleware::buildQuoteAnalysisPayload($action, 'tender_analysis');

        $this->assertArrayHasKey('files[0]', $payload);
        $this->assertSame('Manual Contractor Ltd', $payload['subcontractor_name[0]']);
        $this->assertSame(99, $payload['transaction_id[0]']);
        $this->assertSame('', $payload['quote_external_id[0]']);
        $this->assertSame('', $payload['subcontractor_external_id[0]']);
    }

    public function testLegacySubcontractorWithNullMetaFallsBackToEmptyName(): void
    {
        // Legacy sub with no meta at all — name is empty, but the entry is still
        // sent so that the file reaches QSAI (better than silently dropping it).
        $action = $this->buildAction(
            files: [$this->makeFile(101, '-1', '/tmp/no_meta.pdf', null)],
            subs:  [],
        );

        $payload = QsaiMiddleware::buildQuoteAnalysisPayload($action, 'tender_analysis');

        $this->assertArrayHasKey('files[0]', $payload);
        $this->assertSame('', $payload['subcontractor_name[0]']);
        $this->assertSame(101, $payload['transaction_id[0]']);
        $this->assertSame('', $payload['subcontractor_external_id[0]']);
    }

    public function testUnknownExtensionDropsFileFromAllArrays(): void
    {
        // A file with an unsupported extension must be dropped from ALL five
        // bracket arrays — not just files — to preserve parity and avoid
        // sparse-array indices like files[0], files[2].
        $action = $this->buildAction(
            files: [
                $this->makeFile(1, '5', '/tmp/good.pdf'),
                $this->makeFile(2, '5', '/tmp/bad.zip'),
                $this->makeFile(3, '5', '/tmp/also_good.xlsx'),
            ],
            subs: [['id' => '5', 'name' => 'Acme']],
        );

        $payload = QsaiMiddleware::buildQuoteAnalysisPayload($action, 'tender_analysis');

        $this->assertArrayHasKey('files[0]', $payload);
        $this->assertArrayHasKey('files[1]', $payload);
        $this->assertArrayNotHasKey('files[2]', $payload);
        $this->assertSame(1, $payload['transaction_id[0]']);
        $this->assertSame(3, $payload['transaction_id[1]']);
    }

    public function testUnresolvableSubcontractorIsDropped(): void
    {
        // Non-legacy subcontractor_id that isn't present in the accounts
        // collection (data corruption / unexpected state). The file is dropped
        // defensively rather than sent with an empty name.
        $action = $this->buildAction(
            files: [
                $this->makeFile(1, '5', '/tmp/known.pdf'),
                $this->makeFile(2, '999', '/tmp/unknown_sub.pdf'),
            ],
            subs: [['id' => '5', 'name' => 'Acme']],
        );

        $payload = QsaiMiddleware::buildQuoteAnalysisPayload($action, 'tender_analysis');

        $this->assertArrayHasKey('files[0]', $payload);
        $this->assertArrayNotHasKey('files[1]', $payload);
        $this->assertSame(1, $payload['transaction_id[0]']);
    }

    public function testAllFiveBracketArraysStayParallel(): void
    {
        // Structural invariant: for any input, the count of each bracket array
        // matches the count of files.
        $meta   = json_encode(['subcontractor_name' => 'Manual']);
        $action = $this->buildAction(
            files: [
                $this->makeFile(1, '5', '/tmp/a.pdf'),
                $this->makeFile(2, '-1', '/tmp/b.pdf', $meta),
                $this->makeFile(3, '999', '/tmp/c.pdf'),   // unresolvable — dropped
                $this->makeFile(4, '5', '/tmp/d.zip'),     // unknown ext — dropped
                $this->makeFile(5, '5', '/tmp/e.xlsx'),
            ],
            subs: [['id' => '5', 'name' => 'Acme']],
        );

        $payload = QsaiMiddleware::buildQuoteAnalysisPayload($action, 'tender_analysis');

        $filesCount = $this->countBracketKeys($payload, 'files[');
        $this->assertSame(3, $filesCount);
        $this->assertSame($filesCount, $this->countBracketKeys($payload, 'subcontractor_name['));
        $this->assertSame($filesCount, $this->countBracketKeys($payload, 'transaction_id['));
        $this->assertSame($filesCount, $this->countBracketKeys($payload, 'quote_external_id['));
        $this->assertSame($filesCount, $this->countBracketKeys($payload, 'subcontractor_external_id['));
    }

    public function testEmptyInputProducesJustPayloadMetadata(): void
    {
        $action = $this->buildAction(files: [], subs: []);

        $payload = QsaiMiddleware::buildQuoteAnalysisPayload($action, 'tender_levelling');

        $this->assertSame('tender_levelling', $payload['analysis_type']);
        $this->assertArrayHasKey('tender_data', $payload);
        $this->assertArrayNotHasKey('files[0]', $payload);
        $this->assertArrayNotHasKey('subcontractor_name[0]', $payload);
        $this->assertArrayNotHasKey('transaction_id[0]', $payload);
        $this->assertArrayNotHasKey('quote_external_id[0]', $payload);
        $this->assertArrayNotHasKey('subcontractor_external_id[0]', $payload);
    }

    public function testCurlFileFilenamePreservesOriginalName(): void
    {
        // The multipart filename QSAI stores as ClinkQuotesFile.file_name must be
        // the original uploaded filename, not a synthetic label. downloadDocumentToTemp
        // extracts the ZIP preserving entry names, so basename($entry['path']) yields
        // the original.
        $action = $this->buildAction(
            files: [$this->makeFile(42, '5', '/tmp/123/structural_calcs_v3.pdf')],
            subs:  [['id' => '5', 'name' => 'Acme Corp']],
        );

        $payload = QsaiMiddleware::buildQuoteAnalysisPayload($action, 'tender_analysis');

        $this->assertInstanceOf(\CURLFile::class, $payload['files[0]']);
        $this->assertSame('structural_calcs_v3.pdf', $payload['files[0]']->getPostFilename());
    }

    // ==================================================================
    // Error handling — response handlers + handleRelayException (AI2-468)
    // ==================================================================

    /**
     * Build a QSAI response Shape as produced by the HTTP layer
     */
    private function makeResponse(int $httpCode, mixed $content = null, array $error = []): Shape
    {
        return new Shape([
            "info" => ["http_code" => $httpCode],
            "content" => $content,
            "error" => $error
        ]);
    }

    /**
     * Build a connection-failure response (cURL errno, no HTTP status)
     */
    private function makeConnectionErrorResponse(): Shape
    {
        return $this->makeResponse(0, null, ["code" => 7, "message" => self::CURL_ERROR]);
    }

    /**
     * Assert the action carries the client-safe service-unavailable state
     */
    private function assertServiceUnavailableAction(Shape $action): void
    {
        $this->assertSame(503, $action->get("code"));
        $this->assertSame(
            QsaiMiddleware::SERVICE_UNAVAILABLE_MSG,
            $action->get("qsai_response.message")
        );
        // The raw cURL error must never be in the client-facing message
        $this->assertStringNotContainsString(
            "Failed to connect",
            strval($action->get("qsai_response.message"))
        );
        // ... and formatStructuredError (used by the qsaiServerError handler)
        // must resolve to the friendly message too
        $formatted = QsaiMiddleware::formatStructuredError((array)$action->get("qsai_response"));
        $this->assertSame(QsaiMiddleware::SERVICE_UNAVAILABLE_MSG, $formatted["error"]["message"]);
    }

    // --- handleTenderAnalysisPostResponse ---

    public function testPostConnectionErrorSurfacesFriendlyMessage(): void
    {
        $action = new Shape([]);

        try {
            QsaiMiddleware::handleTenderAnalysisPostResponse($this->makeConnectionErrorResponse(), $action);
            $this->fail("Expected MiddlewareException was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiServerError", $e->getId());
            $this->assertSame(QsaiMiddleware::SERVICE_UNAVAILABLE_MSG, $e->getMessage());
        }

        $this->assertServiceUnavailableAction($action);
    }

    public function testPostAcceptedPassesContentThrough(): void
    {
        $action = new Shape([]);
        $content = json_encode(["status" => "PENDING"]);

        QsaiMiddleware::handleTenderAnalysisPostResponse($this->makeResponse(202, $content), $action);

        $this->assertSame($content, $action->get("json"));
    }

    // --- handleTenderAnalysisGetResponse ---

    public function testGetConnectionErrorSurfacesFriendlyMessage(): void
    {
        $action = new Shape([]);

        try {
            QsaiMiddleware::handleTenderAnalysisGetResponse($this->makeConnectionErrorResponse(), $action);
            $this->fail("Expected MiddlewareException was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiServerError", $e->getId());
            $this->assertSame(QsaiMiddleware::SERVICE_UNAVAILABLE_MSG, $e->getMessage());
        }

        $this->assertServiceUnavailableAction($action);
    }

    public function testGetOkWithEmptyBodySurfacesFriendlyMessage(): void
    {
        $action = new Shape([]);

        try {
            QsaiMiddleware::handleTenderAnalysisGetResponse($this->makeResponse(200, ""), $action);
            $this->fail("Expected MiddlewareException was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiServerError", $e->getId());
            $this->assertSame(QsaiMiddleware::SERVICE_UNAVAILABLE_MSG, $e->getMessage());
        }

        $this->assertServiceUnavailableAction($action);
    }

    public function testGetOkWithNonJsonBodySurfacesFriendlyMessage(): void
    {
        $action = new Shape([]);

        try {
            QsaiMiddleware::handleTenderAnalysisGetResponse(
                $this->makeResponse(200, "<html>502 Bad Gateway</html>"),
                $action
            );
            $this->fail("Expected MiddlewareException was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiServerError", $e->getId());
            $this->assertSame(QsaiMiddleware::SERVICE_UNAVAILABLE_MSG, $e->getMessage());
        }

        $this->assertServiceUnavailableAction($action);
    }

    public function testGetOkWithValidBodyPassesContentThrough(): void
    {
        $action = new Shape([]);
        $content = json_encode(["status" => "PENDING"]);

        QsaiMiddleware::handleTenderAnalysisGetResponse($this->makeResponse(200, $content), $action);

        $this->assertSame($content, $action->get("json"));
    }

    public function testGetNotFoundThrowsNotFoundError(): void
    {
        $action = new Shape([]);

        try {
            QsaiMiddleware::handleTenderAnalysisGetResponse(
                $this->makeResponse(404, json_encode(["message" => "Package not found"])),
                $action
            );
            $this->fail("Expected MiddlewareException was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiNotFoundError", $e->getId());
        }

        $this->assertSame(404, $action->get("code"));
    }

    // --- handleTenderAnalysisExportResponse ---

    public function testExportConnectionErrorSurfacesFriendlyMessage(): void
    {
        $action = new Shape([]);

        try {
            QsaiMiddleware::handleTenderAnalysisExportResponse($this->makeConnectionErrorResponse(), $action);
            $this->fail("Expected MiddlewareException was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiServerError", $e->getId());
            $this->assertSame(QsaiMiddleware::SERVICE_UNAVAILABLE_MSG, $e->getMessage());
        }

        $this->assertServiceUnavailableAction($action);
    }

    // --- handleRelayException ---

    public function testRelayExceptionWithCurlErrorMapsTo503(): void
    {
        $action = new Shape([]);
        // RestException message shape for a connection failure: code is the
        // cURL errno (7), message is the raw cURL error text
        $exception = new \Exception(strval(json_encode([
            "type" => "GET",
            "url" => "http://qsai/api/clink_analysis/1/tender_analysis",
            "code" => 7,
            "message" => self::CURL_ERROR
        ])));

        try {
            QsaiMiddleware::handleRelayException($exception, $action, "unit-test");
            $this->fail("Expected MiddlewareException was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiServerError", $e->getId());
        }

        // cURL errno must not leak out as an HTTP status
        $this->assertSame(503, $action->get("code"));
        // handleRelayException injects SERVICE_UNAVAILABLE_MSG on qsai_response
        // so the qsaiServerError handler never leaks the raw cURL text.
        $this->assertServiceUnavailableAction($action);
        // Reproduce the qsaiServerError handler's exact call at v1.php — even
        // with the raw cURL text passed as $fallbackMessage, the injected
        // qsai_response.message must win over it.
        $formatted = QsaiMiddleware::formatStructuredError(
            (array)$action->get("qsai_response"),
            self::CURL_ERROR
        );
        $this->assertSame(QsaiMiddleware::SERVICE_UNAVAILABLE_MSG, $formatted["error"]["message"]);
        $this->assertStringNotContainsString("Failed to connect", $formatted["error"]["message"]);
    }

    public function testRelayExceptionWithNonJsonMessageDoesNotFatal(): void
    {
        $action = new Shape([]);

        try {
            QsaiMiddleware::handleRelayException(new \Exception("plain text failure"), $action, "unit-test");
            $this->fail("Expected MiddlewareException was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiServerError", $e->getId());
        }

        $this->assertSame(503, $action->get("code"));
        $this->assertSame(
            QsaiMiddleware::SERVICE_UNAVAILABLE_MSG,
            $action->get("qsai_response.message")
        );
    }

    public function testRelayExceptionPreservesStructuredHttpError(): void
    {
        $action = new Shape([]);
        $qsaiError = [
            "message" => "Tender data is invalid",
            "errors" => ["system" => ["code" => "INVALID_TENDER", "type" => "system_error"]]
        ];
        $exception = new \Exception(strval(json_encode([
            "type" => "GET",
            "url" => "http://qsai/api/clink_analysis/1/tender_analysis",
            "code" => 400,
            "message" => json_encode($qsaiError)
        ])));

        try {
            QsaiMiddleware::handleRelayException($exception, $action, "unit-test");
            $this->fail("Expected MiddlewareException was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiServerError", $e->getId());
        }

        // Genuine HTTP error codes and QSAI's own message are preserved
        $this->assertSame(400, $action->get("code"));
        $this->assertSame("Tender data is invalid", $action->get("qsai_response.message"));
        $formatted = QsaiMiddleware::formatStructuredError((array)$action->get("qsai_response"));
        $this->assertSame("Tender data is invalid", $formatted["error"]["message"]);
    }

    public function testRelayExceptionPreservesStructuredUserMessageWithoutTopLevelMessage(): void
    {
        $action = new Shape([]);
        // Structured QSAI error with errors.system.user_message but no
        // top-level "message" — formatStructuredError falls back to
        // user_message, so handleRelayException must not inject its own.
        $qsaiError = [
            "errors" => ["system" => [
                "code" => "TENDER_LOCKED",
                "type" => "system_error",
                "user_message" => "This tender is locked for edits"
            ]]
        ];
        $exception = new \Exception(strval(json_encode([
            "type" => "GET",
            "url" => "http://qsai/api/clink_analysis/1/tender_analysis",
            "code" => 423,
            "message" => json_encode($qsaiError)
        ])));

        try {
            QsaiMiddleware::handleRelayException($exception, $action, "unit-test");
            $this->fail("Expected MiddlewareException was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiServerError", $e->getId());
        }

        // qsai_response.message must remain absent so formatStructuredError
        // can fall through to errors.system.user_message
        $this->assertNull($action->get("qsai_response.message"));
        $formatted = QsaiMiddleware::formatStructuredError((array)$action->get("qsai_response"));
        $this->assertSame("This tender is locked for edits", $formatted["error"]["message"]);
    }

    // --- formatStructuredError ---

    public function testFormatStructuredErrorFallsBackToFriendlyMessage(): void
    {
        $formatted = QsaiMiddleware::formatStructuredError([]);

        $this->assertSame("SERVICE_UNAVAILABLE", $formatted["error"]["code"]);
        $this->assertSame(QsaiMiddleware::SERVICE_UNAVAILABLE_MSG, $formatted["error"]["message"]);
    }
}
