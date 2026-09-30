<?php

namespace Api\Service\SupplyChain;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Core\Service\ExcelService as CoreExcelService;
use Core\Data\Collection;
use Core\Data\Shape;

class ContactReportExcelService extends CoreExcelService {

    //The row index where the quote data starts
    const DATA_ROW_START = 1;

    /**
     * @var array
     */
    protected $headers = [
        ["value" => "Company", "width" => 30, "style" => ["font" => ['bold' => true]]],
        ["value" => "Contact name(s)", "width" => 30, "style" => ["font" => ['bold' => true]]],
        ["value" => "Contact number", "width" => 20, "style" => ["font" => ['bold' => true]]],
        ["value" => "Contact email", "width" => 20, "style" => ["font" => ['bold' => true]]],
    ];

    /**
     * @param string $label
     * @param int $budget
     */
    public function __construct(Collection $data) {
        parent::__construct();
        $this->supply_chain = $data;

        $this->addStyledRow($this->headers, "A", self::DATA_ROW_START);
    }


    /**
     * @param Collection $quotes
     * @return void
     */
    public function render() {
        $rowStart = self::DATA_ROW_START + 1;
        $sheet = $this->spreadsheet->getActiveSheet();

        $rows = [];
        foreach ($this->supply_chain as $item) {

            $name = $item->get('name') ?? '-';
            $user = $item->get('users')?? [];
            $displayName = $user[0]['display_name'] ?? '-';
            $mobile = $item->get('mobile') ?: ($user[0]['contact_number'] ?: '-');
            $email = $user[0]['email'] ?? '-';

            $rows[] = [
                $name,
                $displayName,
                $mobile,
                $email
            ];
        }

        $this->setAlignment("C", "left");
        $sheet->setSelectedCell('A1'); // Explicitly set the selected cell to A1

        if (!empty($rows)) {
            $sheet->fromArray($rows, null, 'A' . $rowStart);
        }

    }
}
