<?php

declare(strict_types=1);

namespace App\Infrastructure\SNS;

use Aws\Sns\SnsClient;
use App\Infrastructure\Environment as Env;

class SNSService
{
    private SnsClient $client;
    private string $topic_arn;
    private string $environment;
    private bool $enabled;

    public function __construct()
    {
        $this->enabled = (bool) Env::getValue("SNS_ENABLED", false);
        $this->environment = Env::getValue("ENVIRONMENT", "unknown");
        $this->topic_arn = Env::getValue("AWS_SNS_FEPA_TOPIC_URL");

        // Initialize AWS SNS client
        $this->client = new SnsClient([
            'region' => Env::getValue("AWS_SNS_REGION"),
            'version' => Env::getValue("AWS_SNS_VERSION"),
            'credentials' => [
                'key' => Env::getValue("AWS_SNS_ACCESS_KEY_ID"),
                'secret' => Env::getValue("AWS_SNS_SECRET_ACCESS_KEY"),
            ]
        ]);
    }

    /**
     * Send SSO login error notification
     * @param array $errorData
     * @return void
     */
    public function sendSSOLoginError(array $errorData): void
    {
        if ($this->enabled && $this->topic_arn) {
            $message = $this->formatSSOErrorMessage($errorData);

            $this->client->publish([
                'TopicArn' => $this->topic_arn,
                'Message' => $message,
                'Subject' => 'SSO Login Failure - Account ID: ' . ($errorData['account_id'] ?? 'unknown'),
            ]);
        }
    }

    /**
     * Format SSO error message
     * @param array $errorData
     * @return string
     */
    private function formatSSOErrorMessage(array $errorData): string
    {
        $timestamp = $errorData['timestamp'] ?? date('Y-m-d H:i:s');
        $accountId = $errorData['account_id'] ?? 'unknown';
        $provider = $errorData['provider'] ?? 'unknown';
        $state = $errorData['state'] ?? 'null';
        $errorMessage = $errorData['error'] ?? 'Unknown SSO login error';

        return "🚨 SSO LOGIN ERROR DETECTED\n\n" .
               "Timestamp: {$timestamp}\n" .
               "Account ID: {$accountId}\n" .
               "Provider: {$provider}\n" .
               "State: {$state}\n" .
               "Environment: {$this->environment}\n" .
               "Error Details: {$errorMessage}\n" .
               "This error requires immediate attention from the DevOps team.\n" .
               "Please investigate the SSO configuration and account mapping.";
    }
}
