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
class TokenAction extends Action
{
  /**
   * Default content type for account action data is json
   * @var string
   */
  protected $defaultContentType = "application/json";

  /**
   * AccountAction constructor.
   * @param LoggerInterface $logger
   */
  public function __construct (LoggerInterface $logger)
  {
    parent::__construct($logger);
    $this->repository = new UserRepository();
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function disable (Request $request, Response $response, array $args): Response
  {
    $token = $args['token'] ?? null;
    $verify = $this->repository->verify($token);
    if ( $verify ) {
      $this->repository->setTokenInactive($token);
      return $response;
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
  public function addMetaToken(Request $request, Response $response, array $args): Response
  {
    $hash = $args['token'] ?? null;
    $token = $this->repository->getModel("token")->load($hash, "token");
    if($token->isLoaded()) {
        $meta = $token->getMeta();
        if(!$meta) {
            $meta = [];
        }
        $meta = array_merge($meta, $this->getData());
        $token->save(["meta" => json_encode($meta)]);
        return $this->noContent($response);
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
  public function createToken (Request $request, Response $response, array $args): Response
  {
      $data = $this->getData();
      $token_type = $data['type_id'] ?? null;
      $uid = $data['user_id'] ?? null;
      $modelType = $this->repository->getModel('tokenType')->load($token_type,'id');
      if ($modelType->isLoaded()){
          $userModel = $this->repository->getModel("user")->load($uid, "id");
          if($userModel->isLoaded()){
              $token = $this->repository->getModel('token')->save([
                  'created_at' => date("Y-m-d H:i:s"),
                  'user_id' => $uid,
                  'token_type_id' => $modelType->getId(),
                  'meta' => json_encode($data['meta'] ?? [])
              ]);
              return $this->respond(
                  $response,
                  new ActionPayload(200, $token)
              );
          }
      }
      return $this->notFound($response);
  }

  /**
   * Delete all tokens by user ID
   *
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function deleteByUserId(Request $request, Response $response, array $args): Response
  {
      $uid = (int)($args['id'] ?? 0);

      if ($uid > 0) {
          $this->repository->deleteTokensByUserId($uid);

          return $this->respond(
              $response,
              new ActionPayload(200, [
                  'success' => true,
                  'message' => "All tokens for user $uid deleted"
              ])
          );
      }

      return $this->notFound($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \ReflectionException
   */
  public function listTypes(Request $request, Response $response, array $args)
  {
      $model = $this->repository->getModel("tokenType");
      return $this->respond(
          $response,
          new ActionPayload(200, $model->findAll())
      );
  }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
  public function verifyToken(Request $request, Response $response, array $args)
  {
      $params  = $request->getQueryParams();
      $token_type_id = 0;
      if(isset($params['label'])){
          $types = $this->repository->getModel("tokenType");
          $token_label = $params['label'];
          if($modelTypes = $types->findOne(['label' => $token_label])){
              $token_type_id = $modelTypes->getId();
          }
      }
      $verify = $this->repository->verify($args['token'], $token_type_id);
      if ( $verify ) {
          return $this->respond(
              $response,
              new ActionPayload(200, $verify)
          );
      }
      return $this->notFound($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response|void
   */
  public function listTokens(Request $request, Response $response, array $args)
  {
    return $this->respond(
      $response,
      new ActionPayload(200, $this->repository->getModel("token")->all($request->getQueryParams()))
    );
  }

  /**
   * Withdraws several tokens at once.
   *
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function disableBulk(Request $request, Response $response, array $args): Response
  {
    $ids = $this->getData("ids", []);
    if (!is_array($ids) || $ids === []) {
        return $this->badRequest($response);
    }

    return $this->respond(
        $response,
        new ActionPayload(200, ["revoked" => $this->repository->setTokensInactiveByIds($ids)])
    );
  }

}
