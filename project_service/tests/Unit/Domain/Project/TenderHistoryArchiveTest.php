<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Project;

use App\Domain\Project\TenderHistoryArchive;
use PHPUnit\Framework\TestCase;

class TenderHistoryArchiveTest extends TestCase
{
    public function testCleanKeepsTenderAndSpecialistIdentifiers(): void
    {
        $archive = new TenderHistoryArchive();
        $payload = [
            'tender_id' => 7,
            'specialist_id' => 3,
            'note' => 'ignore',
        ];

        self::assertSame(['tender_id' => 7, 'specialist_id' => 3], $archive->clean($payload));
    }
}
