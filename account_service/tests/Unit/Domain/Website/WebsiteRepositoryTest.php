<?php
declare(strict_types=1);

namespace Tests\Domain\Website;

use App\Domain\Website\Website;
use App\Domain\Website\WebsiteRepository;
use PHPUnit\Framework\TestCase;

final class WebsiteRepositoryTest extends TestCase
{
    public function testGetModelReturnsWebsiteInstanceByDefault(): void
    {
        $repository = new WebsiteRepository();

        self::assertInstanceOf(Website::class, $repository->getModel());
    }

    public function testGetModelThrowsForUnknownModel(): void
    {
        $repository = new WebsiteRepository();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid Model unknown');

        $repository->getModel('unknown');
    }
}
