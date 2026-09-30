<?php
declare(strict_types=1);

namespace Tests\Domain\User;

use App\Domain\User\User;
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    public function testBeforeSaveHashesPasswordAndSetsDisplayName(): void
    {
        $user = new User();
        $values = [
            'firstname' => 'Bill',
            'lastname' => 'Gates',
            'email' => 'bill.gates@example.com',
        ];

        $result = $user->beforeSave($values, $values + ['password' => 'super-secret']);

        $this->assertArrayHasKey('password', $result);
        $this->assertNotSame('super-secret', $result['password']);
        $this->assertSame('argon2id', password_get_info($result['password'])['algoName']);
        $this->assertSame('Bill Gates', $result['display_name']);
    }

    public function testSetDisplayNameHandlesMissingParts(): void
    {
        $user = new User();

        $this->assertSame('Bill Gates', $user->setDisplayName('Bill', 'Gates'));
        $this->assertSame('Bill', $user->setDisplayName('Bill', ''));
        $this->assertSame('Gates', $user->setDisplayName('', 'Gates'));
    }

    public function testJsonSerializeOmitsSensitiveFields(): void
    {
        $user = new User();
        $user->setData([
            'id' => 1,
            'firstname' => 'Bill',
            'lastname' => 'Gates',
            'email' => 'bill.gates@example.com',
            'password' => 'should-not-leak',
        ]);

        $payload = json_decode(json_encode($user), true);

        $this->assertSame(1, $payload['id']);
        $this->assertArrayNotHasKey('password', $payload);
    }

    public function testValidatePasswordReturnsFalseWhenHashMissing(): void
    {
        $user = new User();
        $this->assertFalse($user->validatePassword('anything'));
    }

    public function testValidatePasswordWithArgonHash(): void
    {
        $hash = password_hash('super-secret', PASSWORD_ARGON2ID);
        $user = (new User())->setData(['password' => $hash]);

        $this->assertTrue($user->validatePassword('super-secret'));
        $this->assertFalse($user->validatePassword('wrong'));
    }

    public function testValidatePasswordWithLegacyMd5Hash(): void
    {
        $user = (new User())->setData(['password' => md5('legacy')]);
        $this->assertTrue($user->validatePassword('legacy'));
        $this->assertFalse($user->validatePassword('wrong'));
    }

    public function testPasswordOldVerifySupportsPortableHashes(): void
    {
        $user = new User();
        $hash = $this->createLegacyHash($user, 'portable', 'abc12345', 8);
        $this->assertTrue($user->password_old_verify('portable', $hash));
        $this->assertFalse($user->password_old_verify('wrong', $hash));
    }

    public function testHasPasswordMigratedThrowsWhenMissingPassword(): void
    {
        $this->expectException(\Exception::class);
        (new User())->hasPasswordMigrated();
    }

    public function testHasPasswordMigratedDetectsPrefix(): void
    {
        $hash = password_hash('foo', PASSWORD_ARGON2ID);
        $user = (new User())->setData(['password' => $hash]);
        $this->assertTrue($user->hasPasswordMigrated());

        $user = (new User())->setData(['password' => md5('bar')]);
        $this->assertFalse($user->hasPasswordMigrated());
    }

    public function testMigratePasswordPersistsNewHashWhenLegacy(): void
    {
        $user = (new RecordingUser())->setData(['password' => 'legacy']);
        $user->migratePassword('new-secret');

        $this->assertCount(1, $user->savedPayloads);
        $payload = $user->savedPayloads[0];
        $this->assertSame(1, $payload['migrated']);
        $this->assertTrue(password_verify('new-secret', $payload['password']));
    }

    public function testMigratePasswordSkipsWhenAlreadyMigrated(): void
    {
        $user = new RecordingUser();
        $user->migrated = true;
        $user->migratePassword('anything');

        $this->assertSame([], $user->savedPayloads);
    }

    private function createLegacyHash(User $user, string $password, string $salt, int $countLog2): string
    {
        $itoa64 = $this->getProtectedProperty($user, 'itoa64');
        $iterations = 1 << $countLog2;
        $hash = md5($salt . $password, true);
        do {
            $hash = md5($hash . $password, true);
        } while (--$iterations);

        return '$P$' . $itoa64[$countLog2] . $salt . $user->legacy_encode64($hash, 16);
    }

    private function getProtectedProperty(User $user, string $property)
    {
        $ref = new \ReflectionClass($user);
        $prop = $ref->getProperty($property);
        $prop->setAccessible(true);
        return $prop->getValue($user);
    }
}

class RecordingUser extends User
{
    public array $savedPayloads = [];
    public bool $migrated = false;

    public function hasPasswordMigrated(): bool
    {
        if ($this->migrated) {
            return true;
        }
        return parent::hasPasswordMigrated();
    }

    public function save(array $data, $insertOnly = false)
    {
        if (!$this->migrated) {
            $processed = $this->beforeSave($this->populate($data), $data);
            $this->savedPayloads[] = $processed;
        }
        return $this;
    }
}
