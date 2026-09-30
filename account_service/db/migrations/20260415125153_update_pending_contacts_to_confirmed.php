<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdatePendingContactsToConfirmed extends AbstractMigration
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
    private const STATUS_CONFIRMED = 2;
    private const STATUS_PENDING = 1;

    private const TARGET_ROLES = ['account_holder', 'team_assistant', 'witness'];
    private const TARGET_ACCOUNT_TYPES = ['specialist', 'external_subcontractor'];

    public function up(): void
    {
        $roles = implode("','", self::TARGET_ROLES);
        $accountTypes = implode("','", self::TARGET_ACCOUNT_TYPES);

        $this->execute("
            UPDATE user u
            INNER JOIN role r ON u.type_id = r.id
            INNER JOIN account a ON u.account_id = a.id
            INNER JOIN account_type at ON a.type_id = at.id
            SET u.status = " . self::STATUS_CONFIRMED . "
            WHERE u.status = " . self::STATUS_PENDING . "
            AND r.label IN ('" . $roles . "')
            AND at.label IN ('" . $accountTypes . "')
        ");
    }

    public function down(): void
    {
        $roles = implode("','", self::TARGET_ROLES);
        $accountTypes = implode("','", self::TARGET_ACCOUNT_TYPES);

        $this->execute("
            UPDATE user u
            INNER JOIN role r ON u.type_id = r.id
            INNER JOIN account a ON u.account_id = a.id
            INNER JOIN account_type at ON a.type_id = at.id
            SET u.status = " . self::STATUS_PENDING . "
            WHERE u.status = " . self::STATUS_CONFIRMED . "
            AND r.label IN ('" . $roles . "')
            AND at.label IN ('" . $accountTypes . "')
        ");
    }
}
