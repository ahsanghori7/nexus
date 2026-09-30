<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class SupplyChainEmailHashReplace extends AbstractMigration
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
        $prefix = 'c-link';
        $environment = Env::getValue("ENVIRONMENT", "production");
        $accounts = [];
        $rows = $this->fetchAll('SELECT a.*, a.id as aid, u.id, u.email FROM account a LEFT JOIN user u on a.id = u.account_id');
        foreach($rows as $row){
            //if the user email is not a valid email (for example when adding from supply chain their email is a hash address)
            if(!filter_var($row['email'], FILTER_VALIDATE_EMAIL)) {
                $accounts[$row['aid']] = [
                    'meta' => json_decode($row['meta'] ?? '', true),
                    'user' => [
                        'id' => $row['id'],
                        'email' => $row['email']
                    ]
                ];
            }
        }
        $rows = $this->fetchAll('SELECT * FROM supply_chain');
        foreach($rows as $row){
            $account = $accounts[$row['child_id']] ?? null;
            $meta = $account['meta'][$row['parent_id']] ?? null;
            if(!$account || !$meta){
                continue;
            }
            $email = filter_var($meta['email'], FILTER_VALIDATE_EMAIL) ?: filter_var($meta['user']['email'], FILTER_VALIDATE_EMAIL);
            //sanitize email addresses for other environments than production
            if($environment !== 'production'){
                $email = $prefix . $email;
            }
            $this->execute("UPDATE IGNORE user SET email = ? WHERE id = ?", [$email, $account['user']['id']]);
        }
    }
}
