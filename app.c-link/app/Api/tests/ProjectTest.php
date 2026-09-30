<?php

use PHPUnit\Framework\TestCase;
use App\Api\Project;

class ProjectTest extends TestCase
{
    public function testGetTrades()
    {
        $packages = [
            ["id" => 185, "label" => "Ground Work", "trades" => [185 => "Ground Work"]],
            ["id" => 196, "label" => "Brick Work / Block Work", "trades" => [196 => "Brick Work / Block Work"]],
            ["id" => 278, "label" => "Structural Steelwork", "trades" => [278 => "Structural Steelwork"]],
            ["id" => 118, "label" => "Hard Landscaping", "trades" => [118 => "Hard Landscaping"]],
            ["id" => 256, "label" => "Single Ply / Flat Roofing", "trades" => [256 => "Single Ply / Flat Roofing"]],
            ["id" => 157, "label" => "Contract Flooring", "trades" => [157 => "Contract Flooring"]],
            ["id" => 106, "label" => "Timber Doors", "trades" => [106 => "Timber Doors"]]
        ];
        $trades = [
            "185", "196", "278", "118", "256", "157", "106"
        ];

        $values = Project::getTrades($packages, $trades);

        $this->assertEquals([
            "is_custom" => 0,
            "label" => "Ground Work",
            "packages" => [185],
            "service" => null,
            "size" => null,
            "start_on_site" => "",
            "state" => 0,
            "tender_return" => "",
            "send_date" => "",
        ], $values[0], "Invalid minimum trade");
        $this->assertEquals([
            "is_custom" => 0,
            "label" => "Hard Landscaping",
            "packages" => [118],
            "service" => null,
            "size" => null,
            "start_on_site" => "",
            "state" => 0,
            "tender_return" => "",
            "send_date" => "",
        ], $values[3], "Invalid minimum trade");
        $this->assertEquals([
            "is_custom" => 0,
            "label" => "Timber Doors",
            "packages" => [106],
            "service" => null,
            "size" => null,
            "start_on_site" => "",
            "state" => 0,
            "tender_return" => "",
            "send_date" => "",
        ], $values[6], "Invalid minimum trade");
    }

    public function testFormatHistoryItemReturnsEmptyArrayForEmptyInput()
    {
        $this->assertSame([], Project::formatHistoryItem([]));
    }

    public function testFormatHistoryItemFormatsCreatedAtAndDecodesMeta()
    {
        $item = [
            'status_id' => 5,
            'specialist_id' => 42,
            'meta' => '{"contact_name":"Jane Doe"}',
            'created_at' => '2024-03-15 10:00:00',
        ];

        $result = Project::formatHistoryItem($item);

        $this->assertSame('15th Mar 2024', $result['created_at']);
        $this->assertSame('Jane Doe', $result['meta']->contact_name);
        $this->assertSame(5, $result['status_id']);
        $this->assertSame(42, $result['specialist_id']);
    }
}
