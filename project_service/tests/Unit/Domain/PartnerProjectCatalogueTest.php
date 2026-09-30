<?php

declare(strict_types=1);

namespace Tests\Unit\Domain;

use App\Domain\Project\PartnerCatalogue\PartnerProjectCatalogue;
use PHPUnit\Framework\TestCase;

class PartnerProjectCatalogueTest extends TestCase
{
    public function testMapsToThePartnerCatalogueTable(): void
    {
        self::assertSame('partner_project_catalogue', (new PartnerProjectCatalogue())->getTable());
    }

    public function testFillableCoversTheExternalMetadataAndLinkFields(): void
    {
        $fillable = (new PartnerProjectCatalogue())->getFillable();

        foreach (
            [
                'api_client_id',
                'group_id',
                'external_id',
                'project_code',
                'project_name',
                'business_unit_code',
                'business_unit_name',
                'source_payload_hash',
                'c_link_project_id',
                'linked_at',
            ] as $field
        ) {
            self::assertContains($field, $fillable, "expected {$field} to be fillable");
        }
    }

    public function testIdIsNotMassAssignable(): void
    {
        self::assertNotContains('id', (new PartnerProjectCatalogue())->getFillable());
    }

    public function testColumnsDeclareTheRequiredExternalFields(): void
    {
        $columns = (new PartnerProjectCatalogue())->getColumns();

        self::assertTrue($columns['api_client_id']['required']);
        self::assertTrue($columns['external_id']['required']);
        self::assertTrue($columns['project_code']['required']);
        self::assertTrue($columns['project_name']['required']);
        self::assertTrue($columns['business_unit_code']['required']);
    }

    public function testLinkFieldsAreOptionalSoRecordsExistBeforeAProject(): void
    {
        $columns = (new PartnerProjectCatalogue())->getColumns();

        self::assertFalse($columns['c_link_project_id']['required']);
        self::assertFalse($columns['linked_at']['required']);
        self::assertFalse($columns['group_id']['required']);
    }

    public function testAttributesRoundTripThroughToArray(): void
    {
        $model = new PartnerProjectCatalogue();
        $model->setRawAttributes([
            'id' => 7,
            'api_client_id' => 1,
            'group_id' => 9,
            'external_id' => 'IFS-PRJ-0042',
            'project_code' => 'MCL-0042',
            'project_name' => 'Riverside Depot Refurbishment',
            'business_unit_code' => '10',
            'business_unit_name' => 'London',
            'source_payload_hash' => str_repeat('a', 64),
            'c_link_project_id' => null,
        ]);

        $array = $model->toArray();

        self::assertSame('IFS-PRJ-0042', $array['external_id']);
        self::assertSame('MCL-0042', $array['project_code']);
        self::assertSame('10', $array['business_unit_code']);
        self::assertNull($array['c_link_project_id']);
        self::assertSame(str_repeat('a', 64), $model->source_payload_hash);
    }

    public function testUnlinkedRecordHasNoProjectId(): void
    {
        $model = new PartnerProjectCatalogue();
        $model->setRawAttributes(['external_id' => 'IFS-1', 'c_link_project_id' => null]);

        self::assertNull($model->c_link_project_id);
    }
}
