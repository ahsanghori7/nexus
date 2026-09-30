<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddAuthorIdToShortlistedSubcontractor extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('shortlisted_subcontractor');

        $table
            ->addColumn('author_id', 'integer', [
                'signed' => true,
                'null'   => true,
                'after'  => 'account_id'
            ])
            ->addIndex(['author_id'])
            ->update();
    }

    public function down(): void
    {
        $table = $this->table('shortlisted_subcontractor');

        $table
            ->removeIndex(['author_id'])
            ->removeColumn('author_id')
            ->update();
    }
}
