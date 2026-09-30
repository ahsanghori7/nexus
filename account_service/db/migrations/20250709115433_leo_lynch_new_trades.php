<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class LeoLynchNewTrades extends AbstractMigration
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
            "Crane Operator"                        => 1,
            "Lifting Equipment Placing"             => 1 ,
            "Slinger / Banksman"                    => 1,
            "Forklift / Forklift Driver"            => 1,
            "Insulation Engineer"                   => 5,
            "NDT Technician"                        => 5,
            "Flushing Contractor"                   => 18,
            "Syphonic Pipe Installation"            => 18,
            "Industrial Machine Moving Specialists" => 18,
            "Hot Tapping"                           => 18,
            "Pipefreezing"                          => 18,
            "Pocket and Flow Meter Insertion"       => 18,
            "Waterstorage Tanks"                    => 18,
            "Commissioning"                         => 18,
            "Precision Engineers"                   => 18,
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
