<?php

namespace App\Domain\Account\Provider\Login;

use App\Infrastructure\Environment;
use App\Infrastructure\Security\SecretsManager;
use App\Infrastructure\SNS\SNSService;
use App\Infrastructure\DynamoDB\StateStorageService;
use GuzzleHttp\Client;
use App\Infrastructure\Environment as Env;

class Entra extends LoginServiceAbstract {

    /**
     * @var array
     */
    protected $meta;

    /**
     * @var bool
     */
    protected $useEnvironmentOnly;

    /**
     * @var string
     */
    protected $client_id;

    /**
     * @var string
     */
    protected $client_secret;

    /**
     * @var string
     */
    protected $secrets_arn;

    /**
     * @var string
     */
    protected $redirect_uri;

    /**
     * @var string
     */
    protected $authorize_url;

    /**
     * @var string
     */
    protected $token_url;

    /**
     * @var string
     */
    protected $scope;

    /**
     * @var string
     */
    protected $state;

    /**
     * @var string
     */
    protected $environment;

    protected const LOCAL_ENVIRONMENT = 'local';

    /**
     * Check if meta is provided and has all required keys
     * @return bool
     * @throws \Exception
     */
    private function validateMetaConfiguration(): bool {
        $requiredKeys = ['client_id', 'secrets_arn', 'redirect_uri', 'authorize_url', 'token_url', 'scope'];

        // If meta is empty or not provided, we'll use environment variables
        if (empty($this->meta)) {
            return false;
        }

        // Check if all required keys exist and are non-empty
        $missingKeys = [];
        foreach ($requiredKeys as $key) {
            if (!isset($this->meta[$key]) || empty($this->meta[$key])) {
                $missingKeys[] = $key;
            }
        }

        // If meta is provided but incomplete, throw exception
        if (!empty($missingKeys)) {
            $error = json_encode([
                'level'         => 'Error',
                'service'       => 'SSO',
                'env'           => $this->environment,
                'provider'      => 'Entra',
                'account_id'    => $this->meta['accountId'] ?? null,
                'timestamp'     => date('Y-m-d H:i:s'),
                'error'         => "Incomplete meta configuration. Missing required keys: ". implode(",", $missingKeys)
            ]);
            error_log("[SSO]: {$error}");

            // Send SNS notification to DevOps team for invalid SSO login attempt
            $errorData = [
                'account_id'    => $this->meta['accountId'] ?? null,
                'provider'      => "Entra",
                'timestamp'     => date('Y-m-d H:i:s'),
                'error'         => 'Incomplete meta configuration. Missing required keys: ' . implode(",", $missingKeys)
            ];
            $snsService = new SNSService();
            $snsService->sendSSOLoginError($errorData);

            throw new \Exception("Incomplete meta configuration. Missing required keys.");
        }

        // All keys exist, use meta configuration
        return true;
    }


