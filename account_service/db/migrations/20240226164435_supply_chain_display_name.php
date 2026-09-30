<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SupplyChainDisplayName extends AbstractMigration
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
    public function up(): void
    {

        $old_supply_chain_name = [
            '------',
            '-------',
            '--------',
        ];
        $update_data_keys = [
            'firstname',
            'lastname',
            'display_name'
        ];

        $accounts = [];
        $rows = $this->fetchAll('SELECT a.*, a.id as aid, u.id, u.firstname, u.lastname, u.display_name FROM account a LEFT JOIN user u on a.id = u.account_id');
        foreach($rows as $row){
            $accounts[$row['aid']] = [
                'meta' => json_decode($row['meta'] ?? '', true),
                'user' => [
                    'id'           => $row['id'],
                    'firstname'    => (!$row['firstname']    || in_array($row['firstname'],    $old_supply_chain_name, true)),
                    'lastname'     => (!$row['lastname']     || in_array($row['lastname'],     $old_supply_chain_name, true)),
                    'display_name' => (!$row['display_name'] || in_array($row['display_name'], $old_supply_chain_name, true))
                ]
            ];
        }

        $rows = $this->fetchAll('SELECT * FROM supply_chain');

        foreach($rows as $row){
            $account = $accounts[$row['child_id']] ?? null;
            if(!$account){
                continue;
            }
            $meta = $account['meta'][$row['parent_id']]['user'] ?? null;
            foreach($update_data_keys as $key){
                if(isset($meta[$key], $account['user'][$key]) && $account['user'][$key]){
                    if(!in_array($meta[$key], $old_supply_chain_name, true)){
                        $this->execute("UPDATE user SET $key = ? WHERE id = ?", [$meta[$key], $account['user']['id']]);
                    }
                }
            }
        }
    }

}
