<?php

declare(strict_types=1);

namespace App\Application\Actions\Token;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

/**
 * Class UserAction
 * @package App\Application\Actions\User
 */
class TokenHistoryAction extends Action
{
  /**
   * Default content type for account action data is json
   * @var string
   */
  protected $defaultContentType = "application/json";

  /**
   * AccountAction constructor.createTokenHistory
   * @param LoggerInterface $logger
   */
  public function __construct(LoggerInterface $logger)
  {
    parent::__construct($logger);
    $this->repository = new UserRepository();
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function listTokenHistory(Request $request, Response $response, array $args)
  {
    return $this->respond(
      $response,
      new ActionPayload(200, [
        'issued' => $this->repository->getModel('tokenIssued')->findAll($request->getQueryParams()),
        'used'   => $this->repository->getModel('tokenUsed')->findAll($request->getQueryParams()),
      ])
    );
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function listTokenHistoryIssued(Request $request, Response $response, array $args)
  {
    return $this->listByModel($response, "tokenIssued", $request->getQueryParams());
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function listTokenHistoryUsed(Request $request, Response $response, array $args)
  {
    return $this->listByModel($response, "tokenUsed", $request->getQueryParams());
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function createTokenIssuedHistory(Request $request, Response $response, array $args): Response
  {
    $data = $this->getData();
    $token_type = $this->repository->getModel('tokenType')->load('payment_request', 'label');
    try {
      $verify = $this->repository->verify($data['token'], $token_type->getId());

      if ($verify) {
        $userModel = $this->repository->getModel("user")->load($verify->getData("user_id"), "id");

        if ($userModel->isLoaded()) {

          //save the token history
          $history = $this->repository->getModel('tokenIssued')->save([
            'account_id'   => $userModel->getData("account_id"),
            'token_amount' => (int)$data['token_amount'],
            'cost'         => (int)$data['cost']
          ]);

          //set the token to inactive
          $this->repository->getModel('token')->load($data['token'], 'token')->setTokenInactive();

          return $this->respond(
            $response,
            new ActionPayload(200, $history)
          );
        }
      }
    } catch (\Exception $e) {
      return $this->notFound($response);
    }

    return $this->notFound($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function createTokenUsedHistory(Request $request, Response $response, array $args): Response
  {
    $data = $this->getData();

    try {
      $res = $this->repository->getModel('tokenUsed')->save([
        'account_id'    => $data["account_id"],
        'user_id'       => $data["user_id"],
        'project_id'    => $data["project_id"],
        'token_type'        => $data['token_type'],
      ]);
    } catch (\Exception $e) {
      return $this->notFound($response);
    }

    return $this->respond(
      $response,
      new ActionPayload(200, $res)
    );
  }
}
