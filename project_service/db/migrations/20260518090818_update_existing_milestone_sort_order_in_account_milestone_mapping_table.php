<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateExistingMilestoneSortOrderInAccountMilestoneMappingTable extends AbstractMigration
{
    public function up(): void
    {
        // Update sort_order in account_milestone_mapping to match the order of milestones
        // for each account. This ensures that the sort_order reflects the milestone's
        // position as defined in the milestone table.
        $this->execute(
            "UPDATE account_milestone_mapping am
            JOIN (
                SELECT
                    m.id AS milestone_id,
                    am2.account_id,
                    ROW_NUMBER() OVER (PARTITION BY am2.account_id ORDER BY m.sort_order ASC) AS new_sort_order
                FROM milestone m
                JOIN account_milestone_mapping am2 ON am2.milestone_id = m.id
            ) om ON am.account_id = om.account_id AND am.milestone_id = om.milestone_id
            SET am.sort_order = om.new_sort_order;"
        );
    }
}
