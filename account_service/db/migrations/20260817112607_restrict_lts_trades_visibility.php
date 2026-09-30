<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RestrictLtsTradesVisibility extends AbstractMigration
{
    private const LTS_ACCOUNT_NAME = 'LTS REFURBISHMENT LIMITED';

    private const RESTRICTED_LABELS = ["Joinery (1)", "Joinery (2)", "Joinery (3)", "Joinery (4)"];

    private const TABLES = ['trade', 'attribute'];

    public function up(): void
    {
        foreach (self::TABLES as $tableName) {
            $table = $this->table($tableName);
            if ($table->hasColumn('restricted_account_id')) {
                continue;
            }

            $table
                ->addColumn('restricted_account_id', 'integer', [
                    'null' => true,
                    'signed' => true,
                    'after' => 'label',
                ])
                ->addForeignKey('restricted_account_id', 'account', 'id', [
                    'delete' => 'SET_NULL',
                    'update' => 'NO_ACTION',
                ])
                ->addIndex(['restricted_account_id'])
                ->update();
        }

        $account = $this->fetchRow(sprintf(
            "SELECT id FROM account WHERE name = '%s'",
            self::LTS_ACCOUNT_NAME
        ));

        if (!$account) {
            return;
        }

        $labels = implode(',', array_map(
            fn(string $label) => "'" . $label . "'",
            self::RESTRICTED_LABELS
        ));

        foreach (self::TABLES as $tableName) {
            $this->execute(sprintf(
                'UPDATE %s SET restricted_account_id = %d WHERE label IN (%s)',
                $tableName,
                (int) $account['id'],
                $labels
            ));
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $tableName) {
            $table = $this->table($tableName);
            if (!$table->hasColumn('restricted_account_id')) {
                continue;
            }

            $table
                ->dropForeignKey('restricted_account_id')
                ->removeIndex(['restricted_account_id'])
                ->removeColumn('restricted_account_id')
                ->update();
        }
    }
}
