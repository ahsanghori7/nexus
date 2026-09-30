<?php

use PHPUnit\Framework\TestCase;
use Api\Service\Boq\ExcelService;
use Core\Data\Shape;
use Core\Data\Collection;
use PhpOffice\PhpSpreadsheet\Style\Border;

class ExcelServiceTest extends TestCase
{
    protected function mockShape(array $data = []): Shape
    {
        $mock = $this->createMock(Shape::class);
        $mock->method('get')->willReturnCallback(fn($key, $default = null) => $data[$key] ?? $default);
        $mock->method('int')->willReturnCallback(fn($key) => $data[$key] ?? 0);
        $mock->method('getCollection')->willReturnCallback(fn($key) => new Collection($data[$key] ?? []));
        return $mock;
    }

    protected function mockQuoteShape(string $name = "Subbie", int $price = 1000, ?bool $bestPrice = true): Shape
    {
        $quoteShape = $this->mockShape([
            'subcontractor' => $this->mockShape(['name' => $name]),
            'price' => $price,
            'programme' => 5,
            'best_price' => $bestPrice,
        ]);

        $quoteShape->method('get')->willReturnCallback(function($key, $default = null) use ($quoteShape) {
            if ($key === 'quote') {
                return new Collection([
                    $this->mockShape([
                        'boq_item_id' => 1,
                        'rate' => 100
                    ])
                ]);
            }
            return $quoteShape->$key ?? $default;
        });

        return $quoteShape;
    }

    public function testConstructorSetsTitleAndHeaders()
    {
        $boq = $this->mockShape([
            'tender.label' => 'Test Package',
            'tender.budget' => 5000
        ]);
        $quotes = new Collection([]);

        $excel = new ExcelService($boq, $quotes);
        $sheet = $excel->write()->getSpreadsheet()->getActiveSheet();

        $this->assertEquals(
            "Compare Quote for \n Test Package \n\n Your total budget for this package is: \n\n £5,000.00",
            $sheet->getCell('A1')->getValue()
        );

        // Check header is set
        $this->assertEquals('ID', $sheet->getCell('A8')->getValue());
    }

    public function testGetMoneyValueFormatsCorrectly()
    {
        $boq = $this->mockShape();
        $quotes = new Collection([]);
        $excel = new ExcelService($boq, $quotes);

        $this->assertEquals('£1,000.00', $excel->getMoneyValue(1000));
        $this->assertEquals('£0.00', $excel->getMoneyValue(0));
    }

    public function testAddSubcontractorsOutputsData()
    {
        $boq = $this->mockShape(['tender.budget' => 1000]);
        $quoteShape = $this->mockQuoteShape("Test Subbie", 750);
        $quotes = new Collection([$quoteShape]);

        $excel = new ExcelService($boq, $quotes);
        $excel->render();

        $sheet = $excel->write()->getSpreadsheet()->getActiveSheet();
        $this->assertEquals("Test Subbie", $sheet->getCell("G2")->getValue());
        $this->assertEquals("Total price", $sheet->getCell("G3")->getValue());
        $this->assertEquals(750, $sheet->getCell("H3")->getValue());
        $this->assertEquals("Best Price", $sheet->getCell("G7")->getValue());
        $this->assertEquals("Rate", $sheet->getCell("G9")->getValue());
    }

    public function testWriteSectionFormatsCorrectly()
    {
        $boq = $this->mockShape(['tender.budget' => 1000]);
        $quotes = new Collection([$this->mockQuoteShape()]);
        $excel = new ExcelService($boq, $quotes);

        $mapping = $this->mockShape([
            'description' => 'groundwork',
            'type' => 'section'
        ]);

        $excel->writeSection($mapping, 10);
        $sheet = $excel->write()->getSpreadsheet()->getActiveSheet();

        $this->assertEquals('Groundwork', $sheet->getCell('B10')->getValue());
    }

    public function testWriteRowWritesValuesCorrectly()
    {
        $boq = $this->mockShape(['tender.budget' => 1000]);
        $subbie = $this->mockQuoteShape();
        $quotes = new Collection([$subbie]);
        $excel = new ExcelService($boq, $quotes);

        $mapping = $this->mockShape([
            'description' => 'excavation',
            'unit_id' => 'm',
            'quantity' => 20,
            'budget_rate' => 50,
            'budget_total' => 1000,
            'item_no' => '1.1',
            'boq_item_id' => 1
        ]);

        $excel->writeRow($mapping, 9);
        $sheet = $excel->write()->getSpreadsheet()->getActiveSheet();

        $this->assertEquals('1.1', $sheet->getCell('A9')->getValue());
        $this->assertEquals('Excavation', $sheet->getCell('B9')->getValue());
        $this->assertEquals(20, $sheet->getCell('C9')->getValue());
        $this->assertEquals('m', $sheet->getCell('D9')->getValue());
        $this->assertEquals(50, $sheet->getCell('E9')->getValue());
        $this->assertEquals(1000, $sheet->getCell('F9')->getValue());
        $this->assertEquals(100, $sheet->getCell('G9')->getValue()); // rate from mock
        $this->assertEquals(2000, $sheet->getCell('H9')->getValue()); // rate * qty
    }
}
