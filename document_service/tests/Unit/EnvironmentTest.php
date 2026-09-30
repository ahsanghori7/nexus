<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Infrastructure\Environment;
use PHPUnit\Framework\TestCase;

class EnvironmentTest extends TestCase
{
    private $tempEnvFilePath;

    protected function setUp(): void
    {
        $this->resetEnvironmentValues();
        // Create a temporary file
        $this->tempEnvFilePath = tempnam(sys_get_temp_dir(), 'env');
    }

    protected function tearDown(): void
    {
        $this->resetEnvironmentValues();
        // Remove the temporary file
        if (file_exists($this->tempEnvFilePath)) {
            unlink($this->tempEnvFilePath);
        }
    }

    public function testLoadEnvFileSuccess()
    {
        file_put_contents($this->tempEnvFilePath, "ROFF=payaso\nDAN=DANIEL");
        Environment::loadEnvFile(dirname($this->tempEnvFilePath), basename($this->tempEnvFilePath));
        $this->assertEquals('payaso', Environment::getValue('ROFF'));
        $this->assertEquals('DANIEL', Environment::getValue('DAN'));
    }

    public function testLoadEnvFileNotFound()
    {
        $this->expectException(\Exception::class);
        Environment::loadEnvFile('/invalid/path', 'invalid_file.env');
    }

    public function testLoadEnvFileDuplicateKeys()
    {
        $this->expectException(\Exception::class);
        file_put_contents($this->tempEnvFilePath, "KEY=value1\nKEY=value2");
        Environment::loadEnvFile(dirname($this->tempEnvFilePath), basename($this->tempEnvFilePath));
    }

    public function testLoadEnvFileInvalidLineFormat()
    {
        file_put_contents($this->tempEnvFilePath, "INVALID_LINE_FORMAT");
        Environment::loadEnvFile(dirname($this->tempEnvFilePath), basename($this->tempEnvFilePath));
        $this->assertNull(Environment::getValue('INVALID_LINE_FORMAT'));
    }
    public function testLoadEnvFileIgnoresComments()
    {
        // Writing a mix of valid lines and comment lines
        $content = "ENVIRONMENT=development\n";
        $content .= "# This is a comment\n";
        $content .= "DB_USER=root\n";
        $content .= "# Another comment\n";
        file_put_contents($this->tempEnvFilePath, $content);

        Environment::loadEnvFile(dirname($this->tempEnvFilePath), basename($this->tempEnvFilePath));

        // Asserting that valid keys are set
        $this->assertEquals('development', Environment::getValue('ENVIRONMENT'));
        $this->assertEquals('root', Environment::getValue('DB_USER'));

        // Asserting that comment lines are ignored and not set as keys
        $this->assertNull(Environment::getValue('# This is a comment'));
        $this->assertNull(Environment::getValue('# Another comment'));
    }

    public function testGetValue()
    {
        file_put_contents($this->tempEnvFilePath, "SAMPLE_KEY=sample_value");
        Environment::loadEnvFile(dirname($this->tempEnvFilePath), basename($this->tempEnvFilePath));
        $this->assertEquals('sample_value', Environment::getValue('SAMPLE_KEY'));
        $this->assertNull(Environment::getValue('NON_EXISTING_KEY'));
        $this->assertEquals('default_value', Environment::getValue('NON_EXISTING_KEY', 'default_value'));
    }

    /**
     * @dataProvider castProvider
     */
    public function testCastParsesNumbersBooleansAndStrings(string $value, $expected): void
    {
        $this->assertSame($expected, Environment::cast($value));
    }

    public static function castProvider(): array
    {
        return [
            ['10', 10],
            ['10.5', 10.5],
            ['true', true],
            ['FALSE', false],
            ['plain', 'plain'],
        ];
    }

    public function testGetValueGroupReturnsPrefixedKeys(): void
    {
        $this->setEnvironmentValues([
            'db_host' => 'localhost',
            'db_user' => 'root',
            'cache_driver' => 'redis',
        ]);

        $this->assertSame([
            'host' => 'localhost',
            'user' => 'root',
        ], Environment::getValueGroup('db'));
    }

    public function testIsDockerReflectsEnvFlag(): void
    {
        $this->setEnvironmentValues([]);
        $this->assertFalse(Environment::isDocker());

        $this->setEnvironmentValues(['DOCKERISED' => true]);
        $this->assertTrue(Environment::isDocker());
    }

    /**
     * @dataProvider productionProvider
     */
    public function testIsProductionUsesEnvironmentValue(?string $env, bool $expected): void
    {
        $values = [];
        if ($env !== null) {
            $values['ENVIRONMENT'] = $env;
        }
        $this->setEnvironmentValues($values);

        $this->assertSame($expected, Environment::isProduction());
    }

    public static function productionProvider(): array
    {
        return [
            [null, true],
            ['production', true],
            ['staging', false],
        ];
    }

    private function resetEnvironmentValues(): void
    {
        $this->setEnvironmentValues([]);
    }

    private function setEnvironmentValues(array $values): void
    {
        $ref = new \ReflectionClass(Environment::class);
        $property = $ref->getProperty('values');
        $property->setAccessible(true);
        $property->setValue($values);
    }
}
