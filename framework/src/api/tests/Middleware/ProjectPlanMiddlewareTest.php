<?php

declare(strict_types=1);

namespace Tests\Middleware;

use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\TestBootstrap;
use Api\Middleware\Relay\ProjectPlanMiddleware;

/**
 * Unit tests for the Plan My Project QSAI relay (AI2-516)
 */
class ProjectPlanMiddlewareTest extends TestBootstrap
{
    /** @var array Snapshot of the superglobal mutated by relayToQsai() */
    private array $filesBackup = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->filesBackup = $_FILES;
    }

    protected function tearDown(): void
    {
        $_FILES = $this->filesBackup;
        parent::tearDown();
    }

    private function makeAction(): Shape
    {
        return new Shape([
            "uriArgs" => ["project_id" => "123"],
            "project" => ["id" => 123, "name" => "Riverside Development", "group_id" => 42],
            "account" => ["id" => 42, "name" => "BuildCo Ltd"],
            "user"    => ["id" => 7, "email" => "pm@buildco.example"],
        ]);
    }

    // === buildExternalMetadata ===

    public function testBuildExternalMetadataContainsSessionAndProjectContext(): void
    {
        $metadata = json_decode(ProjectPlanMiddleware::buildExternalMetadata($this->makeAction()), true);

        $this->assertSame("framework-api", $metadata["source"]);
        $this->assertSame(42, $metadata["account_id"]);
        $this->assertSame("BuildCo Ltd", $metadata["account_name"]);
        $this->assertSame(7, $metadata["user_id"]);
        $this->assertSame("pm@buildco.example", $metadata["user_email"]);
        $this->assertSame("Riverside Development", $metadata["project_name"]);
        $this->assertArrayHasKey("environment", $metadata);
    }

    public function testBuildExternalMetadataToleratesMissingKeys(): void
    {
        $metadata = json_decode(ProjectPlanMiddleware::buildExternalMetadata(new Shape([])), true);

        $this->assertSame("framework-api", $metadata["source"]);
        $this->assertNull($metadata["account_id"]);
        $this->assertNull($metadata["project_name"]);
    }

    // === relayToQsai ===

    public function testRelayToQsaiRejectsMissingFiles(): void
    {
        $_FILES = [];

        try {
            ProjectPlanMiddleware::relayToQsai()($this->makeAction());
            $this->fail("Expected qsaiBadRequestError was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiBadRequestError", $e->getId());
            $this->assertSame("No pricing document provided", $e->getMessage());
        }
    }

    public function testRelayToQsaiRejectsEmptyFilesField(): void
    {
        $_FILES = ["files" => ["name" => [], "type" => [], "tmp_name" => [], "error" => [], "size" => []]];

        try {
            ProjectPlanMiddleware::relayToQsai()($this->makeAction());
            $this->fail("Expected qsaiBadRequestError was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("qsaiBadRequestError", $e->getId());
        }
    }
}
