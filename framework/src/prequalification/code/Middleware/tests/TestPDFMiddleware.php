<?php

use PHPUnit\Framework\TestCase;
use Core\Config;
use Core\Router\Route;
use Prequalification\Middleware\PDFMiddleware;
use Core\System\Environment;

class TestPDFMiddleware extends TestCase
{
    protected function setUp(): void
    {
        Environment::setVars([
            'PROSPER_UPGRADE_ACCOUNT_URL' => 'https://app.example.com/upgrade',
            'ASSET_URL' => 'https://assets.example.com/',
            'AWS_S3_ASSET_URL' => 'https://s3.example.com/',
            'CLINK_URL' => 'https://clink.example.com/',
            'PDF_RENDER_ALLOWED_URLS' => 'https://allow.example.com/assets/',
        ]);
    }

    public function testBlocksProtocolRelativeUrl(): void
    {
        $decision = PDFMiddleware::getAssetDecision($this->getAction(), '//evil.example.com/x.png');

        $this->assertFalse($decision['allowed']);
        $this->assertSame('protocol_relative_blocked', $decision['reason']);
    }

    public function testBlocksMetadataEndpoint(): void
    {
        $decision = PDFMiddleware::getAssetDecision($this->getAction(), 'https://169.254.169.254/latest/meta-data');

        $this->assertFalse($decision['allowed']);
        $this->assertSame('blocked_internal_or_metadata_host', $decision['reason']);
    }

    public function testBlocksNonHttpsRemoteAsset(): void
    {
        $decision = PDFMiddleware::getAssetDecision($this->getAction(), 'http://allow.example.com/assets/logo.png');

        $this->assertFalse($decision['allowed']);
        $this->assertSame('non_https_blocked', $decision['reason']);
    }

    public function testAllowsAllowlistedHttpsAsset(): void
    {
        $decision = PDFMiddleware::getAssetDecision($this->getAction(), 'https://allow.example.com/assets/logo.png');

        $this->assertTrue($decision['allowed']);
        $this->assertSame('allowlisted_asset_prefix', $decision['reason']);
    }

    public function testAllowsInternalVarAsset(): void
    {
        $decision = PDFMiddleware::getAssetDecision($this->getAction(), 'var:logo');

        $this->assertTrue($decision['allowed']);
        $this->assertSame('internal_image_var', $decision['reason']);
    }

    private function getAction(): Route
    {
        $action = new Route('default', []);
        $action->set("uriArgs.aid", '17446');
        $action->set("logo.clink", 'https://assets.example.com/clink/logo.png');
        $action->set("logo.company", 'https://assets.example.com/account/company.png');
        $action->set("logo.account", 'https://assets.example.com/account/account.png');

        return $action;
    }
}
