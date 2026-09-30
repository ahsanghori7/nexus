<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ACLFeatureFlags extends AbstractMigration
{
    public function up(): void
    {
        // Insert parent ACL feature
        $this->execute("
            INSERT INTO feature (parent_id, name)
            VALUES (NULL, 'ACL')
        ");

        // Get the inserted parent ID
        $aclParentId = $this->fetchRow("
            SELECT id FROM feature WHERE name = 'ACL' ORDER BY id DESC LIMIT 1
        ")['id'];

        // Insert child features
        $this->execute("
            INSERT INTO feature (parent_id, name)
            VALUES
                ($aclParentId, 'ACL_PROJECT_LIST'),
                ($aclParentId, 'ACL_COMPANY_ASSETS'),
                ($aclParentId, 'ACL_COMPANY_PROFILE_VIEW')
        ");
    }

    public function down(): void
    {
        // Delete child features first
        $this->execute("
            DELETE FROM feature
            WHERE name IN (
                'ACL_PROJECT_LIST',
                'ACL_COMPANY_ASSETS',
                'ACL_COMPANY_PROFILE_VIEW'
            )
        ");

        // Then delete the parent ACL feature
        $this->execute("
            DELETE FROM feature
            WHERE name = 'ACL'
        ");
    }
}
