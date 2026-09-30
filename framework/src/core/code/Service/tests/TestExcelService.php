<?php

use PHPUnit\Framework\TestCase;
use Core\Service\ExcelService;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;

class ExcelServiceTest extends TestCase
{
    protected ExcelService $excelService;

    protected function setUp(): void
    {
        $this->excelService = new ExcelService();
    }

    public function testSetCellValue()
    {
        $this->excelService->setCellValue('A', 1, 'Test');
        $sheet = $this->excelService->write()->getSpreadsheet()->getActiveSheet();
        $this->assertEquals('Test', $sheet->getCell('A1')->getValue());
    }

    public function testAddRow()
    {
        $row = ['A', 'B', 'C'];
        $this->excelService->addRow($row, 'A', 1);
        $sheet = $this->excelService->write()->getSpreadsheet()->getActiveSheet();
        $this->assertEquals('A', $sheet->getCell('A1')->getValue());
        $this->assertEquals('B', $sheet->getCell('B1')->getValue());
        $this->assertEquals('C', $sheet->getCell('C1')->getValue());
    }

    public function testStyleCellFontWeight()
    {
        $this->excelService->setCellValue('A', 1, 'Bold');
        $this->excelService->styleCell('A1', ['fontWeight' => true]);
        $style = $this->excelService->write()->getSpreadsheet()->getActiveSheet()->getStyle('A1');
        $this->assertTrue($style->getFont()->getBold());
    }

    public function testStyleCellFinancialFormat()
    {
        $this->excelService->setCellValue('B', 1, 1234.56);
        $this->excelService->styleCell('B1', ['format' => ExcelService::FORMAT_FINANCIAL_GBP]);
        $format = $this->excelService->write()->getSpreadsheet()->getActiveSheet()->getStyle('B1')->getNumberFormat()->getFormatCode();
        $this->assertEquals('£#,##0.00;[Red]-£#,##0.00', $format);
    }

    public function testMergeCells()
    {
        $this->excelService->mergeCells('A1', 'C1');
        $merged = $this->excelService->write()->getSpreadsheet()->getActiveSheet()->getMergeCells();
        $this->assertArrayHasKey('A1:C1', $merged);
    }

    public function testSetAlignment()
    {
        $this->excelService->setAlignment('A1', Alignment::HORIZONTAL_RIGHT, Alignment::VERTICAL_TOP);
        $alignment = $this->excelService->write()->getSpreadsheet()->getActiveSheet()->getStyle('A1')->getAlignment();
        $this->assertEquals(Alignment::HORIZONTAL_RIGHT, $alignment->getHorizontal());
        $this->assertEquals(Alignment::VERTICAL_TOP, $alignment->getVertical());
    }

    public function testSetPadding()
    {
        $this->excelService->setPadding('A1', 3);
        $alignment = $this->excelService->write()->getSpreadsheet()->getActiveSheet()->getStyle('A1')->getAlignment();
        $this->assertEquals(3, $alignment->getIndent());
    }

    public function testSetBorderAllSides()
    {
        $range = 'A1';
        $this->excelService->setBorder($range, Border::BORDER_THIN, '000000', ExcelService::BORDER_ALL);
        $borders = $this->excelService->write()->getSpreadsheet()->getActiveSheet()->getStyle($range)->getBorders();
        $this->assertEquals(Border::BORDER_THIN, $borders->getTop()->getBorderStyle());
        $this->assertEquals(Border::BORDER_THIN, $borders->getBottom()->getBorderStyle());
        $this->assertEquals(Border::BORDER_THIN, $borders->getLeft()->getBorderStyle());
        $this->assertEquals(Border::BORDER_THIN, $borders->getRight()->getBorderStyle());
    }

    public function testGetExcelColumn()
    {
        $this->assertEquals('A', ExcelService::getExcelColumn(0));
        $this->assertEquals('Z', ExcelService::getExcelColumn(25));
        $this->assertEquals('AA', ExcelService::getExcelColumn(26));
    }

    public function testExcelColumnToIndex()
    {
        $this->assertEquals(0, ExcelService::excelColumnToIndex('A'));
        $this->assertEquals(25, ExcelService::excelColumnToIndex('Z'));
        $this->assertEquals(26, ExcelService::excelColumnToIndex('AA'));
    }

    public function testConcatRange()
    {
        $this->assertEquals('A1:C3', ExcelService::concatRange('A1', 'C3'));
    }

    public function testInvalidFormatThrowsException()
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage("Invalid format code: fake_format");
        $this->excelService->styleCell('A1', ['format' => 'fake_format']);
    }
}
