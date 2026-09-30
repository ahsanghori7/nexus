<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CleanupHashedEmails extends AbstractMigration
{
    private $csvData = [];
    private $csvFilePath = "/var/www/html/account_service/public/email-cleanup-failure.csv";

    public function up(): void
    {
        $adapter = $this->getAdapter();

        $this->csvData[] = ['User ID', 'User Email', 'Display Name', 'Account ID', 'Account Email', 'Reason'];

        // Get all users with damaged emails (no @ symbol)
        $damagedUsers = $adapter->fetchAll(
            "SELECT id, account_id, display_name, email FROM user WHERE email NOT LIKE '%@%'"
        );

        $failureCount = 0;

        foreach ($damagedUsers as $user) {
            try {
                $userId         = $user['id'];
                $accountId      = $user['account_id'];
                $displayName    = $user['display_name'];
                $currentEmail   = $user['email'];

                $account = $adapter->fetchRow(
                    sprintf("SELECT email FROM account WHERE id = %d", (int)$accountId)
                );

                // Check if account exists
                if (!$account) {
                    $this->addToCsv($userId, $currentEmail, $displayName, $accountId, '', 'Account not found');
                    $failureCount++;
                    continue;
                }

                $accountEmail = $account['email'];

                // Check if account has no email
                if (empty($accountEmail)) {
                    $this->addToCsv($userId, $currentEmail, $displayName, $accountId, '', 'No email in account');
                    $failureCount++;
                    continue;
                }

                // Validate account email contains @
                if (strpos($accountEmail, '@') === false) {
                    $this->addToCsv($userId, $currentEmail, $displayName, $accountId, $accountEmail, 'Account email invalid (no @)');
                    $failureCount++;
                    continue;
                }

                // Check if email is already taken by another user
                $existingUser = $adapter->fetchRow(
                    sprintf(
                        "SELECT id FROM user WHERE email = %s AND id != %d",
                        $adapter->getConnection()->quote($accountEmail),
                        (int)$userId
                    )
                );

                if ($existingUser) {
                    $this->addToCsv($userId, $currentEmail, $displayName, $accountId, $accountEmail, 'Email already taken by another user');
                    $failureCount++;
                    continue;
                }

                $adapter->execute(
                    sprintf(
                        "UPDATE user SET email = %s WHERE id = %d",
                        $adapter->getConnection()->quote($accountEmail),
                        (int)$userId
                    )
                );
            } catch (\Exception $e) {
                $this->addToCsv(
                    $user['id'],
                    $user['email'],
                    $user['display_name'],
                    $user['account_id'],
                    '',
                    'Exception: ' . $e->getMessage()
                );
                $failureCount++;
            }
        }

        // Export failures to CSV
        if ($failureCount > 0) {
            $this->exportCsv();
        }
    }

    public function down(): void
    {
        // do nothing
    }

    private function addToCsv($userId, $userEmail, $displayName, $accountId, $accountEmail, $reason): void
    {
        $this->csvData[] = [
            $userId,
            $userEmail ?? '',
            $displayName ?? '',
            $accountId ?? '',
            $accountEmail ?? '',
            $reason
        ];
    }

    private function exportCsv(): void
    {
        // Ensure directory exists
        $directory = dirname($this->csvFilePath);
        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        $fp = fopen($this->csvFilePath, 'w');

        if ($fp === false) {
            throw new \Exception("Could not open file for writing: {$this->csvFilePath}");
        }

        foreach ($this->csvData as $row) {
            fputcsv($fp, $row);
        }

        fclose($fp);

        chmod($this->csvFilePath, 0644);
    }
}
