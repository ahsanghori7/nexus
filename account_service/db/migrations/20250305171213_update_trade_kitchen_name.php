<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateTradeKitchenName extends AbstractMigration
{
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
        $newProjectType = "28";
        $kitchenTrade = $this->fetchRow("SELECT * FROM trade where label = 'Kitchens'");
        $this->table('trade_group')->insert(["type_id" => $newProjectType, "trade_id" => $kitchenTrade["id"]])->save();

        $this->execute("DELETE FROM trade WHERE label = ?", ["Kitchen"]);
    }
}
