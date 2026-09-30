<?php

    require_once __DIR__ . '/../Token.php';
    use App\Domain\User\Token;

    class TokenTest extends PHPUnit\Framework\TestCase
    {
        public function testCanGenerateToken() {
            $t = (new Token())->generateToken();
            $this->assertTrue(is_string($t));
            $this->assertTrue(strlen($t) === 32);
        }
    }
