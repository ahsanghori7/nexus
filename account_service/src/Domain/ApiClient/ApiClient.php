<?php

declare(strict_types=1);

namespace App\Domain\ApiClient;

use App\Domain\AbstractModel;

class ApiClient extends AbstractModel
{
    /**
     * @var array
     */
    protected $columns = [
        'id' => ['type' => 'int'],
        'provider_id' => ['type' => 'int', 'required' => false],
        'name' => ['type' => 'string', 'required' => true, 'validate' => 'maxlength:100'],
        'client_id' => ['type' => 'string', 'required' => true, 'validate' => 'maxlength:32'],
        'client_secret_hash' => ['type' => 'string', 'required' => true, 'validate' => 'maxlength:255'],
        'account_id' => ['type' => 'int', 'required' => true],
        'scopes' => ['type' => 'text', 'required' => true],
        'active' => ['type' => 'int'],
        'token_ttl_seconds' => ['type' => 'int'],
        'last_used_at' => ['type' => 'string', 'required' => false],
        'created_at' => ['type' => 'string', 'required' => false],
        'updated_at' => ['type' => 'string', 'required' => false],
    ];

    /**
     * @var array
     */
    protected $response_column_blacklist = [
        'client_secret_hash',
    ];

    /**
     * @param string $plainSecret
     * @return bool
     */
    public function verifySecret(string $plainSecret): bool
    {
        $hash = $this->getData('client_secret_hash');
        if (!is_string($hash) || $hash === '') {
            return false;
        }

        return password_verify($plainSecret, $hash);
    }

    /**
     * @return bool
     */
    public function isActive(): bool
    {
        return (int) $this->getData('active') === 1;
    }

    /**
     * @return array
     */
    public function getScopes(): array
    {
        $scopes = $this->getData('scopes');
        if (is_string($scopes) && $scopes !== '') {
            $decoded = json_decode($scopes, true);
            if (is_array($decoded)) {
                return array_values($decoded);
            }
        }

        return [];
    }

    /**
     * @return int
     */
    public function getTokenTtlSeconds(): int
    {
        $ttl = (int) $this->getData('token_ttl_seconds');
        return $ttl > 0 ? $ttl : 1800;
    }
}
