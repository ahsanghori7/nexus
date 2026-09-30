<?php
declare(strict_types=1);

namespace Tests\Domain\Email;

use App\Domain\Email\EmailRepository;
use PHPUnit\Framework\TestCase;

final class EmailRepositoryTest extends TestCase
{
    public function testVerifyReturnsTokenWhenItIsValid(): void
    {
        $token = new TokenModelStub(true);
        $repository = new EmailRepositoryDouble($token);

        $result = $repository->verify('abc123', 2);

        self::assertSame($token, $result);
        self::assertSame([['abc123', 'token']], $token->loadCalls);
        self::assertSame([2], $token->isValidCalls);
    }

    public function testVerifyThrowsWhenTokenInvalid(): void
    {
        $token = new TokenModelStub(false);
        $repository = new EmailRepositoryDouble($token);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid Token');

        $repository->verify('bad-hash', 9);
    }
}

final class EmailRepositoryDouble extends EmailRepository
{
    public function __construct(private TokenModelStub $token)
    {
    }

    public function getModel(string $name = ""): TokenModelStub
    {
        if ($name !== 'token') {
            throw new \InvalidArgumentException("Unexpected model {$name}");
        }

        return $this->token;
    }
}

final class TokenModelStub
{
    public array $loadCalls = [];
    public array $isValidCalls = [];

    public function __construct(private bool $isValid)
    {
    }

    public function load(string $value, string $field): self
    {
        $this->loadCalls[] = [$value, $field];
        return $this;
    }

    public function isValid(int $type): bool
    {
        $this->isValidCalls[] = $type;
        return $this->isValid;
    }
}
