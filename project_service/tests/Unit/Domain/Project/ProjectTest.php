<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Project;

use App\Domain\Project\Project;
use PHPUnit\Framework\TestCase;

class ProjectTest extends TestCase
{

    public function testBeforeSave()
    {

        $project = new Project();
        $values = [
            'status' => 3,
            'status_updated_at' => '2022-02-02 15:43:00'
        ];
        $raw = [
            'status' => 4
        ];
        $before_save = $project->beforeSave($values, $raw);
        $this->assertEquals(date("Y-m-d H:i:s"), $before_save['status_updated_at'] ?? null);



        $project = new Project();
        $values = [
            'status' => 3,
            'status_updated_at' => '2022-02-02 15:43:00'
        ];
        $raw = [];
        $before_save = $project->beforeSave($values, $raw);
        $this->assertEquals("2022-02-02 15:43:00", $before_save['status_updated_at'] ?? null);



        $values = [
            'status' => 4,
            'status_updated_at' => '2022-02-02 15:43:00'
        ];
        $raw = [
            'status' => 4
        ];
        $before_save = $project->beforeSave($values, $raw);
        $this->assertEquals('2022-02-02 15:43:00', $before_save['status_updated_at'] ?? null);

    }
}
