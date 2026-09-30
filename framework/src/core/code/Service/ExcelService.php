<?php

namespace Core\Service;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
class ExcelService {

    /**
     * Formatting codes for the Excel service, can be passed to the styleCell method
     * @var string
     */
    const FORMAT_FINANCIAL_GBP = "financial_gbp";
    const FORMAT_NUMBER = "number";
    const FORMAT_PERCENTAGE = "percentage";

    /**
     * @var array
     */
    const BORDER_TOP_BOTTOM = [true, false, true, false];
    const BORDER_LEFT_RIGHT = [false, true, false, true];
    const BORDER_ALL = [true, true, true, true];

    /**
     * @var array
     */
    protected $formatting_code = [
        self::FORMAT_FINANCIAL_GBP => '£#,##0.00;[Red]-£#,##0.00',
        self::FORMAT_NUMBER => '0.00;[Red]-0.00',
        self::FORMAT_PERCENTAGE => '0.00%;[Red]-0.00%'
    ];

    /**
     * @var Spreadsheet
     */
    protected $spreadsheet;

    public function __construct() {
        $this->spreadsheet = new Spreadsheet();
    }

    /**
     * @param string $name
     * @return void
     */
    public function addSheet(string $name) {
        $this->spreadsheet->createSheet($name);
    }

    /**
     * @param string $name
     * @return void
     */
    public function setActiveSheet(string $name) {
        $this->spreadsheet->setActiveSheetIndexByName($name);
    }

    /**
     * @param string $column
     * @param int $row
     * @param string $value
     * @return void
     */
    public function setCellValue(string $column, int $row, string $value) {
        $this->spreadsheet->getActiveSheet()->setCellValue($column . $row, $value);
    }

    /**
     * @param array $data
     * @return void
     */
    public function addRow(array $data, String $column, int $row) {
        $this->spreadsheet->getActiveSheet()->fromArray($data, null, $column . $row);
    }

    /**
     * @param array $data
     * @param string $column
     * @param int $row
     * @param array $defaultStyle
     * @return void
     */
    public function addStyledRow(array $data, String $column, int $row, array $defaultStyle = []) {
        $values = array_map(function($value) {
            return $value["value"] ?? "";
        }, $data);
        $this->spreadsheet->getActiveSheet()->fromArray($values, null, $column . $row);
        $startIndex = self::excelColumnToIndex($column);

        foreach($data as $index => $value) {
            $col = self::getExcelColumn($startIndex + $index);
            $this->styleColumn($col, $value);
            $this->styleCell($col . $row, array_merge($defaultStyle, $value));
        }
    }

    /**
     * @param string $column
     * @param array $style
     * @return void
     */
    public function styleColumn(string $column, array $style) {
        if(isset($style["width"])) {
            $this->spreadsheet->getActiveSheet()->getColumnDimension($column)->setWidth((int)$style["width"]);
        }
        if(isset($style["height"])) {
            $this->spreadsheet->getActiveSheet()->getRowDimension($column)->setHeight((int)$style["height"]);
        }
    }

    /**
     * @param string $cell
     * @param array $style
     * @return void
     */
    public function styleCell(string $cell, array $style) {
        if(isset($style["fontSize"])) {
            $this->spreadsheet->getActiveSheet()->getCell($cell)->getStyle()->getFont()->setSize((int)$style["fontSize"]);
        }
        if(isset($style["fontWeight"])) {
            $this->spreadsheet->getActiveSheet()->getStyle($cell)->applyFromArray([
                "font" => [
                    "bold" => true
                ]
            ]);
        }
        if(isset($style["fontColor"])) {
            $this->spreadsheet->getActiveSheet()->getCell($cell)->getStyle()->getFont()->setColor(new Color($style["fontColor"]));
        }
        if(isset($style["backgroundColor"])) {
            $this->spreadsheet->getActiveSheet()->getCell($cell)->getStyle()->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($style["backgroundColor"]);
        }
        if(isset($style["style"])) {
            $this->spreadsheet->getActiveSheet()->getCell($cell)->getStyle()->applyFromArray($style["style"]);
        }
        if (isset($style["format"])) {
            if(!isset($this->formatting_code[$style["format"]])) {
                throw new \Exception("Invalid format code: " . $style["format"]);
            }
            $this->spreadsheet
                ->getActiveSheet()
                ->getStyle($cell)
                ->getNumberFormat()
                ->setFormatCode($this->formatting_code[$style["format"]]);
        }
    }

