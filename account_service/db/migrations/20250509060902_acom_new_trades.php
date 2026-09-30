<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AcomNewTrades extends AbstractMigration
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
        $trades = [
            "Skips" => 1,
            "Forklift" => 1,
            "Magic Man" => 21
        ];
        foreach($trades as $label => $key)
        {
            $this->table('trade')->insert([
                'label' => $label
            ])->save();
            $tradeId = $this->getAdapter()->getConnection()->lastInsertId();
            $this->table('trade_category_mapping')->insert([
                'trade_id'    => $tradeId,
                'category_id' => $key
            ])->save();

            $this->table('mapping_entities')->insert([
                'label'        => $label,
                'mapping_type' => 1
            ])->save();
        }
    }
}
