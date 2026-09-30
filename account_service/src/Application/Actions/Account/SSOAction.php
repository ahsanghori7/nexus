<?php

namespace App\Application\Actions\Account;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Account\AccountRepository;
use App\Domain\Account\Provider\Login\Entra;
use App\Infrastructure\Environment;
use App\Infrastructure\SNS\SNSService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Exception\HttpNotFoundException;
use Psr\Log\LoggerInterface;

class SSOAction extends Action {

    const PROVIDER_LOCAL = "local";
    const PROVIDER_TYPE  = 'login';

        /**
         * Default content type for account action data is json
         * @var string
         */
        protected $defaultContentType = "application/json";

        /**
         * @var string
         */
        private $environment;

        /**
         * SSOAction constructor.
         * @param LoggerInterface $logger
         */
        public function __construct(LoggerInterface $logger)
        {
            parent::__construct($logger);
            $this->repository = new AccountRepository();
            $this->environment = Environment::getValue("ENVIRONMENT", "local");
        }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function sso_login(Request $request, Response $response, array $args): Response
    {
        $providerName  = $args["provider"] ?? self::PROVIDER_LOCAL;
        $provider = $this->repository->getModel('provider')->load($providerName, 'label');
        if($provider->isLoaded()) {
            $data = $request->getQueryParams();
            $providerService = $provider->getProviderService(self::PROVIDER_TYPE);
            if (in_array($providerName, ['entra', 'google']) && isset($data['state'])) {
                // Extract account ID from state parameter for Entra provider
                $accountId = $providerService->getAccountIdFromState($data['state']);
                // Load meta configuration if we have an account ID
                if ($accountId > 0) {
                    $mapping = $this->repository->getModel('provider_account_mapping')
                        ->findAll([
                            'account_id'  => $accountId,
                            'provider_id' => $provider->getId(),
                        ], 1);
                    if (!empty($mapping)) {
                        $mapping = array_shift($mapping);
                        // Parse meta JSON if it exists
                        $metaData = $mapping['meta'];
                        if (!empty($metaData)) {
                            $meta = json_decode($metaData, true) ?: [];
                            $providerService->setMeta($meta);
                        }
                    }
                } else {
                    $error = json_encode([
                        'level'         => 'Error',
                        'service'       => 'SSO',
                        'env'           => $this->environment,
                        'provider'      => $providerName,
                        'account_id'    => $accountId,
                        'state'         => $data['state'] ?? null,
                        'timestamp'     => date('Y-m-d H:i:s'),
                        'error'         => "Account ID not found or invalid SSO login state"
                    ]);
                    error_log("[SSO]: {$error}");

                    // Send SNS notification to DevOps team for invalid SSO login attempt
                    $errorData = [
                        'account_id'    => $accountId,
                        'provider'      => $providerName,
                        'state'         => $data['state'] ?? null,
                        'timestamp'     => date('Y-m-d H:i:s'),
                        'error'         => 'Account ID not found or invalid SSO login state'
                    ];

                    $snsService = new SNSService();
                    $snsService->sendSSOLoginError($errorData);

                    throw new HttpNotFoundException($request, "Account ID not found or invalid SSO login state");
                }
            }

            $isLoggedIn = $providerService->login($data);

            if(!$isLoggedIn) {
                return $this->badRequest($response, "Failed to login user");
            }

            return $this->respond(
                $response,
                new ActionPayload(200, [
                    'token' => $providerService->getToken(),
                    'user' => $providerService->getUser(),
                ])
            );
        }
        else{
            throw new HttpNotFoundException($request, "SSO Provider $providerName not found");
        }
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getSSOProviderAccountMapping(Request $request, Response $response, array $args): Response
    {
        $accountId = (int)($args["id"] ?? 0);

        $providers = $this->repository->getModel('provider')->findAll(['type_id' => 1]);
        $providerIds = array_column($providers, 'id');
        $mapping = $this->repository->getModel('provider_account_mapping')
            ->findAll([
                'account_id'  => $accountId,
                'provider_id' => '[' . implode(',', $providerIds) . ']',
            ], 1);

        $provider = $this->repository->getModel('provider');
        $providerName = $this::PROVIDER_LOCAL;
        $meta = [];

        if(!empty($mapping)) {
            $mapping = array_shift($mapping);
            // Parse meta JSON if it exists
            $metaData = $mapping['meta'];
            if (!empty($metaData)) {
                $meta = json_decode($metaData, true) ?: [];
                $meta['accountId'] = $accountId;
            }

            $provider->load((int) $mapping['provider_id'], 'id');
            if($provider->isLoaded()) {
                $providerName = $provider->getData("label");
            }
        }
        $redirectUrl = $provider->getProviderService(self::PROVIDER_TYPE, $meta)->get_redirect_url($accountId);
        return $this->respond(
            $response,
            new ActionPayload(200, ['provider' => $providerName, 'redirect_url' => $redirectUrl])
        );
    }


    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listSSOProviders(Request $request, Response $response, array $args): Response
    {
        $providers = $this->repository->getModel('provider')->all();
        return $this->respond(
            $response,
            new ActionPayload(200, $providers)
        );
    }
}
