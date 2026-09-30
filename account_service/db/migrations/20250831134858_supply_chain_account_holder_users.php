<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SupplyChainAccountHolderUsers extends AbstractMigration
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

        $accounts = $this->fetchAll("SELECT a.id AS account_id,u.id AS user_id,u.type_id AS user_type_id
                                    FROM account a
                                    JOIN user u ON u.account_id = a.id
                                    WHERE a.type_id IN (3,4)
                                    AND NOT EXISTS (
                                    SELECT 1
                                    FROM user u5
                                    WHERE u5.account_id = a.id
                                    AND u5.type_id = 5
        );");

        foreach($accounts as $account) {
          $this->execute("UPDATE user set type_id = 5 where id = ".$account['user_id']." and account_id = ".$account['account_id']);
        }
    }
}
