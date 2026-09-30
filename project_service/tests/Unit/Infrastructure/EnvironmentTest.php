<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure;

use App\Infrastructure\Environment;
use PHPUnit\Framework\TestCase;

class EnvironmentTest extends TestCase
{
    /** @var array<int, string> */
    private array $tempFiles = [];

    protected function setUp(): void
    {
        Environment::reset();
        Environment::setLogger(null);
    }

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }
        $this->tempFiles = [];
    }

    public function testLoadEnvFileParsesValuesAndIgnoresComments(): void
    {
        $path = $this->createTempEnv("FOO=bar\n#comment\nNUMBER=42\nBOOLEAN=true\n");
        Environment::loadEnvFile(dirname($path), basename($path));

        self::assertSame('bar', Environment::getValue('FOO'));
        self::assertSame(42, Environment::getValue('NUMBER'));
        self::assertTrue(Environment::getValue('BOOLEAN'));
        self::assertNull(Environment::getValue('#comment'));
    }

    public function testLoadEnvFileMissingThrowsException(): void
    {
        $this->expectException(\Exception::class);
        Environment::loadEnvFile('/tmp', 'does-not-exist');
    }

    public function testDuplicateKeysAllowLastValueToWin(): void
    {
        $path = $this->createTempEnv("KEY=first\nKEY=second\n");
        Environment::loadEnvFile(dirname($path), basename($path));

        self::assertSame('second', Environment::getValue('KEY'));
    }

    public function testInvalidLineIsIgnoredWhileValidKeysLoad(): void
    {
        $fixture = dirname(__DIR__, 3) . '/.env.test.bad';
        Environment::loadEnvFile(dirname($fixture), basename($fixture));

        self::assertSame('present', Environment::getValue('VALID_KEY'));
        self::assertNull(Environment::getValue('INVALID_LINE_FORMAT'));
        self::assertSame('value', Environment::getValue('ANOTHER_KEY'));
    }

    public function testCustomLoggerReceivesInvalidLineWarning(): void
    {
        $path = $this->createTempEnv("KEY=value\nINVALID_LINE");
        $messages = [];
        Environment::setLogger(static function (string $message) use (&$messages): void {
            $messages[] = $message;
        });

        Environment::loadEnvFile(dirname($path), basename($path));

        self::assertNotEmpty($messages);
        self::assertStringContainsString('Invalid line in .env file', $messages[0]);
    }

    public function testLoadingSameFileMultipleTimesIsIdempotent(): void
    {
        $path = $this->createTempEnv("KEY=value\n");
        Environment::loadEnvFile(dirname($path), basename($path));
        Environment::loadEnvFile(dirname($path), basename($path));

        self::assertSame('value', Environment::getValue('KEY'));
    }

    private function createTempEnv(string $contents): string
    {
        $path = tempnam(sys_get_temp_dir(), 'env');
        file_put_contents($path, $contents);
        $this->tempFiles[] = $path;

        return $path;
    }
}
