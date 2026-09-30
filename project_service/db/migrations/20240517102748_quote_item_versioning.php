<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class QuoteItemVersioning extends AbstractMigration
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
        $row = $this->fetchRow("SELECT * FROM project_entity_status where label = 'draft'");

        $this->table('boq_quote_item')
            ->addColumn('version',   'integer', ['null' => true, 'default' => 1, 'after' => 'rate'])
            ->addColumn('status_id', 'integer', ['null' => true, 'default' => $row["id"], 'after' => 'version'])
            ->update();

        $this->execute("UPDATE boq_quote_item set status_id = " . $row["id"]);

        $this->table('boq_quote_item')
            ->addForeignKey('status_id', 'project_entity_status', 'id', array('delete'=> 'CASCADE', 'update'=> 'CASCADE'))
            ->update();

    }
}