    /**
     * @param string $start
     * @param string $end
     * @return void
     */
    public function mergeCells(string $start, string $end) {
        $this->spreadsheet->getActiveSheet()->mergeCells($start . ":" . $end);
    }

    /**
     * @param string $cell
     * @param string $hAlignment
     * @param string $vAlignment
     * @return void
     */
    public function setAlignment(string $cell, string $hAlignment = null, string $vAlignment = null) {
        if($hAlignment) {
            $this->spreadsheet->getActiveSheet()
            ->getStyle($cell)->getAlignment()->setHorizontal($hAlignment);
        }
        if($vAlignment) {
            $this->spreadsheet->getActiveSheet()
            ->getStyle($cell)->getAlignment()->setVertical($vAlignment);
        }
    }

    /**
     * @return Xlsx
     */
    public function write() : Xlsx {
        $writer = new Xlsx($this->spreadsheet);
        return $writer;
    }

    /**
     * @param int $index
     * @return string
     */
    public static function getExcelColumn(int $index) : string {
        $column = "";
        while ($index >= 0) {
            $column = chr(65 + ($index % 26)) . $column;
            $index = floor($index / 26) - 1;
        }
        return $column;
    }

    /**
     * @param string $column
     * @return int
     */
    public static function excelColumnToIndex(string $column) : int {
        $column = strtoupper($column); // Ensure uppercase
        $index = 0;

        for ($i = 0; $i < strlen($column); $i++) {
            $index = $index * 26 + (ord($column[$i]) - ord('A') + 1);
        }

        return $index - 1; // Subtract 1 to make it 0-based
    }

    /**
     * @param string $cell
     * @param int $padding
     * @return void
     */
    public function setPadding(string $cell, int $padding) {
        $this->spreadsheet
            ->getActiveSheet()
            ->getStyle($cell)
            ->getAlignment()
            ->setIndent($padding);
    }

    /**
     * @param string $range
     * @param string $border
     * @param string $color
     * @param array $custom
     * @return void
     */
    public function setBorder(string $range, string $border, string $color, array $custom = []) {
        if($custom) {
            list($top, $right, $bottom, $left) = $custom;
            $this->spreadsheet->getActiveSheet()->getStyle($range)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
            $this->spreadsheet->getActiveSheet()->getStyle($range)->getBorders()->getOutline()->setColor(new Color($color));
            if($top) $this->spreadsheet->getActiveSheet()->getStyle($range)->getBorders()->getTop()->setBorderStyle(Border::BORDER_THIN);
            if($right) $this->spreadsheet->getActiveSheet()->getStyle($range)->getBorders()->getRight()->setBorderStyle(Border::BORDER_THIN);
            if($bottom) $this->spreadsheet->getActiveSheet()->getStyle($range)->getBorders()->getBottom()->setBorderStyle(Border::BORDER_THIN);
            if($left) $this->spreadsheet->getActiveSheet()->getStyle($range)->getBorders()->getLeft()->setBorderStyle(Border::BORDER_THIN);

        } else {
            $this->spreadsheet->getActiveSheet()->getStyle($range)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
            $this->spreadsheet->getActiveSheet()->getStyle($range)->getBorders()->getOutline()->setColor(new Color($color));
        }
    }

    /**
     * @param string $start
     * @param string $end
     * @return string
     */
    public static function concatRange(string $start, string $end) {
        return $start . ":" . $end;
    }

    /**
     * @param string $filename
     * @return void
     */
    public function download(string $filename) {
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');
        $writer = $this->write();
        $writer->save('php://output');
        exit();
    }
}
