<?php

namespace App\Infrastructure\Security;

use Exception;
use Aws\Exception\AwsException;
use Aws\SecretsManager\SecretsManagerClient;
use App\Infrastructure\Environment as Env;

class SecretsManager
{
    private static ?SecretsManagerClient $client = null;

    /**
     * @return SecretsManagerClient
     */
    public static function getClient() : SecretsManagerClient {

        if ( !self::$client ) {
            self::$client = new SecretsManagerClient([
                'version' => Env::getValue("AWS_SM_VERSION"),
                'region' => Env::getValue("AWS_SM_REGION")
            ]);
        }

        return self::$client;
    }

    /**
    * Allow tests to replace the underlying client
    */
    public static function setClient(?SecretsManagerClient $client): void
    {
        self::$client = $client;
    }

    public function getSecret($secretName) {
        try {
            $result = self::getClient()->getSecretValue([
                'SecretId' => $secretName
            ]);

            $secretString = $result['SecretString'];

            // Try JSON decode, return decoded or original string
            $decoded = json_decode($secretString, true);

            return (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) ? $decoded : $secretString;

        } catch (AwsException $e) {
            // logging the actual error for debugging purposes
            error_log("AWS Secrets Manager error: " . $e->getMessage());
            throw new Exception("Unable to retrieve configuration. Please contact support.");
        }
    }
}
