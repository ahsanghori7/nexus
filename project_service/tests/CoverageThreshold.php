<?php

$sharedPath = dirname(__DIR__, 2) . '/tests/CoverageThreshold.php';
if (file_exists($sharedPath)) {
    require $sharedPath;
    return;
}

$localFallback = __DIR__ . '/CoverageThreshold.shared.php';
if (file_exists($localFallback)) {
    require $localFallback;
    return;
}

fwrite(STDERR, "[coverage] Shared CoverageThreshold.php not found. Please run make sync_coverage_threshold.\n");
exit(1);
