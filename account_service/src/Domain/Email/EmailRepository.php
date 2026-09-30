<?php

declare(strict_types=1);

namespace App\Domain\Email;

use App\Domain\AbstractRepository;
use App\Domain\Email\EmailBlacklisted;
use App\Domain\Email\EmailLog;
use App\Domain\Email\Email;
use App\Domain\User\Token;
use App\Domain\User\TokenType;
use App\Domain\User\User;

/**
 * Class EmailRepository
 * @package App\Domain\Email
 */
class EmailRepository extends AbstractRepository
{
    /**
     * @var string[]
     */
    protected $models = [
        "email" => Email::class,
        "emailBlacklist" => EmailBlacklisted::class,
        "emailLog" => EmailLog::class,
        "emailTypeEvent" => EmailTypeEvent::class,
        "token" => Token::class,
        "user" => User::class,
        "tokenType" => TokenType::class,
    ];

    /**
     * @param string $token_hash
     * @param int $token_type
     * @return mixed
     * @throws \Exception
     */
    public function verify(string $token_hash, int $token_type = 0)
    {
        $token = $this->getmodel('token')->load($token_hash, "token");
        if ($token->isValid($token_type)) {
            return $token;
        }
        throw new \Exception("Invalid Token");
    }
}
