<?php

declare(strict_types=1);

namespace App\Domain\User;

use App\Domain\AbstractRepository;
use App\Domain\Account\Account;
use App\Domain\Account\AccountRole;
  use App\Domain\Account\AccountGroup;
use App\Domain\Account\AccountGroupUserMapping;
use App\Domain\Account\AccountRoleUserMapping;

/**
 * Class UserRepository
 * @package App\Domain\User
 */
class UserRepository extends AbstractRepository
{
    /**
     * @var string[]
     */
    protected $models = [
        "user" => User::class,
        "userOrganisation" => UserOrganisation::class,
        "userOrganisationType" => UserOrganisationType::class,
        "type" => UserType::class,
        "token" => Token::class,
        "tokenType" => TokenType::class,
        "tokenIssued" => TokenIssued::class,
        "tokenUsed" => TokenUsed::class,
        "userActionTypes" => UserActionTypes::class,
        "userActionNotifications" => UserActionNotifications::class,
        "role" => Role::class,
        "accountRole" => AccountRole::class,
        "accountRoleUserMapping" => AccountRoleUserMapping::class,
        "accountGroup" => AccountGroup::class,
        "accountGroupUserMapping" => AccountGroupUserMapping::class
    ];

    /**
     * @param string $model
     * @return mixed
     * @throws \Exception
     */
    public function getModel(string $model = "user")
    {
        $cls = $this->models[$model] ?? false;
        if (!$cls) {
            throw new \Exception("Invalid Model $model");
        }
        return new $cls();
    }

    /**
     * @param array $args
     * @return mixed
     * @throws \Exception
     */
    public function create(array $args)
    {
        return $this->getModel()->save($args)->getId();
    }

    /**
     * @param int $id
     */
    public function findById(int $id): void
    {
        // TODO: Implement findById() method.
    }

    /**
     * @param int $id
     * @return bool
     */
    public function deleteById(int $id): bool
    {
        // TODO: Implement deleteById() method.
        return true;
    }

    /**
      * Delete all tokens for a given user
      *
      * @param int $userId
      * @return void
      * @throws \Exception
     */
    public function deleteTokensByUserId(int $userId): void
    {
        $tokenModel = $this->getModel('token');

        // Assuming getDB() is a wrapper around PDO/RedBean that supports exec()
        $db = $tokenModel->getDB();

        if (method_exists($db, 'exec')) {
            $db::exec("DELETE FROM token WHERE user_id = ?", [$userId]);
        }
    }

