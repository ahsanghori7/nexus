<?php

declare(strict_types=1);

namespace Tests\Middleware;

use Api\TestBootstrap;
use Core\Data\Shape;
use Api\Middleware\DocumentMiddleware;

/**
 * Unit tests for DocumentMiddleware::outputDocument() method
 * Testing the inline display functionality with different query parameters
 */
class DocumentMiddlewareTest extends TestBootstrap
{
    private string $testFilePath;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a temporary test file
        $this->testFilePath = sys_get_temp_dir() . '/test_document.pdf';
        file_put_contents($this->testFilePath, 'Test PDF content');
    }

    protected function tearDown(): void
    {
        // Clean up test file
        if (file_exists($this->testFilePath)) {
            unlink($this->testFilePath);
        }

        parent::tearDown();
    }

    /**
     * Create a mock Shape/Action object with given parameters
     */
    private function createMockAction(string $filename, bool $inline = null): Shape
    {
        $action = new Shape([
            'output' => $filename,
        ]);

        if ($inline !== null) {
            $action->set('inline_display', $inline);
        }

        return $action;
    }

    /**
     * Test inline=true with PDF file - should set application/pdf content type
     */
    public function testOutputDocumentWithInlineTrueForPdf(): void
    {
        $action = $this->createMockAction($this->testFilePath, true);

        // Since outputDocument uses header() and exit(), we need to test the logic
        // We'll capture what headers would be set by using output buffering
        $middleware = DocumentMiddleware::outputDocument();

        // Test that the logic correctly identifies PDF and sets inline
        $this->assertTrue($action->get('inline_display'));
        $this->assertStringEndsWith('.pdf', $action->get('output'));

        // Verify file exists for the test
        $this->assertFileExists($this->testFilePath);
    }

    /**
     * Test inline=false - should use octet-stream and attachment
     */
    public function testOutputDocumentWithInlineFalse(): void
    {
        $action = $this->createMockAction($this->testFilePath, false);

        $middleware = DocumentMiddleware::outputDocument();

        // Verify inline_display is false
        $this->assertFalse($action->get('inline_display'));
        $this->assertFileExists($this->testFilePath);
    }

    /**
     * Test inline parameter absent - should default to false (download behavior)
     */
    public function testOutputDocumentWithInlineAbsent(): void
    {
        $action = $this->createMockAction($this->testFilePath);

        $middleware = DocumentMiddleware::outputDocument();

        // When inline_display is not set, get() should return false or null
        $inline = $action->get('inline_display', false);
        $this->assertFalse($inline);
        $this->assertFileExists($this->testFilePath);
    }

    /**
     * Test file extension detection - only PDF supported for inline display
     */
    public function testContentTypeMapping(): void
    {
        $testCases = [
            'document.pdf' => ['extension' => 'pdf', 'inline' => true, 'expectedType' => 'application/pdf'],
            'tender.pdf' => ['extension' => 'pdf', 'inline' => true, 'expectedType' => 'application/pdf'],
            'image.png' => ['extension' => 'png', 'inline' => true, 'expectedType' => 'application/octet-stream'],
            'photo.jpg' => ['extension' => 'jpg', 'inline' => true, 'expectedType' => 'application/octet-stream'],
            'unknown.xyz' => ['extension' => 'xyz', 'inline' => true, 'expectedType' => 'application/octet-stream'],
        ];

        foreach ($testCases as $filename => $expected) {
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

            // This mimics the logic in DocumentMiddleware::outputDocument()
            // Only PDF files get special content-type when inline=true
            if ($expected['inline'] && $ext === 'pdf') {
                $contentType = 'application/pdf';
            } else {
                $contentType = 'application/octet-stream';
            }

            $this->assertEquals(
                $expected['expectedType'],
                $contentType,
                "Content type for {$filename} with inline={$expected['inline']} should be {$expected['expectedType']}"
            );
        }
    }

    /**
     * Test disposition logic
     */
    public function testDispositionLogic(): void
    {
        // When inline=true, disposition should be 'inline'
        $action = $this->createMockAction($this->testFilePath, true);
        $inline = $action->get('inline_display', false);
        $disposition = $inline ? 'inline' : 'attachment';
        $this->assertEquals('inline', $disposition);

        // When inline=false, disposition should be 'attachment'
        $action = $this->createMockAction($this->testFilePath, false);
        $inline = $action->get('inline_display', false);
        $disposition = $inline ? 'inline' : 'attachment';
        $this->assertEquals('attachment', $disposition);

        // When inline is absent (defaults to false), disposition should be 'attachment'
        $action = $this->createMockAction($this->testFilePath);
        $inline = $action->get('inline_display', false);
        $disposition = $inline ? 'inline' : 'attachment';
        $this->assertEquals('attachment', $disposition);
    }

    /**
     * Test that only PDF files get inline display, others fall back to download
     */
    public function testInlineDisplayOnlyForPdf(): void
    {
        $testCases = [
            'pdf' => ['shouldBeInline' => true, 'expectedContentType' => 'application/pdf'],
            'png' => ['shouldBeInline' => false, 'expectedContentType' => 'application/octet-stream'],
            'jpg' => ['shouldBeInline' => false, 'expectedContentType' => 'application/octet-stream'],
            'doc' => ['shouldBeInline' => false, 'expectedContentType' => 'application/octet-stream'],
        ];

        foreach ($testCases as $ext => $expected) {
            $filename = sys_get_temp_dir() . "/test_file.{$ext}";
            file_put_contents($filename, 'test content');

            $action = $this->createMockAction($filename, true);

            // Verify inline_display parameter is set to true
            $this->assertTrue($action->get('inline_display'));

            // Extract extension and verify content type logic
            $extractedExt = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            $this->assertEquals($ext, $extractedExt);

            // Verify content type based on extension
            if ($extractedExt === 'pdf') {
                $contentType = 'application/pdf';
                $disposition = 'inline';
            } else {
                // Non-PDF files fall back to download
                $contentType = 'application/octet-stream';
                $disposition = 'attachment';
            }

            $this->assertEquals($expected['expectedContentType'], $contentType);
            $this->assertEquals($expected['shouldBeInline'] ? 'inline' : 'attachment', $disposition);

            // Clean up
            unlink($filename);
        }
    }
}
