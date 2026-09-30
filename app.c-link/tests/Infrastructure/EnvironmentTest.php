<?php

namespace Infrastructure;

use PHPUnit\Framework\TestCase;
use App\core\Environment;

class EnvironmentTest extends TestCase
{
    private $tempEnvFilePath;

    protected function setUp(): void
    {
        // Create a temporary file
        $this->tempEnvFilePath = tempnam(sys_get_temp_dir(), 'env');
    }

    protected function tearDown(): void
    {
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
        $content = "TEST_ENVIRONMENT=development\n";
        $content .= "# This is a comment\n";
        $content .= "TEST_DB_USER=root\n";
        $content .= "# Another comment\n";
        file_put_contents($this->tempEnvFilePath, $content);

        Environment::loadEnvFile(dirname($this->tempEnvFilePath), basename($this->tempEnvFilePath));

        // Asserting that valid keys are set
        $this->assertEquals('development', Environment::getValue('TEST_ENVIRONMENT'));
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
}
