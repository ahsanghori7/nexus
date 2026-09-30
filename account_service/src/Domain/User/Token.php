<?php

namespace App\Domain\User;

use App\Domain\Account\Account;
use App\Domain\AbstractTypedModel;

/**
 * Class Token
 * @package App\Domain\User
 */
class Token extends AbstractTypedModel
{
    /*
    * @var AbstractTypeModel
    */
    protected $typeModel = TokenType::class;

    /**
     * @var array
     */
    protected $columns = [
        'id',
        'user_id',
        'token',
        'active',
        'expires',
        'expired_at',
        'created_at',
        'token_type_id',
        'token_usage',
        'app',
        'meta'
    ];

    /**
     * @var array
     */
    protected $tokens = [];

    /**
     * @param int $id
     * @param TokenType $tokenType
     * @param int $limit
     * @throws \ReflectionException
     */
    public function loadByUser(int $id, TokenType $tokenType, int $limit = 1): void
    {
        if (method_exists($this, 'getTokens')) {
            $this->data['tokens'] = $this->getTokens($id, $tokenType, $limit);
        }
    }

    /**
     * @param int $hours
     * @return string
     */
    public static function getExpiryTimeStamp(int $hours): string
    {
        return (string)date('Y-m-d H:i:s', strtotime("+$hours hours"));
    }

    /**
     * @param array $values
     * @return array
     */
    public function beforeSave($values, array $array = []): array
    {
        if (!isset($values['token'])) {
            $values['token'] = $this->generateToken();
        }

        if (!isset($values['expires'])) {
            $expiry = $this->getTypeModel()->load(
                $values['token_type_id']
            )->getExpiryHours(1);

            $values['expires'] = $this::getExpiryTimeStamp($expiry);
        }
        return $values;
    }

    /**
     * @param int $len
     * @return string
     */
    public function generateToken(int $len = 16): string
    {
        return bin2hex(openssl_random_pseudo_bytes($len));
    }

    /**
     * @return Token
     * @throws \Exception
     */
    public function renew(): Token
    {
        if (!$this->isLoaded()) {
            throw new \Exception('Failed to renew token');
        }

        $expiry = $this->getTypeModel()->load(
            $this->data['token_type_id']
        )->getExpiryHours();

        $data = [
            'id' => $this->data['id'],
            'user_id' => $this->data['user_id'],
            'token' => $this->data['token'],
            'expires' => $this::getExpiryTimeStamp($expiry),
            'active' => 1,
            'token_type_id' => $this->data['token_type_id']
        ];

        $this->data = [];

        return $this->save($data);
    }

    /**
     *
     */
    public function loadUser($loadAccount = false): Token
    {
        if ($this->isLoaded()) {

            $this->children['user'] = (new User())->load($this->getData('user_id'));
            $aid = $this->children['user']->getData("account_id");
            if ($meta = $this->getMeta()) {
                if (isset($meta["ghost"])) {
                    $this->children['ghost'] = (new User())->load((int) $meta["ghost"]);
                    $aid = $this->children['ghost']->getData("account_id");
                }
            }

            if ($loadAccount) {
                $this->children['account'] = (new Account())->load($aid);
                $this->children['account']->loadMembership();
            }
        }
        return $this;
    }

    /**
     * @return array|mixed|object|void
     */
    public function getMeta()
    {
        $meta = $this->getData("meta");
        if ($meta) {
            return json_decode($meta, true);
        }
        return;
    }

    /**
     * @param User $user
     * @return $this
     */
    public function setUser(User $user)
    {
        $this->children['user'] = $user;
        return $this;
    }

    /**
     * @return false|mixed
     */
    public function getUser()
    {
        return $this->children["user"] ??  false;
    }

    /**
     * @throws \Exception
     */
    public function setTokenInactive(): void
    {
        $this->data['active'] = 0;
        $this->data['expired_at'] = $this::getExpiryTimeStamp(0);
        $this->save($this->data);
    }

    public function incrementTokenUsage(): void
    {
        $this->data['token_usage'] += 1;
        $this->save($this->data);
    }

    /**
     * @param int $user_id
     * @param TokenType $type
     * @return $this
     * @throws \App\Domain\DomainException
     */
    public function createActivationLink(int $user_id, TokenType $type)
    {
        $data = [
          'user_id' => $user_id,
          'token' => $this->generateToken(),
          'expires' => $this::getExpiryTimeStamp($type->getExpiryHours(24)),
          'active' => 1,
          'token_type_id' => $type->getId()
        ];

        $this->data = [];
        $this->save($data);

        return $this;
    }

    /**
     * @param int $user_id
     * @param TokenType $type
     * @return $this
     * @throws \App\Domain\DomainException
     */
    public function createPaymentRequest(int $user_id, TokenType $type): Token
    {
        $data = [
            'user_id' => $user_id,
            'token' => $this->generateToken(),
            'expires' => $this::getExpiryTimeStamp($type->getExpiryHours(24)),
            'active' => 1,
            'token_type_id' => $type->getId()
        ];

        $this->data = [];
        $this->save($data);

        return $this;
    }

    /**
     * @param int $user_id
     * @param TokenType $type
     * @throws \Exception
     */
    public function resetPassword(int $user_id, TokenType $type)
    {
        $data = [
            'user_id' => $user_id,
            'token' => $this->generateToken(),
            'expires' => $this::getExpiryTimeStamp($type->getExpiryHours(24)),
            'active' => 1,
            'token_type_id' => $type->getId()
        ];

        $this->data = [];
        $this->save($data);

        return $this;
    }

    /**
     * @param int $user_id
     * @param TokenType $type
     * @throws \ReflectionException
     */
    public function loadLatest(int $user_id, TokenType $type): void
    {
        if (method_exists($this->getDb(), 'getRow')) {
            $this->data = $this->getDb()::getRow(
                sprintf('SELECT * FROM %s WHERE %s=? AND %s=? ORDER BY `created_at` DESC LIMIT 1', $this->getName(), 'user_id', 'token_type_id'),
                [$user_id, $type->getId()]
            );
        }
    }

    /**
     * @param int $type
     * @return bool
     */
    public function isType(int $type): bool
    {
        if ($type && (!isset($this->data['token_type_id']) || $this->data['token_type_id'] != $type)) {
            return false;
        }

        return true;
    }

    /**
     * @param int $tokenType
     * @return bool
     */
    public function isValid(int $tokenType = 0): bool
    {
        $active = $this->data['active'] ?? false;
        return $active && !$this->hasExpired() && $this->isType($tokenType);
    }

    /**
     * @return bool
     */
    public function hasExpired(): bool
    {
        $expiry = $this->data['expires'] ?? false;
        if (!strtotime($expiry)) {
            return false;
        }
        return $expiry && strtotime($expiry) < time();
    }

    /**
     * @param array|null $accountRole
     * @return void
     */
    public function setAccountRole(?array $accountRole): void
    {
        $this->children['account_role'] = $accountRole;
    }
}
