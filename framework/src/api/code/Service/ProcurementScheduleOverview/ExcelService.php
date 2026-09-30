<?php

namespace Api\Service\ProcurementScheduleOverview;

use Core\Service\ExcelService as CoreExcelService;

class ExcelService extends CoreExcelService {

    const DATA_ROW_START = 3;
    const DATE_FORMAT = 'j M Y';

    // M is index 12 (0-based: A=0 … L=11, M=12); milestones start here
    const MILESTONE_COL_START_INDEX = 12;

    const COLOR_HEADER_FIXED       = 'FF2F4F7F';
    const COLOR_HEADER_MILESTONE   = 'FF1F6B3A';
    const COLOR_PLANNED            = 'FF1F6B3A';
    const COLOR_ACTUAL             = 'FF7B3F00';
    const COLOR_STATUS_IN_PROGRESS = 'FFFFEB9C';
    const COLOR_STATUS_NOT_STARTED = 'FFFFCCCC';
    const COLOR_STATUS_COMPLETED   = 'FFC6EFCE';

    const FIXED_HEADERS = [
        ['value' => 'Ref No.',           'width' => 10],
        ['value' => 'Package',           'width' => 30],
        ['value' => 'Subcontractor',     'width' => 30],
        ['value' => 'Tender Coverage',   'width' => 16],
        ['value' => 'Current Milestone', 'width' => 20],
        ['value' => 'Status',            'width' => 14],
        ['value' => 'Next Milestone',    'width' => 20],
        ['value' => 'Budget £',          'width' => 14],
        ['value' => 'Order Value £',     'width' => 14],
        ['value' => 'Variance £',        'width' => 14],
        ['value' => 'Variance %',        'width' => 12],
        ['value' => 'Order Issued',      'width' => 14],
    ];

    protected array $packages;
    protected array $milestones;

    public function __construct(array $packages, array $milestones_arr) {
        parent::__construct();
        $this->packages = $packages;
        $this->milestones = $milestones_arr;
        $this->buildHeaders();
    }

    private function buildHeaders(): void {
        $this->spreadsheet->getActiveSheet()->setTitle('PSO');

        // Row 1: fixed columns A–L
        foreach (self::FIXED_HEADERS as $i => $header) {
            $col = self::getExcelColumn($i);
            $this->setCellValue($col, 1, $header['value']);
            $this->styleColumn($col, $header);
            $this->styleCell($col . '1', ['fontWeight' => true, 'backgroundColor' => self::COLOR_HEADER_FIXED, 'fontColor' => 'FFFFFFFF']);
        }

        // Rows 1 + 2: milestone group headers (merged column pairs)
        foreach ($this->milestones as $i => $label) {
            $plannedIdx = self::MILESTONE_COL_START_INDEX + ($i * 2);
            $actualIdx  = $plannedIdx + 1;
            $plannedCol = self::getExcelColumn($plannedIdx);
            $actualCol  = self::getExcelColumn($actualIdx);

            // Row 1: milestone name spanning both columns
            $this->setCellValue($plannedCol, 1, str_replace('_', ' ', $label));
            $this->mergeCells("{$plannedCol}1", "{$actualCol}1");
            $this->styleCell("{$plannedCol}1", ['fontWeight' => true, 'backgroundColor' => self::COLOR_HEADER_MILESTONE, 'fontColor' => 'FFFFFFFF']);
            $this->setAlignment("{$plannedCol}1", 'center');
            $this->styleColumn($plannedCol, ['width' => 14]);
            $this->styleColumn($actualCol, ['width' => 14]);

            // Row 2: Planned / Actual sub-headers
            $this->setCellValue($plannedCol, 2, 'Planned');
            $this->setCellValue($actualCol, 2, 'Actual');
            $this->styleCell("{$plannedCol}2", ['fontWeight' => true, 'backgroundColor' => self::COLOR_PLANNED, 'fontColor' => 'FFFFFFFF']);
            $this->styleCell("{$actualCol}2", ['fontWeight' => true, 'backgroundColor' => self::COLOR_ACTUAL, 'fontColor' => 'FFFFFFFF']);
        }

        // "Start on Site" header after all milestone columns
        $startOnSiteIdx = self::MILESTONE_COL_START_INDEX + (count($this->milestones) * 2);
        $startOnSiteCol = self::getExcelColumn($startOnSiteIdx);
        $this->setCellValue($startOnSiteCol, 1, 'Start on Site');
        $this->styleColumn($startOnSiteCol, ['width' => 14]);
        $this->styleCell("{$startOnSiteCol}1", ['fontWeight' => true, 'backgroundColor' => self::COLOR_HEADER_FIXED, 'fontColor' => 'FFFFFFFF']);

        $columnFormats = [
            'H' => '#,##0.00;[Red]-#,##0.00',
            'I' => '#,##0.00;[Red]-#,##0.00',
            'J' => '#,##0.00;[Red]-#,##0.00',
            'K' => '+General"%";[Red]General"%";0"%"',
        ];
        foreach ($columnFormats as $col => $formatCode) {
            $this->spreadsheet->getActiveSheet()
                ->getStyle($col)
                ->getNumberFormat()
                ->setFormatCode($formatCode);
        }
    }

