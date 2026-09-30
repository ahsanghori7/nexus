<?php

declare(strict_types=1);

namespace Tests\Middleware;

use Core\Data\Collection;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\TestBootstrap;
use Api\Middleware\ProjectMiddleware;

/**
 * Unit tests for ProjectMiddleware::checkProjectAccessById() (AI2-437)
 *
 * Access rule: administrators bypass the ownership equality, main contractors
 * must own the project, every other account type is denied.
 */
class ProjectMiddlewareTest extends TestBootstrap
{
    private const TYPE_MAIN_CONTRACTOR = 1;
    private const TYPE_SPECIALIST = 2;
    private const TYPE_ADMIN = 3;
    private const TYPE_EXTERNAL_SUBCONTRACTOR = 4;

    private const PROJECT_GROUP_ID = 42;

    /**
     * Build an action Shape with a logged-in account of the given type and a
     * package whose project is owned by PROJECT_GROUP_ID
     */
    private function makeAction(int $accountId, int $typeId): Shape
    {
        return new Shape([
            "account" => ["id" => $accountId, "type_id" => $typeId],
            "account_types" => new Collection([
                ["id" => self::TYPE_MAIN_CONTRACTOR, "label" => "main-contractor"],
                ["id" => self::TYPE_SPECIALIST, "label" => "specialist"],
                ["id" => self::TYPE_ADMIN, "label" => "administrator"],
                ["id" => self::TYPE_EXTERNAL_SUBCONTRACTOR, "label" => "external_subcontractor"],
            ], Shape::class),
            "package" => ["project" => ["group_id" => self::PROJECT_GROUP_ID]]
        ]);
    }

    private function assertAccessDenied(Shape $action): void
    {
        try {
            ProjectMiddleware::checkProjectAccessById("package.project.group_id")($action);
            $this->fail("Expected projectOwnershipError was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("projectOwnershipError", $e->getId());
            $this->assertSame("You don't have access to the project.", $e->getMessage());
        }
    }

    public function testOwningMainContractorIsAllowed(): void
    {
        $action = $this->makeAction(self::PROJECT_GROUP_ID, self::TYPE_MAIN_CONTRACTOR);

        ProjectMiddleware::checkProjectAccessById("package.project.group_id")($action);

        $this->addToAssertionCount(1); // no exception thrown
    }

    public function testNonOwningMainContractorIsDenied(): void
    {
        $this->assertAccessDenied($this->makeAction(999, self::TYPE_MAIN_CONTRACTOR));
    }

    public function testAdministratorBypassesOwnershipCheck(): void
    {
        // Admin account id does NOT match the project group — still allowed
        $action = $this->makeAction(999, self::TYPE_ADMIN);

        ProjectMiddleware::checkProjectAccessById("package.project.group_id")($action);

        $this->addToAssertionCount(1); // no exception thrown
    }

    public function testSubcontractorIsDenied(): void
    {
        // Denied even when the account id happens to equal the project group id
        $this->assertAccessDenied($this->makeAction(self::PROJECT_GROUP_ID, self::TYPE_SPECIALIST));
    }

    public function testExternalSubcontractorIsDenied(): void
    {
        $this->assertAccessDenied($this->makeAction(999, self::TYPE_EXTERNAL_SUBCONTRACTOR));
    }

    public function testCheckProjectOwnershipByIdStillEnforcesBareEquality(): void
    {
        // The raw check (used inside the composed rule) keeps its behaviour
        $action = $this->makeAction(self::PROJECT_GROUP_ID, self::TYPE_MAIN_CONTRACTOR);
        $this->assertTrue(
            ProjectMiddleware::checkProjectOwnershipById("package.project.group_id")($action)
        );

        try {
            ProjectMiddleware::checkProjectOwnershipById("package.project.group_id")(
                $this->makeAction(999, self::TYPE_MAIN_CONTRACTOR)
            );
            $this->fail("Expected projectOwnershipError was not thrown");
        } catch (MiddlewareException $e) {
            $this->assertSame("projectOwnershipError", $e->getId());
        }
    }
}
