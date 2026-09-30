<?php

namespace App\Domain\User;

use App\Domain\AbstractTypeModel;

/**
 * Class TokenType
 * @package App\Domain\User
 */
class TokenType extends AbstractTypeModel{

    /**
     * @var array
     */
    protected $columns = [
        'label',
        'expiry_hours'
    ];

    /**
     * @param int $default
     * @return int
     */
    public function getExpiryHours(int $default = 1) : int {
        return $this->data["expiry_hours"] ?? $default;
    }
}
