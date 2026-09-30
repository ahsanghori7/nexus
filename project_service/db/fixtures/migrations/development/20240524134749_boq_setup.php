<?php
declare(strict_types=1);

require dirname(__DIR__, 2)."/Fixture.php";

final class BoqSetup extends Fixture
{

    CONST ENVIRONMENT = 'development';

    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        $this->mockup = (new Mockup());
        $this->createProject($this->getMockupData("project/project"));
        $this->createTenders($this->getMockupData("project/tender"));
        $this->createBoqFromTenders();
    }
}
