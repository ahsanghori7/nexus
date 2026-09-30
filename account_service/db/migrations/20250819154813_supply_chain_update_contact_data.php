<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SupplyChainUpdateContactData extends AbstractMigration
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

        //get the subcontractors old details fro mmeta
        $meta_data = $this->fetchAll("SELECT meta,id from account where type_id != 2 and meta != ''");
        $main_contractors_data = [];
        foreach($meta_data as $data) {
            $meta = json_decode($data['meta'], true);
            if($meta) {
                foreach ($meta as $aid => $meta_data) {
                    $main_contractors_data[$data['id']][$aid] = [
                        "firstname" => $meta_data['user']['firstname'] ?? '',
                        "lastname" => $meta_data['user']['lastname'] ?? '',
                        "mobile" => $meta_data['mobile'] ?? '',
                    ];
                }
            }
        }

        $rows = $this->fetchAll("SELECT aum.account_id, u.account_id as said, aum.user_id, u.firstname, u.lastname FROM account_user_mapping as aum LEFT JOIN user u ON u.id = aum.user_id WHERE (u.firstname  != '' or u.lastname != '' or u.contact_number != '')"
        );
        $update_user_mapping = [];
        foreach($rows as $row) {
            //if there are no entries to the old account meta get the default user details from user table
            if(!isset($main_contractors_data[$row['said']][$row['account_id']])) {
                $insert_data = [
                    'account_id' => $row['account_id'],
                    'user_id'    => $row['user_id'],
                    'firstname'  => $row['firstname'] ?? '',
                    'lastname'   => $row['lastname'] ?? '',
                    'mobile'     => $row['contact_number'] ?? '',
                ];
            }
            else{
                $insert_data = [
                    'account_id' => $row['account_id'],
                    'user_id'    => $row['user_id'],
                    'firstname'  => $main_contractors_data[$row['said']][$row['account_id']]['firstname'] ?? '',
                    'lastname'   => $main_contractors_data[$row['said']][$row['account_id']]['lastname'] ?? '',
                    'mobile'     => $main_contractors_data[$row['said']][$row['account_id']]['mobile'] ?? '',
                ];
            }
            $this->execute(sprintf(
                "UPDATE account_user_mapping
                 SET user_firstname = '%s',
                     user_lastname = '%s',
                     user_contact_number = '%s'
                 WHERE account_id = %d AND user_id = %d",
                addslashes(trim($insert_data['firstname'] ?? '')),
                addslashes((trim($insert_data['lastname'] ?? ''))),
                addslashes(substr($insert_data['mobile'] ?? '', 0, 50)),
            (int) $insert_data['account_id'],
                (int) $insert_data['user_id']
            ));
        }
    }
}
