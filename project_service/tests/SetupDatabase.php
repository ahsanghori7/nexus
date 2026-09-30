<?php
declare(strict_types=1);

$skipVars = ['SKIP_DB', 'SKIP_DB_BOOTSTRAP'];
foreach ($skipVars as $skipVar) {
    if (getenv($skipVar) === '1') {
        fwrite(STDOUT, sprintf('[tests][db] %s=1 detected, skipping database setup.' . "\n", $skipVar));
        return;
    }
}

$envFile = dirname(__DIR__) . '/.env';
if (is_file($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines !== false) {
        foreach ($lines as $line) {
            $line = trim(preg_replace('/^export\s+/', '', $line));
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
            $key = trim($key);
            if ($key === '') {
                continue;
            }
            $value = trim($value);

            if (getenv($key) === false) {
                putenv(sprintf('%s=%s', $key, $value));
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
}

$host = getenv('DB_HOST') ?: 'db';
$port = getenv('DB_PORT') ?: '3306';
$user = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASSWORD') ?: 'password';
$database = getenv('DB_NAME') ?: 'project_service';
$maxAttempts = (int) (getenv('DB_BOOTSTRAP_RETRIES') ?: 30);
$delaySeconds = (int) (getenv('DB_BOOTSTRAP_DELAY') ?: 2);

$dsn = sprintf('mysql:host=%s;port=%s;charset=utf8mb4', $host, $port);
$pdo = null;
$attempt = 0;

while ($attempt < $maxAttempts) {
    $attempt++;
    try {
        $pdo = new PDO(
            $dsn,
            $user,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]
        );
        break;
    } catch (PDOException $exception) {
        fwrite(
            STDERR,
            sprintf(
                "[tests][db] Waiting for database (%d/%d): %s\n",
                $attempt,
                $maxAttempts,
                $exception->getMessage()
            )
        );
        sleep($delaySeconds);
    }
}

if (!$pdo instanceof PDO) {
    fwrite(STDERR, "[tests][db] Unable to connect to database host after retries.\n");
    exit(1);
}

$escapedDatabase = str_replace('`', '``', $database);
$pdo->exec(sprintf('CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', $escapedDatabase));
$pdo = null;

$projectRoot = dirname(__DIR__);
chdir($projectRoot);

$phinxBinary = $projectRoot . '/vendor/bin/phinx';
$phinxConfig = $projectRoot . '/phinx.php';

$command = sprintf(
    'php %s migrate -c %s',
    escapeshellarg($phinxBinary),
    escapeshellarg($phinxConfig)
);

$exitCode = 0;
passthru($command, $exitCode);

if ($exitCode !== 0) {
    fwrite(STDERR, sprintf('[tests][db] Phinx migrate failed with exit code %d.' . PHP_EOL, $exitCode));
    exit($exitCode);
}

$pdo = new PDO(
    sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database),
    $user,
    $password,
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]
);

$pdo->exec(
    "INSERT INTO project (id, name, slug, group_id, author_id, reference, description, region, type, phase, status, created_at, employer_liabilty_insurance, public_product_insurance, professional_indemnity_insurance, pricing_doc_required, gia, archived)
    VALUES (16855, 'Test Project', 'test-project', 1, 1, 'REF-TEST', 'Automated test project', 1, 21, 0, 1, NOW(), 0, 0, 0, 0, '0', 0)
    ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)"
);

$pdo->exec(
    "INSERT INTO tender (id, project_id, label, is_custom, has_document, has_tender_addendum, budget, state, was_suggestion)
    VALUES (27279, 16855, 'Test Tender', 0, 0, 0, 100000, 1, 0)
    ON DUPLICATE KEY UPDATE label = VALUES(label)"
);

$pdo->exec(
    "INSERT INTO transaction (id, tender_id, subcontractor_id, type_id, compliant, price, price_selected, measured_work, prelims, other_items, programme, order_price, status_id, archived)
    VALUES (1, 27279, 1, 1, 1, 50000, 0, 0, 0, 0, '0.00', 0, 1, 0)
    ON DUPLICATE KEY UPDATE price = VALUES(price)"
);

$pdo->exec(
    "INSERT INTO instruction (id, transaction_id, type_id, price, description, status, date)
    VALUES (1, 1, 1, 1000, 'Test instruction', 1, NOW())
    ON DUPLICATE KEY UPDATE description = VALUES(description)"
);
