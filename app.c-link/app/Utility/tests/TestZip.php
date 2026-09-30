<?php

use App\Utility\Zip;
use PHPUnit\Framework\TestCase;


class TestTender extends TestCase {

    public function testCanDirContent() {
        $zip = new Zip(__DIR__ . "/mock/files");
        $files = $zip->getSrcFiles();
        $this->assertEquals(3, count($files));
    }

    public function testThrowErrorOnWrongSource() {
        $zip = new Zip(__DIR__ . "/fail");
        try{
            $files = $zip->getSrcFiles();
        }
        catch(\Exception $e) {

            $this->assertEquals(
                "Invalid zip source (". __DIR__ . "/fail" ."), no folder or file found",
                $e->getMessage()
            );
        }
    }

    public function testCanReWriteSourceAsRoot() {


        $zip = new Zip(__DIR__ . "/mock/files");
        $testPath = __DIR__ . "/mock/files/tester/test.png";
        $this->assertEquals(
            "/files/tester/test.png",
             $zip->rewriteSrcAsRoot($testPath)
        );
    }

    public function testCanCreateZip() {
        $zip = new Zip(__DIR__ . "/mock/files");
        $files = $zip->getSrcFiles();
        $path = __DIR__. "/runs/";

        $zip->create($path, "test.zip");

        $this->assertTrue(file_exists($path . "/test.zip"));
        //unlink($path . "/test.zip");
    }



}
