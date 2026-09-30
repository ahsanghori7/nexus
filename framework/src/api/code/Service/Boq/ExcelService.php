<?php

namespace Api\Service\Boq;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Core\Service\ExcelService as CoreExcelService;
use Core\Data\Collection;
use Core\Data\Shape;

class ExcelService extends CoreExcelService {

    //The row index where the quote data starts
    const DATA_ROW_START = 8;

    //The RGB value for the section header
    const SECTION_RGB = "F3F3F8";

    /**
     * @var array
     */
    protected $headers = [
        ["value" => "ID", "width" => 10, "style" => ["fontWeight" => true]],
        ["value" => "Description", "width" => 20, "style" => ["fontWeight" => true]],
        ["value" => "Q.ty", "width" => 10, "style" => ["fontWeight" => true]],
        ["value" => "Unit", "width" => 10, "style" => ["fontWeight" => true]],
        ["value" => "Budget Rate", "width" => 15, "style" => ["fontWeight" => true]],
        ["value" => "Budget Total", "width" => 15, "style" => ["fontWeight" => true]],
    ];

    /**
     * @param string $label
     * @param int $budget
     */
    public function __construct(Shape $boq, Collection $quotes, string $currency = "£") {
        parent::__construct();
        $this->boq = $boq;
        $this->budget = ($boq->int("tender.budget") ?? 0) / 100;
        $this->quotes = $quotes;
        $this->currency = $currency;
        //Merge the cells for the title one line above the data
        $this->mergeCells("A1", "F" . self::DATA_ROW_START - 1);
        $this->setAlignment("A1", "center", "center");

        $label = $boq->get("tender.label") ?? "";
        $budgetString = $this->getMoneyValue($this->budget);
        //Add the title Section
        $this->setCellValue("A", 1,
            "Compare Quote for \n $label \n\n Your total budget for this package is: \n\n $budgetString"
        );

        //Add the headers
        $this->addStyledRow($this->headers, "A", self::DATA_ROW_START);
        $this->setBorder("A" . self::DATA_ROW_START . ":F" . self::DATA_ROW_START, Border::BORDER_THIN, "000000", self::BORDER_TOP_BOTTOM);
    }

    /**
     * @param int $value
     * @return string
     */
    public function getMoneyValue(int $value) {
        return $this->currency . number_format($value, 2);
    }

    /**
     * @return void
     */
    protected function addSubcontractors() {
        $subcontractorColumn = "G";
        $rowIndex = 2;
        foreach($this->quotes as $quote) {
            $subcontractorColumnIndex  = CoreExcelService::excelColumnToIndex($subcontractorColumn);
            $subcontractorSecondColumn = CoreExcelService::getExcelColumn($subcontractorColumnIndex + 1);
            //Merge two cells for the subcontractor name and quote data
            $this->mergeCells(
                $subcontractorColumn . $rowIndex,
                $subcontractorSecondColumn . $rowIndex
            );

            $subcontractor = $quote->get("subcontractor")->get("name", "Subcontractor");
            $this->setCellValue($subcontractorColumn, 2, $subcontractor);
            $this->setAlignment($subcontractorColumn . 2, "center", "center");
            $this->setPadding($subcontractorColumn . 2, 10);
            $subcontractorRows = [
                "Total price" => function($quote) {
                    if($quote->int("price") !== 0) {
                        return $quote->int("price") / 100;
                    }
                    return $quote->int("price");
                },
                "Programme Weeks" => "programme",
                "Price vs Budget" => function($quote) {
                    if(($this->budget - $quote->int("price")) !== 0) {
                        return ($this->budget - $quote->int("price")) / 100;
                    }
                    return $this->budget - $quote->int("price");
                }
            ];
            //Add the top level quote data
            foreach($subcontractorRows as $row => $key) {
                $rowIndex++;
                $value = is_callable($key) ? $key($quote) : $quote->get($key);
                //Add the row title
                $this->setCellValue($subcontractorColumn, $rowIndex, $row);
                //Add the row value
                $this->setCellValue(
                    CoreExcelService::getExcelColumn($subcontractorColumnIndex + 1),
                    $rowIndex,
                    $value
                );
                if($row !== "programme") {
                    $this->styleCell(
                        CoreExcelService::getExcelColumn($subcontractorColumnIndex + 1) . $rowIndex,
                        ["format" => self::FORMAT_FINANCIAL_GBP]
                    );
                }
            }

            $this->styleColumn($subcontractorColumn, ["width" => 20]);
            $this->styleColumn(CoreExcelService::getExcelColumn($subcontractorColumnIndex + 1), ["width" => 20]);

            //Increment for the best price row
            $rowIndex++;
            $bestPrice = $quote->get("best_price");
            //Add Best Price Row
            $this->mergeCells(
                $subcontractorColumn . $rowIndex,
                $subcontractorSecondColumn . $rowIndex
            );
            $this->setCellValue($subcontractorColumn, $rowIndex + 1, ($bestPrice) ? "Best Price" : "");

            //Increment for the next row
            $rowIndex++;
            //Leave a blank row for style
            $this->mergeCells(
                $subcontractorColumn . $rowIndex,
                $subcontractorSecondColumn . $rowIndex
            );

            //Last row to set rate and total
            $rowIndex++;
            $this->setCellValue($subcontractorColumn, $rowIndex, "Rate");
            $this->setCellValue($subcontractorSecondColumn, $rowIndex, "Total");


            $this->setBorder(
                CoreExcelService::concatRange($subcontractorColumn . $rowIndex, $subcontractorSecondColumn . $rowIndex),
                Border::BORDER_THIN,
                "000000",
                self::BORDER_TOP_BOTTOM
            );
            //Increment the column by two for the next subcontractor
            $subcontractorColumn = CoreExcelService::getExcelColumn($subcontractorColumnIndex + 2);
            //Reset the start index so all the subcontractors are in the same row
            $rowIndex = 2;
        }
    }

