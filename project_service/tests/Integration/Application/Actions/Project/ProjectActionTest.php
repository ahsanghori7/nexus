<?php

use Illuminate\Database\Capsule\Manager as Capsule;
use Tests\TestCase;

class ProjectActionTest extends TestCase
{

    public function testProject()
    {
        $app = $this->getAppInstance();

        $req = $this->createRequest('GET', '/v1/project');
        $response = $app->handle($req);
        $this->assertEquals(200, $response->getStatusCode());

        $req = $this->createRequest('GET', '/v1/project/16855');
        $response = $app->handle($req);
        $this->assertEquals(200, $response->getStatusCode());

        $req = $this->createRequest('GET', '/v1/project/1234567890123');
        $response = $app->handle($req);
        $this->assertEquals(404, $response->getStatusCode());
    }

    /**
     * The default leftJoin (and its leftJoinSub replacement for history=latest) must keep tenders
     * with zero tender_history rows in the response. Creates its own tender under project 16855
     * (seeded by tests/SetupDatabase.php in every environment) rather than assuming some existing
     * tender happens to have no history — that assumption doesn't hold across environments (a local
     * dev DB seeded with real-ish data vs. CI's minimal fixture have different tenders/history).
     */
    public function testGetProcurementLatestHistoryPreservesTendersWithoutHistory()
    {
        $app = $this->getAppInstance();

        $tenderId = Capsule::table('tender')->insertGetId([
            'project_id' => 16855,
            'label' => 'Integration test - no history - ' . uniqid(),
            'reference_no' => '',
            'is_custom' => 0,
        ]);

        try {
            $req = $this->createRequest('GET', '/v1/project/16855/procurement');
            $req = $req->withUri($req->getUri()->withQuery('history=latest'));
            $response = $app->handle($req);
            $this->assertEquals(200, $response->getStatusCode());

            $body = json_decode((string) $response->getBody(), true);
            $tenders = $body['data'][16855]['tender'] ?? [];

            $this->assertArrayHasKey($tenderId, $tenders, 'Tender with no tender_history rows should still be present');
            $this->assertArrayNotHasKey('Interest', $tenders[$tenderId]);
            $this->assertArrayNotHasKey('Enquiry', $tenders[$tenderId]);
        } finally {
            Capsule::table('tender')->where('id', $tenderId)->delete();
        }
    }

    /**
     * MAX(created_at) alone can match more than one row per (tender, type, specialist) group when
     * two entries share a timestamp — this happens in real data (see OPV2-1095's benchmark: a tender
     * in the shared dev DB has two rows tied on created_at, though they happen to carry identical
     * status_id/meta, which wouldn't prove which row actually won). Creates its own tender and two
     * tender_history rows that tie on created_at but differ in status_id/meta, to prove the
     * deterministic tie-break (created_at desc, then id desc) picked the higher-id row specifically —
     * self-contained so it doesn't depend on incidental data that differs between environments.
     */
    public function testGetProcurementLatestHistoryResolvesTimestampTiesDeterministically()
    {
        $app = $this->getAppInstance();

        $tenderId = Capsule::table('tender')->insertGetId([
            'project_id' => 16855,
            'label' => 'Integration test - tie break - ' . uniqid(),
            'reference_no' => '',
            'is_custom' => 0,
        ]);
        $specialistId = 900000001; // synthetic id, chosen to avoid colliding with real specialist data
        $tiedCreatedAt = '2020-01-01 00:00:00';

        $olderRowId = Capsule::table('tender_history')->insertGetId([
            'tender_id' => $tenderId,
            'specialist_id' => $specialistId,
            'tender_history_type' => 'Interest',
            'status_id' => 1, // sent
            'author_id' => null,
            'meta' => '{"marker":"lower-id"}',
            'created_at' => $tiedCreatedAt,
        ]);
        $newerRowId = Capsule::table('tender_history')->insertGetId([
            'tender_id' => $tenderId,
            'specialist_id' => $specialistId,
            'tender_history_type' => 'Interest',
            'status_id' => 10, // added
            'author_id' => null,
            'meta' => '{"marker":"higher-id"}',
            'created_at' => $tiedCreatedAt,
        ]);
        self::assertGreaterThan($olderRowId, $newerRowId, 'test setup requires the second insert to receive the higher id');

        try {
            $req = $this->createRequest('GET', '/v1/project/16855/procurement');
            $req = $req->withUri($req->getUri()->withQuery('history=latest'));
            $response = $app->handle($req);
            $this->assertEquals(200, $response->getStatusCode());

            $body = json_decode((string) $response->getBody(), true);
            $entry = $body['data'][16855]['tender'][$tenderId]['Interest'][$specialistId] ?? null;

            $this->assertNotNull($entry);
            $this->assertArrayNotHasKey('history', $entry, 'history=latest must not return the full history array');
            $this->assertSame(
                10,
                $entry['last_status'],
                'the higher-id row (status_id=10) must win the tie, not the lower-id row (status_id=1)'
            );
            $this->assertSame('{"marker":"higher-id"}', $entry['last_history']['meta']);
        } finally {
            Capsule::table('tender_history')->whereIn('id', [$olderRowId, $newerRowId])->delete();
            Capsule::table('tender')->where('id', $tenderId)->delete();
        }
    }
}
