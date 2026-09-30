<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Error;

use App\Application\Actions\ActionError;
use PHPUnit\Framework\TestCase;

if (!class_exists(LegacyActionErrorShim::class, false)) {
    class LegacyActionErrorShim extends ActionError
    {
        public const NOT_FOUND = self::RESOURCE_NOT_FOUND;
    }
}

final class EntityNotFoundTest extends TestCase
{
    public function testEntityNotFoundMessage(): void
    {
        $this->ensureLegacyGlobalsAreAvailable();

        $error = new \EntityNotFound();

        $this->assertSame(\ActionError::NOT_FOUND, $error->getType());
        $this->assertSame('Entity not found', $error->getDescription());
    }

    private function ensureLegacyGlobalsAreAvailable(): void
    {
        if (!class_exists(\ActionError::class, false)) {
            class_alias(LegacyActionErrorShim::class, \ActionError::class);
        }

        if (!class_exists(\EntityNotFound::class, false)) {
            require_once dirname(__DIR__, 5) . '/src/Application/Actions/Error/EntityNotFound.php';
        }
    }
}
