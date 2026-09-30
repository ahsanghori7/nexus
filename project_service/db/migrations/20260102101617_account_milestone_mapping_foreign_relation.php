<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AccountMilestoneMappingForeignRelation extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('account_milestone_mapping');

        $table
            ->addForeignKey(
                'milestone_id',
                'milestone',
                'id',
                [
                    'delete' => 'CASCADE',
                    'update' => 'CASCADE',
                ]
            )
            ->update();
    }
}