    public function download(string $filename): void {
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        ini_set('display_errors', '0');
        parent::download($filename);
    }

    public function pennyToNumeric(string $num): float {
        $numStr = str_replace('.', '', $num);
        $testOnlyNumber = str_replace('-', '', $numStr);

        if (strlen($testOnlyNumber) < 3) {
            return (float)$numStr;
        }

        $value = substr($numStr, 0, strlen($numStr) - 2) . '.' . substr($numStr, strlen($numStr) - 2);
        return (float)$value;
    }

    public function render(): void {
        $sheet = $this->spreadsheet->getActiveSheet();
        $row   = self::DATA_ROW_START;

        foreach ($this->packages as $package) {
            $milestonesByLabel = $package['milestones_by_label'] ?? [];

            $variancePercent = (float)($package['variance_percent'] ?? 0);

            $orderIssueDate = $package['order_issue_date'] ?? '-';
            $orderIssueDate = (!empty($orderIssueDate) && $orderIssueDate !== '-')
                ? (new \DateTime($orderIssueDate))->format(self::DATE_FORMAT)
                : '';

            // Fixed columns A–L
            $sheet->fromArray([
                $package['reference_no'] ?? '',
                $package['label'] ?? '',
                $package['subcontractor'] ?? '',
                $package['tender_coverage'] ?? '',
                $package['current_milestone_label'] ?? '',
                $package['current_milestone_status'] ?? '',
                $package['next_milestone_label'] ?? '',
                $this->pennyToNumeric($package['budget'] ?? '0'),
                $this->pennyToNumeric($package['order_value'] ?? '0'),
                $this->pennyToNumeric($package['variance'] ?? '0'),
                $variancePercent,
                $orderIssueDate,
            ], null, 'A' . $row, true);

            $statusColors = [
                'In Progress' => self::COLOR_STATUS_IN_PROGRESS,
                'Not Started' => self::COLOR_STATUS_NOT_STARTED,
                'Completed'   => self::COLOR_STATUS_COMPLETED,
            ];
            $status = $package['current_milestone_status'] ?? '';
            if (isset($statusColors[$status])) {
                $this->styleCell('F' . $row, ['backgroundColor' => $statusColors[$status]]);
            }

            // Milestone date columns (M onwards)
            foreach ($this->milestones as $i => $milestoneLabel) {
                $plannedIdx = self::MILESTONE_COL_START_INDEX + ($i * 2);
                $actualIdx  = $plannedIdx + 1;
                $plannedCol = self::getExcelColumn($plannedIdx);
                $actualCol  = self::getExcelColumn($actualIdx);

                $milestone = $milestonesByLabel[$milestoneLabel] ?? null;

                $planned = '';
                $actual  = '';
                if ($milestone) {
                    $planned = !empty($milestone['planned_end_date'])
                        ? (new \DateTime($milestone['planned_end_date']))->format(self::DATE_FORMAT)
                        : '';
                    $actual = !empty($milestone['actual_end_date'])
                        ? (new \DateTime($milestone['actual_end_date']))->format(self::DATE_FORMAT)
                        : '';
                }

                $sheet->setCellValue($plannedCol . $row, $planned);
                $sheet->setCellValue($actualCol . $row, $actual);
            }

            // "Start on Site" value after all milestone columns
            $startOnSiteIdx = self::MILESTONE_COL_START_INDEX + (count($this->milestones) * 2);
            $startOnSiteCol = self::getExcelColumn($startOnSiteIdx);
            $sheet->setCellValue($startOnSiteCol . $row,
                !empty($package['start_on_site'])
                    ? (new \DateTime($package['start_on_site']))->format(self::DATE_FORMAT)
                    : ''
            );

            $row++;
        }

        $sheet->setSelectedCell('A1');
    }
}