    /**
     * @param Collection $quotes
     * @return void
     */
    public function render() {
        $this->addSubcontractors();
        $entries = $this->boq->getCollection("entries");
        $currentLine = self::DATA_ROW_START;
        foreach($entries as $entry) {
            //Increment the line for the next entry
            $currentLine++;

            $id = $entry->get("id");
            $mappings = $entry->getCollection("item_mappings");
            $mapping = $mappings->first();
            if(count($mappings) > 1) {
                foreach($mappings as $version_mapping) {
                    $version = $version_mapping->int("version");
                    if($version > $mapping->int("version")) {
                        $mapping = $version_mapping;
                    }
                }
            }
            $type = $mapping->get("type");
            if($type == "section") {
                $this->writeSection($mapping, $currentLine);
            }
            else{
                $this->writeRow($mapping, $currentLine);
            }
        }
    }

    /**
     * Write the section description for the item table and each quote column(s)
     * @param Shape $mapping
     * @param int $currentLine
     * @return void
     */
    public function writeSection(Shape $mapping, int $currentLine) {

        $description = ucwords($mapping->get("description"));
        $this->styleCell("A" . $currentLine, ["backgroundColor" => self::SECTION_RGB]);
        $this->mergeCells(
            "B" . $currentLine,
            "F" . $currentLine
        );

        $this->styleCell("B" . $currentLine, ["backgroundColor" => self::SECTION_RGB]);
        $this->setCellValue("B", $currentLine, $description);
        $this->setPadding("B" . $currentLine, 10);
        $currentQuote = "G";
        foreach($this->quotes as $quote) {
            //Merge the cells for the section description per quote
            $this->mergeCells(
                $currentQuote . $currentLine,
                CoreExcelService::getExcelColumn(
                    CoreExcelService::excelColumnToIndex($currentQuote) + 1
                ) . $currentLine
            );

            // Add the background color for each quote
            $this->styleCell($currentQuote . $currentLine, ["backgroundColor" => self::SECTION_RGB, "fontWeight" => true]);
            //Increment the quote column by two for the next quote
            $currentQuote = CoreExcelService::getExcelColumn(
                CoreExcelService::excelColumnToIndex($currentQuote) + 2
            );
        }
    }

    /**
     * Write the row data for the item table
     * @param Shape $mapping
     * @param int $currentLine
     * @return void
     */
    public function writeRow(Shape $mapping, int $currentLine) {

        $description = ucwords($mapping->get("description"));
        $unit_id = $mapping->int("unit_id", 0);
        $unit = "";
        if($unit_id) {
            $unit = $this->boq->get("boq_units")->filter(function($unit) use ($unit_id) {
                return $unit->int("id") === $unit_id;
            })->first();
            $unit = $unit->get("symbol", "");
        }

        $qty = $unit ? $mapping->get("quantity", "") : "";

        /**
         * Write the row data for the item table
         */
        $this->setCellValue("A", $currentLine, $mapping->get("item_no", ""));
        $this->setCellValue("B", $currentLine, $description);
        $this->setCellValue("C", $currentLine, $qty);
        $this->setCellValue("D", $currentLine, $unit);
        $this->setCellValue("E", $currentLine, $mapping->get("budget_rate", 0));
        $this->setCellValue("F", $currentLine, $mapping->get("budget_total", 0));

        $this->styleCell("E" . $currentLine, ["format" => self::FORMAT_FINANCIAL_GBP]);
        $this->styleCell("F" . $currentLine, ["format" => self::FORMAT_FINANCIAL_GBP]);

        /**
         * Write the row data for each quote
         */
        $currentQuote = "G";
        foreach($this->quotes as $subcontractor) {
            $quote = $subcontractor->get("quote");

            $item = $quote->filter(function($item) use ($mapping) {
                return $item->get("boq_item_id") == $mapping->get("boq_item_id");
            })->first();
            //Check the subcontractor has a quote for this item
            if($item->hasData()) {
                $this->setCellValue($currentQuote, $currentLine, $item->get("rate", 0));
                $this->styleCell($currentQuote . $currentLine, ["format" => self::FORMAT_FINANCIAL_GBP]);

                $this->setCellValue(
                    CoreExcelService::getExcelColumn(
                        CoreExcelService::excelColumnToIndex($currentQuote) + 1
                    ), $currentLine,
                    $item->get("rate", 0) * $mapping->get("quantity", 0)
                );
                $this->styleCell(
                    CoreExcelService::getExcelColumn(
                        CoreExcelService::excelColumnToIndex($currentQuote) + 1
                    ) . $currentLine,
                    ["format" => self::FORMAT_FINANCIAL_GBP]
                );
            }

            $currentQuote = CoreExcelService::getExcelColumn(
                CoreExcelService::excelColumnToIndex($currentQuote) + 2
            );
        }
    }
}