    /**
     * Initialize configuration with current meta data
     */
    private function initializeConfiguration(): void {
        // Validate meta configuration and determine if we should use environment only
        $this->useEnvironmentOnly = !$this->validateMetaConfiguration();

        $this->client_id = $this->getConfigValue('client_id', 'ENTRA_CLIENT_ID');
        $this->client_secret = $this->getSecretConfigValue('secrets_arn', 'ENTRA_CLIENT_SECRET');
        $this->redirect_uri = $this->getConfigValue('redirect_uri', 'ENTRA_REDIRECT_URI');
        $this->authorize_url = $this->getConfigValue('authorize_url', 'ENTRA_AUTHORIZE_URL', "https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
        $this->token_url = $this->getConfigValue('token_url', 'ENTRA_TOKEN_URL', "https://login.microsoftonline.com/common/oauth2/v2.0/token");
        $this->scope = $this->getConfigValue('scope', 'ENTRA_SCOPE', "openid profile email");
        $this->state = bin2hex(random_bytes(32));
    }


    /**
     * @param array $meta
     */
    public function __construct(array $meta = []) {
        $this->meta = $meta;
        $this->environment = Env::getValue("ENVIRONMENT", self::LOCAL_ENVIRONMENT);
        $this->initializeConfiguration();
    }

    /**
     * Set meta data and re-initialize configuration
     * @param array $meta
     * @return void
     */
    public function setMeta(array $meta): void {
        $this->meta = $meta;
        $this->initializeConfiguration();
    }

    /**
     * @param string $metaKey
     * @param string $envKey
     * @param string $default
     * @return string
     */
    private function getConfigValue(string $metaKey, string $envKey, string $default = ''): string {
        // If we should use environment only, skip meta check
        if ($this->useEnvironmentOnly) {
            return Environment::getValue($envKey, $default);
        }

        // All keys exist in meta (validated in constructor), so return meta value
        return $this->meta[$metaKey];
    }

    /**
     * @param string $metaKey
     * @param string $envKey
     * @param string $default
     * @return string
     */
    private function getSecretConfigValue(string $metaKey, string $envKey, string $default = ''): string {
        // If we should use environment only, skip meta check
        if ($this->useEnvironmentOnly) {
            return Environment::getValue($envKey, $default);
        }

        // Fetch from AWS Secrets Manager
        $SecretManager = new SecretsManager();
        $secret = $SecretManager->getSecret($this->meta[$metaKey]);

        $client_secret = is_array($secret) ? $secret['ENTRA_CLIENT_SECRET'] : $secret;

        return $client_secret;
    }

    /**
     * Extract account ID from state parameter
     * @param string $state
     * @return int
     */
    public function getAccountIdFromState(string $state): int {
        try {
            if ($this->environment == self::LOCAL_ENVIRONMENT) {
                $stateData = json_decode(base64_decode($state), true);
                return (int) ($stateData['account_id'] ?? 0);
            } else {
                $stateStorage = new StateStorageService();
                return $stateStorage->fetch('state', $state, 'accountId') ?? 0;
            }
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Return the redirect url for Entra provider
     * @param int $accountId
     * @return string
     */
    public function get_redirect_url(int $accountId = 0) : string {
        $state = $this->state;
        if ($this->environment == self::LOCAL_ENVIRONMENT) {
            // Create state with account ID encoded
            $stateData = [
                'account_id' => $accountId,
                'nonce' => $state
            ];
            $state = base64_encode(json_encode($stateData));
        } else {
            $stateStorage = new StateStorageService();
            $stateStorage->store('state', $state, 'accountId', $accountId);
        }

        $params = [
            'client_id' => $this->client_id,
            'response_type' => 'code',
            'redirect_uri' => $this->redirect_uri,
            'scope' => $this->scope,
            'state' => $state,
            'prompt' => 'select_account',
        ];

        return $this->authorize_url . '?' . http_build_query($params);
    }

    /**
     * @param array $data
     * @return bool
     */
    public function login(array $data) : bool {
        $code = $data["code"] ?? "";
        $client = new Client();
        try{
            if(empty($code)) {
                throw new \Exception("No code provided");
            }
            $response = $client->post($this->token_url, [
                'form_params' => [
                    'client_id' => $this->client_id,
                    'client_secret' => $this->client_secret,
                    'code' => $code,
                    'redirect_uri' => $this->redirect_uri,
                    'grant_type' => 'authorization_code',
                    'scope' => 'openid profile email'
                ]
            ]);

            $tokenData = json_decode($response->getBody()->getContents(), true);
            $jwt = $tokenData["id_token"];
            if(empty($jwt)) {
                throw new \Exception("No JWT found in Entra response");
            }
            return $this->validateAndLoginUser($this->decodeJwt($jwt), $data["app"] ?? "");

        } catch (\Exception $e) {
            $error = json_encode([
                'level'         => 'Error',
                'service'       => 'SSO',
                'env'           => $this->environment,
                'provider'      => 'Entra',
                'account_id'    => $data['accountId'] ?? null,
                'state'         => $data['state'] ?? null,
                'timestamp'     => date('Y-m-d H:i:s'),
                'error'         => "Error logging in with Entra: {$e->getMessage()}"
            ]);
            error_log("[SSO]: {$error}");

            // Send SNS notification to DevOps team for invalid SSO login attempt
            $errorData = [
                'provider'      => "Entra",
                'account_id'    => $data['accountId'] ?? null,
                'state'         => $data['state'] ?? null,
                'timestamp'     => date('Y-m-d H:i:s'),
                'error'         => "Error logging in with Entra: {$e->getMessage()}"
            ];
            $snsService = new SNSService();
            $snsService->sendSSOLoginError($errorData);

            throw new \Exception("Error logging in with Entra: " . $e->getMessage());
        }
    }

    /**
     * @param array $jwtData
     * @return void
     */
    public function validate(array $data) : bool {
        if ($data['aud'] !== $this->client_id) {
            throw new \Exception('Invalid token: incorrect audience');
        }
        return true;
    }

    /**
     * @param array $data
     * @return string
     */
    public function getUserEmail(array $data) : string {
        $email = $data['preferred_username'] ?? "";
        if(empty($email)) {
            throw new \Exception("No email found in SSO Login Data");
        }
        return $email;
    }
}
