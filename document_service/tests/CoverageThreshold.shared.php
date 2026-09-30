<?php
declare(strict_types=1);

$threshold = getenv('COVERAGE_MINIMUM');
$threshold = is_string($threshold) && $threshold !== '' ? (float) $threshold : 50.0;

$reportPath = $argv[1] ?? detectDefaultReportPath();

if (!file_exists($reportPath)) {
    fwrite(STDERR, sprintf("[coverage] Clover report not found at %s\n", $reportPath));
    exit(1);
}

$xmlContent = file_get_contents($reportPath);

if ($xmlContent === false) {
    fwrite(STDERR, "[coverage] Failed to read Clover report\n");
    exit(1);
}

try {
    $xml = new SimpleXMLElement($xmlContent);
} catch (Throwable $exception) {
    fwrite(STDERR, sprintf("[coverage] Invalid Clover report: %s\n", $exception->getMessage()));
    exit(1);
}

$metrics = $xml->project->metrics ?? null;

if ($metrics === null) {
    fwrite(STDERR, "[coverage] Coverage metrics missing from Clover report\n");
    exit(1);
}

function detectDefaultReportPath(): string
{
    $cwd = getcwd() ?: __DIR__;
    $candidates = [
        $cwd . '/coverage/clover.xml',
        $cwd . '/build/logs/clover.xml',
    ];

    foreach ($candidates as $candidate) {
        if (file_exists($candidate)) {
            return $candidate;
        }
    }

    return $candidates[0];
}

function percentage(float $covered, float $total): float
{
    if ($total <= 0) {
        return 100.0;
    }

    return round(($covered / $total) * 100, 2);
}

function calculateCoverage(SimpleXMLElement $metrics, string $coveredAttribute, string $totalAttribute): float
{
    $total = (float) ($metrics[$totalAttribute] ?? 0);
    $covered = (float) ($metrics[$coveredAttribute] ?? 0);

    return percentage($covered, $total);
}

/**
 * @return array{percentage: float, covered: float, total: float}
 */
function calculateClassCoverage(SimpleXMLElement $xml, SimpleXMLElement $metrics): array
{
    $classMetrics = $xml->xpath('//class/metrics');
    if ($classMetrics === false || count($classMetrics) === 0) {
        $total = (float) ($metrics['classes'] ?? 0);
        $covered = (float) ($metrics['coveredclasses'] ?? 0);

        return [
            'percentage' => percentage($covered, $total),
            'covered' => $covered,
            'total' => $total,
        ];
    }

    $total = 0.0;
    $covered = 0.0;
    foreach ($classMetrics as $classMetric) {
        $statements = (float) ($classMetric['statements'] ?? 0);
        $methods = (float) ($classMetric['methods'] ?? 0);
        $coveredStatements = (float) ($classMetric['coveredstatements'] ?? 0);
        $coveredMethods = (float) ($classMetric['coveredmethods'] ?? 0);

        if ($statements > 0 || $methods > 0) {
            $total++;
            if ($coveredStatements >= $statements && $coveredMethods >= $methods) {
                $covered++;
            }
        }
    }

    return [
        'percentage' => percentage($covered, $total),
        'covered' => $covered,
        'total' => $total,
    ];
}

$classCoverage = calculateClassCoverage($xml, $metrics);

if (getenv('COVERAGE_DEBUG') === '1') {
    fwrite(
        STDERR,
        sprintf(
            "[coverage][debug] Classes covered %.0f / %.0f (%.2f%%)\n",
            $classCoverage['covered'],
            $classCoverage['total'],
            $classCoverage['percentage']
        )
    );
}

$coverages = [
    'Line' => calculateCoverage($metrics, 'coveredstatements', 'statements'),
    'Methods' => calculateCoverage($metrics, 'coveredmethods', 'methods'),
    'Classes' => $classCoverage['percentage'],
];

$failing = array_filter(
    $coverages,
    static fn (float $coverage) => $coverage < $threshold
);

if ($failing) {
    $parts = array_map(
        static fn (string $label, float $value) => sprintf('%s %.2f%%', strtolower($label), $value),
        array_keys($failing),
        $failing
    );

    fwrite(
        STDERR,
        sprintf(
            "[coverage] Failing build: %s below required %.2f%%\n",
            implode(', ', $parts),
            $threshold
        )
    );
    exit(1);
}

$parts = array_map(
    static fn (string $label, float $value) => sprintf('%s %.2f%%', strtolower($label), $value),
    array_keys($coverages),
    $coverages
);

fwrite(
    STDOUT,
    sprintf(
        "[coverage] Coverage OK: %s meet minimum %.2f%%\n",
        implode(', ', $parts),
        $threshold
    )
);
