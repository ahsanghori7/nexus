<?php

use App\Models\Project;
use App\Models\User;
use PHPUnit\Framework\TestCase;

class ProjectMock extends Project{

    /**
     * @param Project $project
     * @return int
     */
    public function getTransactionsCount(Project $project): int
    {
        return $this->getData('transaction_count');
    }

}

class TestProject extends TestCase {

    public function testCanProveOwnerShip() {
        $project = new Project(["group_id" => 4]);
        $this->assertEquals(true, $project->isOwner(new User(false, 4, null)));
        $this->assertEquals(false, $project->isOwner(new User(false, 5, null)));
    }

    /**
     * @throws \App\Api\Exception
     */
    public function testGetNextOrderNo(): void
    {
        $project = new ProjectMock();

        $project->setData('transaction_count', 2);
        $this->assertEquals('03', $project->getNextOrderNo($project));


        $project->setData('transaction_count', 0);
        $this->assertEquals('01', $project->getNextOrderNo($project));


        $project->setData('transaction_count', 9);
        $this->assertEquals('10', $project->getNextOrderNo($project));


        $project->setData('transaction_count', 10);
        $this->assertEquals('11', $project->getNextOrderNo($project));


        $project->setData('transaction_count', 99);
        $this->assertEquals('100', $project->getNextOrderNo($project));


        $project->setData('transaction_count', 100);
        $this->assertEquals('101', $project->getNextOrderNo($project));
    }
}
