<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDisplayLabelToRole extends AbstractMigration
{
    public function up(): void
    {
        // Add display_label column to the role table
        $table = $this->table('role');
        $table->addColumn('display_label', 'string', ['limit' => 255, 'null' => true])
              ->update();

        // Set display_label values based on label
        $roles = [
            'administrator'       => 'Administrator',
            'team_admin'          => 'Team Admin',
            'team_manager'        => 'Team Manager',
            'team_assistant'      => 'Team Member',
            'account_holder'      => 'Account Holder',
            'witness'             => 'Witness',
            'project_team_member' => 'Project Team Member',
            'super_admin'         => 'Super Admin',
            'approver'            => 'Approver',
        ];

        foreach ($roles as $label => $displayLabel) {
            $this->execute(sprintf(
                "UPDATE role SET display_label = '%s' WHERE label = '%s'",
                addslashes($displayLabel),
                addslashes($label)
            ));
        }
    }

    public function down(): void
    {
        // Remove display_label column
        $table = $this->table('role');
        $table->removeColumn('display_label')
              ->update();
    }
}
