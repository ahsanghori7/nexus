<?php

    namespace App\Domain;

    use App\Domain\AbstractModel;


    class MockModel extends AbstractModel {
        protected $columns = [
             'id' => [
                'type' => 'int'
            ],
            'name' => [
                'type' => 'string',
                'required' => true
            ],
            'email' => [
                'type' => 'email',
                'required' => true
            ]
        ];
    }

    class AbstractModelTest extends \PHPUnit\Framework\TestCase
    {
        public function testCanGetFormattedName() {
            $model = new MockModel();
            $name = $model->formatTblName("TestModel");
            $this->assertEquals($name, "test_model");
            $name = $model->formatTblName("Model");
            $this->assertEquals($name, "model");
        }

        public function testCanFilterInvalidCols() {
            $model = new MockModel();
            $test = $model->populate([
                "email" => "test_email",
                "type" => "SubContractor"
            ]);

            $this->assertEquals($test, ["email" => "test_email"]);
            $test = $model->setData(["type" => "SubContractor"])->populate([
                "email" => "test_email"
            ]);
            $this->assertEquals($test, ["email" => "test_email"]);
        }

        public function testCanApplyFilters() {
            $model = new MockModel();
            //Can ignore if no filters
            $sql = $model->applyFilters("SELECT FROM TABLE", []);
            $this->assertEquals($sql, "SELECT FROM TABLE");

            $sql = $model->applyFilters("SELECT FROM TABLE", ["id" => 1]);
            $this->assertEquals($sql, "SELECT FROM TABLE WHERE id = '1'");

            $sql = $model->applyFilters("SELECT FROM TABLE", ["id" => [">", 2]]);
            $this->assertEquals($sql, "SELECT FROM TABLE WHERE id > '2'");

            $sql = $model->applyFilters("SELECT FROM TABLE", ["id" => "[1,2,3,4]"]);
            $this->assertEquals($sql, "SELECT FROM TABLE WHERE id IN(1,2,3,4)");
        }
    }
