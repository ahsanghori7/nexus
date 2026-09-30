<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ProjectTeamMembers extends AbstractMigration
{

    protected $commonConfig = [
        'engine' => 'InnoDB',
        'collation' => 'latin1_general_ci',
        'id' => false,
        'primary_key' => ['id']
    ];

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

        $roles = [
            "Project Director",
            "Commercial Director",
            "Commercial Manager",
            "Quantity Surveyor",
            "Assistant Quantity Surveyor",
            "Procurement Lead",
            "Package Manager",
            "Construction Manager",
            "Project Manager",
            "Site Manager",
            "General Foreman",
            "Site Engineer",
            "Logistics Manager",
            "Design Manager",
            "Technical Coordinator",
            "MEP Manager",
            "Planner",
            "Package Planner",
            "Health & Safety Manager",
            "Health & Safety Advisor",
            "Environmental Manager",
            "Quality Manager",
            "Temporary Works Coordinator",
            "Client Liaison Manager",
            "Employer’s Agent",
            "Legal Counsel",
            "Insurance Manager",
            "Cost Manager",
            "Performance Manager",
            "Community Liaison Manager",
            "Digital Construction Manager",
            "Supply Chain Manager",
            "Pre-Construction Manager"
        ];

        $this->table('project_team_member_role', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('label', 'string', ['limit' => 255, 'null' => false])
            ->create();

        $roleData = array_map(fn($role) => ["label" => $role], $roles);
        $this->table('project_team_member_role')->insert($roleData)->save();

        $this->table('project_team_member_role_mapping', $this->commonConfig)
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('role_id', 'integer', ['null' => false])
            ->addColumn('user_id', 'integer', ['null' => false])
            ->addColumn('project_id', 'integer', ['null' => false])
            ->addColumn('added_date', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('role_id', 'project_team_member_role', 'id', ['delete' => 'NO ACTION', 'update' => 'NO ACTION'])
            ->addForeignKey('project_id', 'project', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }
}
