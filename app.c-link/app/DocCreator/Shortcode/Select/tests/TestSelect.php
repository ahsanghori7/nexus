<?php

namespace App\DocCreator\Shortcode\Select\tests;

use App\DocCreator\Shortcode\DocumentShortcode;
use App\DocCreator\Shortcode\Select\Select;
use App\DocCreator\Shortcode\Select\SelectEdit;
use App\DocCreator\Shortcode\Select\SelectMultiLabel;
use PHPUnit\Framework\TestCase;

class TestSelect extends TestCase
{

    public function testCanParseOuterTags (): void
    {

        /*
         * Select
         */
        $selectModel = new Select(["0","3","5"]);
        $index = 0;
        $this->assertEquals(0, $selectModel->getSelectedValue($index));


        $selectModel = new Select(["0","3","5"]);
        $index = 1;
        $this->assertEquals(3, $selectModel->getSelectedValue($index));


        $selectModel = new Select(["0","3","5"]);
        $index = 2;
        $this->assertEquals(5, $selectModel->getSelectedValue($index));

        /*
         * Select Edit
         */
        $selectModel = new SelectEdit(["0","3","5"]);
        $index = 0;
        $this->assertEquals(0, $selectModel->getSelectedValue($index));


        $selectModel = new SelectEdit(["0","3","5"]);
        $index = 1;
        $this->assertEquals(3, $selectModel->getSelectedValue($index));


        $selectModel = new SelectEdit(["0","3","5"]);
        $index = 2;
        $this->assertEquals(5, $selectModel->getSelectedValue($index));



        /*
         * Select MultiLabel
         */

        $selectModel = new SelectMultiLabel([
            [
                "selectLabel" => "Select Label 0",
                "showLabel" => "Show Label 0"
            ],
            [
                "selectLabel" => "Select Label 1",
                "showLabel" => "Show Label 1"
            ],
            [
                "selectLabel" => "Select Label 2",
                "showLabel" => "Show Label 2"
            ],
        ]);
        $index = 0;
        $this->assertEquals('Show Label 0', $selectModel->getSelectedValue($index));


        $selectModel = new SelectMultiLabel([
            [
                "selectLabel" => "Select Label 0",
                "showLabel" => "Show Label 0"
            ],
            [
                "selectLabel" => "Select Label 1",
                "showLabel" => "Show Label 1"
            ],
            [
                "selectLabel" => "Select Label 2",
                "showLabel" => "Show Label 2"
            ],
        ]);
        $index = 1;
        $this->assertEquals('Show Label 1', $selectModel->getSelectedValue($index));



        $selectModel = new SelectMultiLabel([
            [
                "selectLabel" => "Select Label 0",
                "showLabel" => "Show Label 0"
            ],
            [
                "selectLabel" => "Select Label 1",
                "showLabel" => "Show Label 1"
            ],
            [
                "selectLabel" => "Select Label 2",
                "showLabel" => "Show Label 2"
            ],
        ]);
        $index = 2;
        $this->assertEquals('Show Label 2', $selectModel->getSelectedValue($index));


    }
}
