<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class QuoteVersion extends AbstractMigration
{
    /**
     * Migrate Up.
     */
    public function up()
    {
        $table = $this->table('transaction_document');
        $table->addColumn('quote_version', 'integer', [
            'null' => false,
            'default' => 1,
            'after' => 'transaction_id',
        ])->update();
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $table = $this->table('transaction_document');
        $table->removeColumn('quote_version');
        $table->update();
    }
}
