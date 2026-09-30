<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class DemoRegionalAccounts extends AbstractMigration
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

        $region_groups = $this->fetchAll("SELECT * FROM region_group");
        $regions = [];
        foreach($region_groups as $group){
            $regions[$group['code']] = $group['id'];
        }

        // Insert data into supply_chain_status_type
        $accounts = [
            [
                "name"            => "C-LINK TEST EU",
                "email"           => "testeu@c-link.com",
                "type_id"         => 2,
                "region_group_id" => $regions['EU'],
            ],
            [
                "name"            => "C-LINK TEST NZ",
                "email"           => "testnz@c-link.com",
                "type_id"         => 2,
                "region_group_id" => $regions['NZ'],
            ],
            [
                "name"            => "C-LINK TEST AUS",
                "email"           => "testaus@c-link.com",
                "type_id"         => 2,
                "region_group_id" => $regions['AUS'],
            ],
            [
                "name"            => "PROSPER TEST EU",
                "email"           => "testeu@weallprosper.co.uk",
                "type_id"         => 3,
                "region_group_id" => $regions['EU'],
            ],
            [
                "name"            => "PROSPER TEST NZ",
                "email"           => "testnz@weallprosper.co.uk",
                "type_id"         => 3,
                "region_group_id" => $regions['NZ'],
            ],
            [
                "name"            => "PROSPER TEST AUS",
                "email"           => "testaus@weallprosper.co.uk",
                "type_id"         => 3,
                "region_group_id" => $regions['AUS'],
            ],
        ];
        foreach($accounts as $account){
            $this->table('account')->insert($account)->save();
            $aid = $this->getAdapter()->getConnection()->lastInsertId();
            $this->table('membership')->insert([
                "account_id"      => $aid,
                "subscription_id" => ($account['type_id'] === 2) ? 6 : 10,
            ])->save();
            $this->table('user')->insert([
                "account_id"   => $aid,
                "email"        => $account['email'],
                "firstname"    => $account['name'],
                "lastname"     => "",
                "display_name" => $account['name'],
                "type_id"      => 2,
                "status"       => 1,
                "password"     => Env::getValue("TEST_ACCOUNT_PASSWORD", "testPassPapasitoLindo"),
                "migrated"     => 0
            ])->save();
        }

    }
}
