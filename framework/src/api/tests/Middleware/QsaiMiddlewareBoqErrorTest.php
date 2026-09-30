<?php

declare(strict_types=1);

namespace Tests\Middleware;

use Api\TestBootstrap;
use Api\Middleware\QsaiMiddleware;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;

/**
 * Unit tests for QsaiMiddleware::handleBoqErrorResponse()
 *
 * Verifies that QSAI error responses on the BoQ routes are mapped to the
 * dedicated structured error handlers (AI2-494), most importantly that the
 * normal "no analysis yet" 404 becomes a clean qsaiNotFoundError instead of
 * a double-escaped nested-JSON blob through the generic "error" handler.
 */
class QsaiMiddlewareBoqErrorTest extends TestBootstrap
{
    /**
     * The structured 404 body QSAI returns when no BoQ analysis exists yet.
     */
    private const QSAI_NOT_FOUND_BODY = [
        "code" => 404,
        "errors" => [
            "system" => [
                "code" => "NOT_FOUND",
                "type" => "validation_error",
                "user_message" => "Boq analysis not found",
            ],
        ],
        "message" => "Boq analysis not found",
        "status" => "Not Found",
    ];

    private function makeResponse(int $httpCode, mixed $body = null, array $curlError = []): Shape
    {
        $shape = new Shape([
            "info" => ["http_code" => $httpCode],
            "content" => is_string($body) ? $body : ($body === null ? "" : json_encode($body)),
        ]);
        if ($curlError) {
            $shape->set("error", $curlError);
        }
        return $shape;
    }

    private function expectMiddlewareExceptionId(Shape $response, Shape $action, string $expectedId): MiddlewareException
    {
        try {
            QsaiMiddleware::handleBoqErrorResponse($response, $action);
        } catch (MiddlewareException $e) {
            $this->assertSame($expectedId, $e->getId());
            return $e;
        }
        $this->fail("Expected MiddlewareException '{$expectedId}' was not thrown");
    }

    public function testNotFoundIsPassedThroughAsQsaiNotFoundError(): void
    {
        $action = new Shape([]);
        $response = $this->makeResponse(404, self::QSAI_NOT_FOUND_BODY);

        $this->expectMiddlewareExceptionId($response, $action, "qsaiNotFoundError");

        $this->assertSame(404, $action->get("code"));
        $this->assertSame(self::QSAI_NOT_FOUND_BODY, $action->get("qsai_response"));
    }

    public function testNotFoundFormatsToCleanStructuredBody(): void
    {
        $action = new Shape([]);
        $response = $this->makeResponse(404, self::QSAI_NOT_FOUND_BODY);

        $this->expectMiddlewareExceptionId($response, $action, "qsaiNotFoundError");

        // Same formatting step the qsaiNotFoundError route handler performs
        $formatted = QsaiMiddleware::formatStructuredError($action->get("qsai_response"));

        $this->assertSame("NOT_FOUND", $formatted["error"]["code"]);
        $this->assertSame("validation_error", $formatted["error"]["type"]);
        $this->assertSame("Boq analysis not found", $formatted["error"]["message"]);

        // No nested / double-escaped JSON anywhere in the emitted body
        $json = json_encode($formatted);
        $this->assertStringNotContainsString('\\"', $json);
    }

    public function testValidationErrorMapsTo422Handler(): void
    {
        $action = new Shape([]);
        $body = ["message" => "Validation failed", "errors" => ["json" => ["files" => "required"]]];
        $response = $this->makeResponse(422, $body);

        $this->expectMiddlewareExceptionId($response, $action, "qsaiValidationError");

        $this->assertSame(422, $action->get("code"));
        $this->assertSame($body, $action->get("qsai_response"));
    }

    public function testRateLimitMapsTo429HandlerWithRetryAfter(): void
    {
        $action = new Shape([]);
        $response = $this->makeResponse(429, ["message" => "Too many requests", "retry_after_seconds" => 120]);

        $this->expectMiddlewareExceptionId($response, $action, "qsaiRateLimitError");

        $this->assertSame(429, $action->get("code"));
        $this->assertSame(120, $action->get("retry_after"));
    }

    public function testRateLimitDefaultsRetryAfterWhenMissing(): void
    {
        $action = new Shape([]);
        $response = $this->makeResponse(429, ["message" => "Too many requests"]);

        $this->expectMiddlewareExceptionId($response, $action, "qsaiRateLimitError");

        $this->assertSame(300, $action->get("retry_after"));
    }

    public function testBadRequestMapsTo400Handler(): void
    {
        $action = new Shape([]);
        $response = $this->makeResponse(400, ["message" => "Bad request"]);

        $this->expectMiddlewareExceptionId($response, $action, "qsaiBadRequestError");
        $this->assertSame(400, $action->get("code"));
    }

    public function testConflictMapsTo409Handler(): void
    {
        $action = new Shape([]);
        $response = $this->makeResponse(409, ["message" => "Already processing"]);

        $this->expectMiddlewareExceptionId($response, $action, "qsaiConflictError");
        $this->assertSame(409, $action->get("code"));
    }

    public function testServerErrorMapsToQsaiServerErrorWithMessage(): void
    {
        $action = new Shape([]);
        $response = $this->makeResponse(500, ["message" => "Internal failure"]);

        $e = $this->expectMiddlewareExceptionId($response, $action, "qsaiServerError");

        $this->assertSame(500, $action->get("code"));
        $this->assertSame("Internal failure", $e->getMessage());
    }

    public function testUnknownCodeFallsBackToQsaiServerError(): void
    {
        $action = new Shape([]);
        $response = $this->makeResponse(502, "Bad Gateway");

        $this->expectMiddlewareExceptionId($response, $action, "qsaiServerError");

        $this->assertSame(502, $action->get("code"));
        // Non-JSON body: raw content preserved, decoded payload empty
        $this->assertSame("Bad Gateway", $action->get("raw_response"));
        $this->assertSame([], $action->get("qsai_response"));
    }

    public function testConnectionErrorBecomes503ServiceUnavailable(): void
    {
        $action = new Shape([]);
        $response = $this->makeResponse(0, null, ["code" => 7, "message" => "Failed to connect to qsai"]);

        $e = $this->expectMiddlewareExceptionId($response, $action, "qsaiServerError");

        $this->assertSame(503, $action->get("code"));
        // The raw curl detail must not reach the client payload or exception
        $this->assertStringNotContainsString("Failed to connect", $e->getMessage());
        $this->assertSame(
            QsaiMiddleware::SERVICE_UNAVAILABLE_MSG,
            $action->get("qsai_response")["message"]
        );
    }

    public function testConnectionErrorUsesCustomUnavailableMessage(): void
    {
        $action = new Shape([]);
        $response = $this->makeResponse(0);

        try {
            QsaiMiddleware::handleBoqErrorResponse($response, $action, "BoQ generation unavailable");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiServerError", $e->getId());
            $this->assertSame("BoQ generation unavailable", $action->get("qsai_response")["message"]);
            return;
        }
        $this->fail("Expected MiddlewareException was not thrown");
    }
}
