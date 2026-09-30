<?php

namespace App\Application\Actions\Feature;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Feature\FeatureRepository;

class FeatureAction extends Action
{
    /**
     * Default content type for feature action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * FeatureAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new FeatureRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function fetchFeatures(Request $request, Response $response, array $args): Response
    {
        $accountsWithFeatures = $this->repository->getFeatures();
        return $this->respond(
            $response,
            new ActionPayload(200, $accountsWithFeatures)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function fetchAccountsWithFeatures(Request $request, Response $response, array $args): Response
    {
        $aid = intval($args["aid"] ?? 0);
        $queryParams = $request->getQueryParams();
        $featureName = $queryParams['feature'] ?? null;
        $accountsWithFeatures = $this->repository->getAccountsWithFeatures($aid, $featureName);
        return $this->respond(
            $response,
            new ActionPayload(200, $accountsWithFeatures)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deleteAccountsFeatures(Request $request, Response $response, array $args)
    {
        return $this->respond(
            $response,
            new ActionPayload(200, $this->repository->deleteAccountsFeatures(intval($args['aid'])))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updateAccountsFeatures(Request $request, Response $response, array $args)
    {
        $newAids = $this->getData();
        return $this->respond(
            $response,
            new ActionPayload(200, $this->repository->updateAccountsFeatures($newAids))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function fetchAccountEnvelopes(Request $request, Response $response, array $args): Response
    {
        $aid = intval($args["aid"] ?? 0);
        $accountsWithFeatures = $this->repository->getAccountEnvelopes($aid);
        return $this->respond(
            $response,
            new ActionPayload(200, $accountsWithFeatures)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updateEnvelopes(Request $request, Response $response, array $args): Response
    {
        $aid = intval($args['aid']);
        $data = $this->getData();
        $envelopes = $this->repository->updateEnvelopes($aid, $data);
        return $this->respond(
            $response,
            new ActionPayload(200, $envelopes)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updateAccountsFeaturesMapping(Request $request, Response $response, array $args): Response
    {
        $maid = intval($args['maid']);
        $feature = intval($args['feature']);
        $result = $this->repository->updateAccountsFeaturesMapping($maid, $feature);
        return $this->respond(
            $response,
            new ActionPayload(200, $result)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function createAccountsFeaturesMapping(Request $request, Response $response, array $args): Response {
        $data = $this->getData();

        if (
            empty($data['account_features_id']) ||
            empty($data['feature_id'])
        ) {
            throw new \InvalidArgumentException('Missing required fields');
        }

        $result = $this->repository->createAccountsFeaturesMapping(
            (int) $data['account_features_id'],
            (int) $data['feature_id']
        );

        return $this->respond(
            $response,
            new ActionPayload(201, $result)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function getAccountsFeaturesMapping(Request $request, Response $response, array $args): Response
    {
        $data = $request->getQueryParams();
        $result = $this->repository->getAccountsFeaturesMapping($data['account_features_id'], $data['feature_id']);

        return $this->respond(
            $response,
            new ActionPayload(200, $result)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function getAccountFeature(Request $request, Response $response, array $args): Response
    {
        $aid = (int) $args['aid'];
        $result = $this->repository->getAccountFeatureByAccountId($aid);

        if (!$result) {
            return $this->respond(
                $response,
                new ActionPayload(404, null)
            );
        }

        return $this->respond(
            $response,
            new ActionPayload(200, $result)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function createAccountFeature(Request $request, Response $response): Response
    {
        $data = $this->getData();
        $result = $this->repository->createAccountFeature((int)$data['account_id']);

        return $this->respond(
            $response,
            new ActionPayload(201, $result)
        );
    }
}
