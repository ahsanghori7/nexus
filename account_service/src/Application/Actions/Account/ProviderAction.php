<?php

namespace App\Application\Actions\Account;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Account\AccountRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Exception\HttpNotFoundException;
use Psr\Log\LoggerInterface;

class ProviderAction extends Action
{

    /**
     * AccountAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new AccountRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getProviderAccountMapping(Request $request, Response $response, array $args): Response
    {
        try{
            $accountId = (int)($args["id"] ?? 0);
            $providerName = $args['provider'] ?? null;
            $provider = $this->repository->getModel('provider')->load($providerName, "label");
            if($provider->isLoaded()) {
                $mapping = $this->repository->getModel('provider_account_mapping')->findOne(
                    [
                        "account_id" => $accountId,
                        "provider_id" => (int)$provider->getData("id")
                    ]
                )->getData();
                $mapping['credentials'] = json_decode($mapping['meta'] ?? '[]', true);
            }

        }catch (\Exception $e){
            $mapping = [];
        }
        return $this->respond(
            $response,
            new ActionPayload(200, $mapping ?? [])
        );
    }
}