    /**
     * Withdraws a set of tokens in one statement
     *
     * @param int[] $ids
     * @return int
     * @throws \Exception
     */
    public function setTokensInactiveByIds(array $ids): int
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $ids))));
        if ($ids === []) {
            return 0;
        }

        $tokenModel = $this->getModel('token');
        $db         = $tokenModel->getDB();

        if (!method_exists($db, 'exec')) {
            return 0;
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        return (int) $db::exec(
            "UPDATE token SET active = 0, expired_at = ? WHERE id IN ($placeholders) AND active = 1",
            array_merge([date('Y-m-d H:i:s')], $ids)
        );
    }

    /**
     * @param int $id
     * @param array $args
     * @return bool
     */
    public function updateById(int $id, array $args): bool
    {
        // TODO: Implement updateById() method.
        return true;
    }

    /**
     * @param string $token_hash
     * @throws \Exception
     */
    public function setTokenInactive(string $token_hash): void
    {
        $token = $this->getModel('token')->load($token_hash, 'token');
        $token->setTokenInactive();
    }

    /**
     * @param string $token_hash
     * @throws \Exception
     */
    public function incrementTokenUsage(string $token_hash): void
    {
        $token = $this->getModel('token')->load($token_hash, 'token');
        $token->incrementTokenUsage();
    }

    /**
     * @param string $token_hash
     * @param int $token_type
     * @return mixed
     * @throws \Exception
     */
    public function verify(string $token_hash, int $token_type = 0)
    {
        $token = $this->getmodel('token');
        $token->load($token_hash, 'token');

        if ($token->isValid($token_type)) {
            $token->loadUser(true);

            $userId = (int) $token->getData('user_id');
            $accountRole = $this->getModel('accountRole')
                                ->getUserAccountRoleWithPermissions($userId);
            $token->setAccountRole($accountRole);

            return $token;
        }

        return false;
    }


    /**
     * @param string $email
     * @param string $password
     * @param int $aid
     * @param string $app
     * @return Company|Type|mixed
     * @throws \Exception
     */
    public function login(string $email, string $password, int $aid, string $app = "")
    {

        $token = $this->getModel('token');
        $user = $this->getUser($email);

        if ($user->isLoaded()) {

            $account = $user->getAccount();

            /*
             * If we need to restrict the login access based on the account type id
             */
            if ($aid) {
                if ($aid != $account->getData('type_id')) {
                    return $token;
                }
            }

            /*
             * If the account status is set to inactive
             * we need to send the status response so
             * we can show the notifications to the user
             */
            if (!$account->getData('status')) {
                $token->setData(['status' => 0]);
                return $token;
            }

            $token = $this->createSession($user, $password, $app);
        }

        return $token;
    }

    /**
     * @param string $email
     * @return array|false|mixed
     * @throws \ReflectionException
     */
    public function getUser(string $email)
    {
        $user = $this->getModel()->load($email, "email");
        if (!$user->isLoaded()) {
            $account = (new Account())->load($email, "email");

            if ($account_holder = $account->getAccountHolder()) {
                $user = $account_holder;
                $user->setAccount($account);
            }
        }

        return $user;
    }

    /**
     * Placeholder for the SSO Session Token to allow login without a password, also allows for extension in case we need to log or validate SSO
     * logins
     * @param User $user
     * @param string $app
     * @return Token
     */
    public function createSSOSession(User $user, string $app): Token
    {
        $user->activate();
        return $this->createToken($user, "session", $app);
    }

    /**
     * @param User $user
     * @param TokenType $tokenType
     * @param string $app
     * @return Token
     */
    public function createToken(User $user, string $tokenTypeLabel, string $app): Token
    {

        $tokenType = $this->getModel('tokenType')->load($tokenTypeLabel, 'label');
        if (!$tokenType->isLoaded()) {
            throw new \Exception("Invalid Token Type : $tokenTypeLabel");
        }

        $token = $this->getModel('token');
        $token->loadLatest(
            $user->getId(),
            $tokenType,
        );

        if (!$token->isValid()) {
            $data = [
              'created_at' => date("Y-m-d H:i:s"),
              'user_id' => $user->getId(),
              'token_type_id' => $tokenType->getId(),
            ];
            if ($app) {
                $data['app'] = $app;
            }
            $token = $this->getModel('token')->save($data);
        }

        return $token;
    }

    /**
     * @param User $user
     * @param string $password
     * @param string $app
     * @return mixed
     * @throws \Exception
     */
    public function createSession(User $user, string $password, $app = '')
    {
        $token = $this->getModel('token');

        if ($user->validatePassword($password)) {
            $token_type = $this->getModel('tokenType')->load('session', 'label');
            //update the password with the new hash
            $user->migratePassword($password);
            $token->loadLatest(
                $user->getId(),
                $token_type,
            );
            if (!$token->isValid()) {
                $data = [
                  'created_at' => date("Y-m-d H:i:s"),
                  'user_id' => $user->getId(),
                  'token_type_id' => $token_type->getId(),
                ];
                if ($app) {
                    $data['app'] = $app;
                }
                $token = $this->getModel('token')->save($data);
            }
        }

        return $token;
    }

    /**
     * @param string $email
     * @param string $password
     * @return mixed
     * @throws \ReflectionException
     */
    public function loadByAccount(string $email, string $password)
    {
        $account = (new Account())->load($email, "email");
        if ($account->isLoaded()) {
            $acocunt_holder = $account->getAccountHolder();
            if ($acocunt_holder) {
                $user = $this->getModel()->load($acocunt_holder['email'], "email");
                if ($user->isLoaded()) {
                    return $this->createSession($user, $password);
                }
            }
        }
    }

    /**
     * Loads users by id (or account_id) and groups them by account_id.
     *
     * Each returned row is enriched with:
     *  - "user_type": ["id", "label", "display_label"] resolved from the role table via
     *    the user's account role's role_id, or null when the user has no account role.
     *  - "role": ["id", "label", "description"] resolved from the user's account role
     *    mapping, or null when the user has no account role.
     *
     * @param array $ids
     * @param string $loadBy
     * @return array<int, array<int, array<string, mixed>>> rows keyed by account_id
     * @throws \Exception
     */
    public function getUsersByArray(array $ids, string $loadBy = 'id')
    {
        $ids = array_values(array_filter($ids, 'is_numeric'));
        if (!$ids) {
            return [];
        }
        $ids = array_map('intval', $ids);

        $model = $this->getModel();
        $query = sprintf(
            "SELECT u.* FROM %s u WHERE u.%s IN (%s)",
            $model->getName(),
            $loadBy,
            implode(",", $ids)
        );
        $results = [];
        if (method_exists($model->getDB(), 'getAll')) {
            $results = $model->getDB()::getAll($query);
        }

        if (!$results) {
            return [];
        }

        $accountRolesByUserId = $this->hydrateAccountRoles($results);

        $data = [];
        foreach ($results as $r) {
            $accountRole = $accountRolesByUserId[$r["id"]] ?? null;
            $data[$r["account_id"]][] = [
                "id"             => $r["id"],
                "account_id"     => $r["account_id"],
                "firstname"      => $r["firstname"],
                "lastname"       => $r["lastname"],
                "email"          => $r["email"],
                "type_id"        => $r["type_id"],
                "display_name"   => $r["display_name"],
                "job_title"      => $r["job_title"],
                "contact_number" => $r["contact_number"],
                "migrated"       => $r["migrated"],
                "user_type"      => $accountRole && $accountRole["user_type_id"] ? [
                    "id"            => (int) $accountRole["user_type_id"],
                    "label"         => $accountRole["user_type_label"],
                    "display_label" => $accountRole["user_type_display_label"],
                ] : null,
                "role"           => $accountRole ? [
                    "id"          => (int) $accountRole["account_role_id"],
                    "label"       => $accountRole["account_role_label"],
                    "description" => $accountRole["account_role_description"],
                ] : null,
            ];
        }

        return $data;
    }

    /**
     * Fetches account role rows for the given result set's user ids and indexes
     * them by user id for O(1) lookup while building the response.
     *
     * @param array $results rows returned from the user select query
     * @return array<int, array<string, mixed>> account role rows keyed by user id
     */
    private function hydrateAccountRoles(array $results): array
    {
        $accountRolesByUserId = [];
        $userIds = array_column($results, 'id');
        $accountRoleRows = $this->getModel('accountRole')->getUsersWithAccountRole($userIds) ?: [];
        foreach ($accountRoleRows as $row) {
            $accountRolesByUserId[$row['id']] = $row;
        }

        return $accountRolesByUserId;
    }

}
