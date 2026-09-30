<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Docusign extends AbstractMigration
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
        // Create document_signatory table
        $table = $this->table('document_signatory');
        $table->addColumn('document_id', 'integer')
            ->addColumn('signatory_id', 'string', ['limit' => 255])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['document_id', 'signatory_id'], ['unique' => true])
            ->create();

        // Create document_signatory_signer table
        $table = $this->table('document_signatory_signer');
        $table->addColumn('signatory_id', 'integer')
            ->addColumn('signer_user_id', 'integer')
            ->addColumn('signer_status_id', 'integer')
            ->addColumn('signer_updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('signer_created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addIndex('signer_status_id')
            ->addIndex('signatory_id')
            ->create();

        // Create document_signatory_status table and insert data
        $table = $this->table('document_signatory_status');
        $table->addColumn('uid', 'string', ['limit' => 255])
            ->addColumn('label', 'string', ['limit' => 255])
            ->addIndex(['label', 'uid'], ['unique' => true])
            ->create();

        // Inserting data
        $data = [
            ['id' => 3, 'uid' => 'declined', 'label' => 'Declined'],
            ['id' => 2, 'uid' => 'pending', 'label' => 'Pending'],
            ['id' => 1, 'uid' => 'signed', 'label' => 'Signed'],
        ];
        $table->insert($data)->save();
    }
}
