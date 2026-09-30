<?php

namespace App\Infrastructure\DynamoDB;

use Aws\DynamoDb\DynamoDbClient;
use Aws\DynamoDb\Exception\DynamoDbException;
use App\Infrastructure\Environment as Env;
use App\Infrastructure\SNS\SNSService;

class StateStorageService
{
    private DynamoDbClient $client;
    private SNSService $snsService;
    private string $tableName;
    private string $environment;

    public function __construct(?DynamoDbClient $client = null, ?SNSService $snsService = null)
    {
        $this->tableName = Env::getValue("AWS_DYNAMO_TABLE_NAME");

        // Initialize AWS DynamoDB client
        $this->client = $client ?? new DynamoDbClient([
            'region' => Env::getValue("AWS_DYNAMODB_REGION"),
            'version' => Env::getValue("AWS_DYNAMODB_VERSION", "latest")
        ]);

        $this->snsService = $snsService ?? new SNSService();
        $this->environment = Env::getValue("ENVIRONMENT", "local");
    }

    /**
     * @param string $keyName
     * @param string $key
     * @param string $valueName
     * @param int|string $value
     * @param int $ttlSeconds
     * @return void
     * @throws \Exception
     */
    public function store(string $keyName, string $key, string $valueName, int|string $value, int $ttlSeconds = 3600): void
    {
        try {
            $expiresAt = time() + $ttlSeconds;
            $item = [
                $keyName   => ['S' => $key],
                $valueName => is_int($value)
                    ? ['N' => (string) $value]
                    : ['S' => (string) $value],
                'expires_at' => ['N' => (string) $expiresAt],
            ];

            $this->client->putItem([
                'TableName' => $this->tableName,
                'Item' => $item
            ]);

        } catch (DynamoDbException $e) {
            $error = json_encode([
                'level'         => 'Error',
                'service'       => 'SSO',
                'env'           => $this->environment,
                'provider'      => 'DynamoDb',
                'account_id'    => $value,
                'timestamp'     => date('Y-m-d H:i:s'),
                'error'         => "Failed to store {$valueName} in DynamoDB: {$e->getMessage()}"
            ]);
            error_log("[SSO]: {$error}");

            $errorData = [
                'account_id' => $value,
                'provider' => "DynamoDb",
                'timestamp' => date('Y-m-d H:i:s'),
                'error' => "Failed to store {$valueName} in DynamoDB: {$e->getMessage()}"
            ];

            $this->snsService->sendSSOLoginError($errorData);
            throw new \Exception("Failed to store {$valueName} in DynamoDB: {$e->getMessage()}");
        }
    }

    /**
     * @param string $keyName
     * @param string $key
     * @param string $valueName
     * @return int|string|null
     * @throws \Exception
     */
    public function fetch(string $keyName, string $key, string $valueName): int|string|null
    {
        try {
            $result = $this->client->getItem([
                'TableName' => $this->tableName,
                'Key' => [
                    $keyName => ['S' => $key]
                ]
            ]);

            if (empty($result['Item'][$valueName])) {
                return null;
            }

            $attr = $result['Item'][$valueName];
            $value = $attr['N'] ?? $attr['S'] ?? null;

            return $value;
        } catch (DynamoDbException $e) {
            $error = json_encode([
                'level'         => 'Error',
                'service'       => 'SSO',
                'env'           => $this->environment,
                'provider'      => 'DynamoDb',
                'account_id'    => null,
                'timestamp'     => date('Y-m-d H:i:s'),
                'error'         => "Failed to retrieve {$valueName} from DynamoDB: {$e->getMessage()}"
            ]);
            error_log("[SSO]: {$error}");

            $errorData = [
                'account_id' => null,
                'provider' => "DynamoDb",
                'timestamp' => date('Y-m-d H:i:s'),
                'error' => "Failed to retrieve {$valueName} from DynamoDB: {$e->getMessage()}"
            ];

            $this->snsService->sendSSOLoginError($errorData);
            throw new \Exception("Failed to retrieve {$valueName} from DynamoDB: {$e->getMessage()}");
        }
    }
}
