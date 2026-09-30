<?php

namespace Tests\Infrastructure;

use PHPUnit\Framework\TestCase;
use App\Infrastructure\Environment;

class EnvironmentTest extends TestCase
{
    private $tempEnvFilePath;

    protected function setUp(): void
    {
        // Create a temporary file
        $this->tempEnvFilePath = tempnam(sys_get_temp_dir(), 'env');
        $this->resetEnvironmentValues();
    }

    protected function tearDown(): void
    {
        // Remove the temporary file
        if (file_exists($this->tempEnvFilePath)) {
            unlink($this->tempEnvFilePath);
        }
        $this->resetEnvironmentValues();
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
        $previousLogSetting = ini_get('error_log');
        $tempLogFile = tempnam(sys_get_temp_dir(), 'env-log');
        ini_set('error_log', $tempLogFile);

        file_put_contents($this->tempEnvFilePath, "INVALID_LINE_FORMAT");
        Environment::loadEnvFile(dirname($this->tempEnvFilePath), basename($this->tempEnvFilePath));
        $this->assertNull(Environment::getValue('INVALID_LINE_FORMAT'));

        ini_set('error_log', $previousLogSetting ?: '');
        if (file_exists($tempLogFile)) {
            unlink($tempLogFile);
        }
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

    public function testGetValueGroupAggregatesByPrefix(): void
    {
        $contents = "DB_HOST=db\nDB_PORT=3306\nDB_NAME=test_db\nAPI_TOKEN=1\n";
        file_put_contents($this->tempEnvFilePath, $contents);

        Environment::loadEnvFile(dirname($this->tempEnvFilePath), basename($this->tempEnvFilePath));

        $group = Environment::getValueGroup('DB');

        $this->assertSame(
            [
                'HOST' => 'db',
                'PORT' => 3306,
                'NAME' => 'test_db',
            ],
            $group
        );
    }

    public function testIsProductionDefaultsToTrueAndReadsEnvironment(): void
    {
        $this->resetEnvironmentValues();
        $this->assertTrue(Environment::isProduction());

        file_put_contents($this->tempEnvFilePath, "ENVIRONMENT=development");
        Environment::loadEnvFile(dirname($this->tempEnvFilePath), basename($this->tempEnvFilePath));
        $this->assertFalse(Environment::isProduction());
    }

    public function testIsDockerHonoursFlag(): void
    {
        file_put_contents($this->tempEnvFilePath, "DOCKERISED=true");
        Environment::loadEnvFile(dirname($this->tempEnvFilePath), basename($this->tempEnvFilePath));

        $this->assertTrue(Environment::isDocker());
    }

    public function testCastCastsNumericAndBooleanValues(): void
    {
        $this->assertSame(42, Environment::cast('42'));
        $this->assertSame(3.14, Environment::cast('3.14'));
        $this->assertTrue(Environment::cast('true'));
        $this->assertFalse(Environment::cast('FALSE'));
        $this->assertSame('VALUE', Environment::cast('VALUE'));
    }

    private function resetEnvironmentValues(): void
    {
        $reflection = new \ReflectionClass(Environment::class);
        $property = $reflection->getProperty('values');
        $property->setAccessible(true);
        $property->setValue(null, []);
    }

    public function testGetValuesReturnsAllLoadedValues(): void
    {
        file_put_contents($this->tempEnvFilePath, "FOO=bar\nBAZ=qux");
        Environment::loadEnvFile(dirname($this->tempEnvFilePath), basename($this->tempEnvFilePath));

        $values = Environment::getValues();
        $this->assertIsArray($values);
        $this->assertSame('bar', $values['FOO']);
        $this->assertSame('qux', $values['BAZ']);
    }
}
