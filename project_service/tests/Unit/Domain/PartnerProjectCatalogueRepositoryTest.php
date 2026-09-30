<?php

declare(strict_types=1);

namespace Tests\Unit\Domain;

use App\Domain\Project\PartnerCatalogue\PartnerProjectCatalogue;
use App\Domain\Project\PartnerCatalogue\PartnerProjectCatalogueRepository;
use PHPUnit\Framework\TestCase;

class PartnerProjectCatalogueRepositoryTest extends TestCase
{
    private PartnerProjectCatalogueRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new PartnerProjectCatalogueRepository();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'external_id' => 'IFS-PRJ-0042',
            'project_code' => 'MCL-0042',
            'project_name' => 'Riverside Depot Refurbishment',
            'business_unit_code' => '10',
            'business_unit_name' => 'London',
        ], $overrides);
    }

    public function testRegistersTheCatalogueModel(): void
    {
        self::assertInstanceOf(PartnerProjectCatalogue::class, $this->repository->getModel());
    }

    public function testCanonicalHashIsDeterministic(): void
    {
        self::assertSame(
            $this->repository->canonicalHash($this->payload()),
            $this->repository->canonicalHash($this->payload())
        );
    }

    public function testCanonicalHashIsASha256Digest(): void
    {
        $hash = $this->repository->canonicalHash($this->payload());

        self::assertSame(64, strlen($hash));
        self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $hash);
    }

    public function testCanonicalHashIgnoresKeyOrder(): void
    {
        $ordered = $this->payload();
        $shuffled = array_reverse($ordered, true);

        self::assertSame(
            $this->repository->canonicalHash($ordered),
            $this->repository->canonicalHash($shuffled)
        );
    }

    public function testCanonicalHashIgnoresFieldsOutsideTheImmutableSet(): void
    {
        $withExtras = $this->payload([
            'api_client_id' => 1,
            'group_id' => 9,
            'c_link_project_id' => 55,
            'source_payload_hash' => 'whatever',
        ]);

        self::assertSame(
            $this->repository->canonicalHash($this->payload()),
            $this->repository->canonicalHash($withExtras)
        );
    }

    public function testCanonicalHashChangesWhenAnyImmutableFieldChanges(): void
    {
        $baseline = $this->repository->canonicalHash($this->payload());

        $changes = [
            'external_id' => 'IFS-PRJ-9999',
            'project_code' => 'MCL-9999',
            'project_name' => 'Riverside Depot Refurbishments',
            'business_unit_code' => '20',
            'business_unit_name' => 'Romania',
        ];

        foreach ($changes as $field => $value) {
            self::assertNotSame(
                $baseline,
                $this->repository->canonicalHash($this->payload([$field => $value])),
                "changing {$field} must produce a different canonical hash"
            );
        }
    }

    public function testCanonicalHashTreatsMissingAndEmptyValuesAlike(): void
    {
        $missing = $this->payload();
        unset($missing['business_unit_name']);

        self::assertSame(
            $this->repository->canonicalHash($this->payload(['business_unit_name' => ''])),
            $this->repository->canonicalHash($missing)
        );
    }

    public function testCanonicalHashIsCaseSensitive(): void
    {
        self::assertNotSame(
            $this->repository->canonicalHash($this->payload()),
            $this->repository->canonicalHash($this->payload(['project_name' => 'RIVERSIDE DEPOT REFURBISHMENT']))
        );
    }
}
