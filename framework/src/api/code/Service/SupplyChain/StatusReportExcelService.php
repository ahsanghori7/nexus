<?php

namespace Api\Service\SupplyChain;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Core\Service\ExcelService as CoreExcelService;
use Core\Data\Collection;
use Core\Data\Shape;

class StatusReportExcelService extends CoreExcelService {

    //The row index where the quote data starts
    const DATA_ROW_START = 1;
    private Collection $supply_chain;
    private array $scPqqStatuses;
    private ?int $externalSubcontractorId;

    /**
     * @var array
     */
    protected $headers = [
        ["value" => "Company", "width" => 30, "style" => ["font" => ['bold' => true]]],
        ["value" => "Trades", "width" => 30, "style" => ["font" => ['bold' => true]]],
        ["value" => "Activated", "width" => 10, "style" => ["font" => ['bold' => true]]],
        ["value" => "PQQ Status", "width" => 10, "style" => ["font" => ['bold' => true]]],
    ];

    /**
     * @param string $label
     * @param int $budget
     */
    public function __construct(Collection $data, array $scPqqStatuses, ?int $externalSubcontractorId = null) {
        parent::__construct();
        $this->supply_chain = $data;
        $this->scPqqStatuses = $scPqqStatuses;
        $this->externalSubcontractorId = $externalSubcontractorId;

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
            $trades = $item->get('trades') ?? [];
            $tradeLabels = $trades ? implode(', ', array_column($trades, 'label')) : '-';
            $activated = (intval($item->get('subscription_id')) === $this->externalSubcontractorId) ? 'No' : 'Yes';
            $pqq_status = $this->scPqqStatuses[$item->get('id')] ?? '-';

            $rows[] = [
                $name,
                $tradeLabels,
                $activated,
                $pqq_status
            ];
        }

        $sheet->setSelectedCell('A1'); // Explicitly set the selected cell to A1

        if (!empty($rows)) {
            $sheet->fromArray($rows, null, 'A' . $rowStart);
        }
    }
}
