<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\User\UserRepository;
use Exception;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

/**
 * Class UserAction
 * @package App\Application\Actions\User
 */
class UserAction extends Action
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
   */
  public function getById(Request $request, Response $response, array $args): Response
  {
      $model = $this->repository->getModel()->load($args["id"]);
      $accountRole = $this->repository->getModel('accountRole')
                                ->getUserAccountRoleWithPermissions((int) $args["id"]);
      $data = $model->getData();
      $data['account_role'] = $accountRole;
      return $this->respond(
          $response,
          new ActionPayload(200, $data)
      );
  }

  /**
   * @param int $aid
   * @return mixed
   * @throws \Exception
   */
  public function getRowByAccountId (int $aid)
  {
    return $this->repository->getModel()->load(
      $aid, "account_id"
    );
  }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listUsersByAccountId(Request $request, Response $response, array $args) {
        $ids = explode(",", str_replace(["[","]"], "", $args["ids"]));
        $users = $this->repository->getUsersByArray($ids, 'account_id');
        return $this->respond(
            $response,
            new ActionPayload(200, $users)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function listUsersById(Request $request, Response $response, array $args) {
        $ids = explode(",", str_replace(["[","]"], "", $args["ids"]));
        $users = $this->repository->getUsersByArray($ids);
        return $this->respond(
            $response,
            new ActionPayload(200, $users)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function listUsersByField(Request $request, Response $response, array $args) {
        $params = $request->getQueryParams();
        $field = $params['field'] ?? null;
        $value = $params['value'] ?? null;
        $missing_fields = [];
        if(!$field) {$missing_fields[] = "field";}
        if(!$value) {$missing_fields[] = "value";}

        if(count($missing_fields) > 0) {
          return $this->badRequest($response, ["missing_field" => $missing_fields]);
        }

        $userData = [];

        if ($user = $this->repository->getModel()->getWhereLike($field, $value) ) {
          $user = array_shift($user);
          $user = $this->repository->getModel()->load($user['id']);
          $account = $user->getAccount();
            $userData = $user->getData();
            $userData['account'] = $account->getData();
            unset($userData['password']);
        }
        return $this->respond(
            $response,
            new ActionPayload(200, $userData)
        );
    }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function updateByUserId (Request $request, Response $response, array $args): Response
  {
    $model = $this->repository->getModel()->load($args["uid"]);
    if ( !$model->isLoaded() ) {
      return $this->notFound($response);
    }
    $model->save($this->getData());
    return $this->noContent($response);

  }

    /**
     * Get all users where like display name or where company name like
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function search (Request $request, Response $response, array $args): Response
    {
        $model = $this->repository->getModel()->load($args["uid"]);
        if ( !$model->isLoaded() ) {
            return $this->notFound($response);
        }
        $model->save($this->getData());
        return $this->noContent($response);

    }



  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @TODO add the post with password
   * @return Response
   * @throws \Exception
   */
  public function renew_password (Request $request, Response $response, array $args): Response
  {
    $token = $this->getData("token");
    $password = $this->getData("password");

    if ( !$token || !$password ) {
      return $this->badRequest($response);
    }

    $token_type = $this->repository->getModel('tokenType')->load('password_reset', 'label');
    $verify = $this->repository->verify($token, $token_type->getId());

    if ( $verify ) {
      $tokenModel = $this->repository->getModel('token')->findOne(['token' => $token]);
      if ( !$tokenModel ) {
        return $this->notFound($response);
      }

      //save the password
      $data = [
        'password' => $password,
        'migrated' => 1
      ];

      $user = $this->repository->getModel('user')
        ->load($tokenModel->getData('user_id'))
        ->save($data);

      //set the token to inactive
      $token_data = [
        'active' => 0,
        'expired_at' => date('Y-m-d H:i:s')
      ];
      $this->repository->getModel('token')
        ->load($token, 'token')
        ->save($token_data);

      return $this->respond(
        $response,
        new ActionPayload(200, ['status' => true, "user" => $user])
      );
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
  public function reset_password (Request $request, Response $response, array $args): Response
  {
    $model = $this->repository->getModel()->load($args["email"], 'email');

    if ( !$model->isLoaded() ) {
      return $this->notFound($response);
    }

    $account_type_id = (int) $model->getData('type_id', 0);

    $userRoleLabel = $this->repository->getModel('role')->load($account_type_id, 'id')->getData('label');

    if( $userRoleLabel === 'witness'|| $userRoleLabel === 'project_team_member') {
      return $this->notFound($response);
    }

    $token_type = $this->repository->getModel('tokenType')->load('password_reset', 'label');

    try {
      //@TODO Create a query builder
      $token = $this->repository->getModel('token')
        ->findOne([
          'user_id' => $model->getId(),
          'token_type_id' => $token_type->getId(),
          'active' => 1,
          'expires' => ['>', date('Y-m-d H:i:s')]
        ]);
    } catch (\Exception $e) {
      $token = $this->repository->getModel('token')
        ->resetPassword($model->getId(), $token_type);
    }


    return $this->respond(
      $response,
      new ActionPayload(200, $token)
    );
  }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response|null
     * @throws \Exception
     */
  public function updateMeta(Request $request, Response $response, array $args): ?Response
  {
      $hash = $args['token'] ?? "";
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
   */
  public function login (Request $request, Response $response, array $args): ?Response
  {
    $username = $this->getData("username");
    $password = $this->getData("password");
    $app = $this->getData("app", "");
    $account_type_id = (int) $this->getData("type_id");
    if ( !$username || !$password ) {
      return $this->badRequest($response);
    }
    $token = $this->repository->login($username, $password, $account_type_id, $app);

    if ($token && $token->isLoaded() ) {
      $token->loadUser();
      return $this->respond(
        $response,
        new ActionPayload(200, $token)
      );
    }

    /*
     * If we arrive here that means that the user login is:
     * Credentials are not correct
     * The account status is set to inactive
     *
    /*
     * If the account status is set to inactive
     */
    if(!$token->getData('status') && !is_null($token->getData('status'))){
      return $this->respond(
        $response,
        new ActionPayload(200, ['status' => false])
      );
    }

    return $this->noAuth($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function logout (Request $request, Response $response, array $args): Response
  {
    $token = $args['token'] ?? "";
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
   */
  public function verify (Request $request, Response $response, array $args): Response
  {
    $token = $args['token'] ?? "";
    $verify = $this->repository->verify($token);
    if ( $verify ) {
      return $this->respond(
        $response,
        new ActionPayload(200, $verify)
      );
    }

    return $this->noAuth($response);
  }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
  public function getSessionUsage (Request $request, Response $response, array $args): Response
  {
      $token = $args['token'] ?? "";
      $verify = $this->repository->verify($token);

      if ( $verify ) {
          $sessions = $this->repository->getModel('token')->findAll(['user_id' => $verify->getData("user_id"), 'token_type_id' => $verify->getData("token_type_id")]);

          $count = 0;
          array_map(function($session) use (&$count){
              $count += $session['token_usage'];
          }, $sessions);

          return $this->respond(
              $response,
              new ActionPayload(200, ['total' => $count])
          );
      }

      return $this->noAuth($response);
  }

    public function incrementSessionUsage (Request $request, Response $response, array $args): Response
    {
        $token = $args['token'] ?? "";
        $verify = $this->repository->verify($token);
        if ( $verify ) {
            $this->repository->incrementTokenUsage($token);
            return $response;
        }

        return $this->notFound($response);
    }



  /**
   * @TODO Maybe instead of generating a new token we increment the current cookie expiration date
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   * @throws \Exception
   */
  public function renew (Request $request, Response $response, array $args): Response
  {
    $token_hash = $args['token'] ?? "";
    $verify = $this->repository->verify($token_hash);

    if ( !$verify ) {
      return $this->noAuth($response);
    }

    $token = $this->repository->getModel('token')->load($token_hash, 'token');

    /*
     * The renew method will increase the expire timer for the cookie
     */
    if($token->renew()){
      return $this->respond(
        $response,
        new ActionPayload(200, $token)
      );
    }else {
      return $this->noAuth($response);
    }
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
        $model = $this->repository->getModel("role");
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
    public function createAutoLoaderToken(Request $request, Response $response, array $args)
    {
        $modelType = $this->repository->getModel('tokenType')->load("auto_loader",'label');
        if ($modelType->isLoaded()){
            $userModel = $this->repository->getModel("user")->load((int)$args['id'], "id");
            if($userModel->isLoaded()){
                $token = $this->repository->getModel('token')->save([
                    'created_at' => date("Y-m-d H:i:s"),
                    'user_id' => (int)$args['id'],
                    'token_type_id' => $modelType->getId()
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
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getEngagement(Request $request, Response $response, array $args): Response
    {
        $id = $args["id"] ?? null;
        return $this->respond(
            $response,
            new ActionPayload(200, $this->repository->getModel('token')->all(['user_id' => $id]))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function checkPassword(Request $request, Response $response, array $args): Response
    {

        $params = $request->getQueryParams();
        $uid = (int)($params['uid'] ?? 0);
        $password = (string)($params['password'] ?? '');
        $user = $this->repository->getModel('user')->load($uid, 'id');
        return $this->respond(
            $response,
            new ActionPayload(200, ['success' => $user->validatePassword($password)])
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getNotifications(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $uid = (int)($args['id'] ?? 0);
        $data = $this->repository->getModel('userActionNotifications')->findAll(['receiver_id' => $uid, 'status' => 0]);
        return $this->respond(
            $response,
            new ActionPayload(200, $data)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createNotification(Request $request, Response $response, array $args): Response
    {
        $model = $this->repository->getModel('userActionNotifications');
        $data = $this->getData();
        $model->save($data);
        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updateNotificationById(Request $request, Response $response, array $args): Response
    {
        $model = $this->repository->getModel('userActionNotifications')->load($args['nid'], 'id');
        $data = $this->getData();
        $model->save($data);
        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getUserActionTypes(Request $request, Response $response, array $args): Response
    {
        $data = $this->repository->getModel('userActionTypes')->all();
        return $this->respond(
            $response,
            new ActionPayload(200, $data)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getUserAccountRoles(Request $request, Response $response, array $args): Response
    {
        $data = $this->repository->getModel('accountRole')->getUserAccountRole((int)$args['id']);
        return $this->respond(
            $response,
            new ActionPayload(200, $data)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getUsersWithAccountRoles(Request $request, Response $response, array $args): Response
    {
      $ids = explode(",", str_replace(["[","]"], "", $args["ids"]));
        $data = $this->repository->getModel('accountRole')->getUsersWithAccountRole($ids);
        return $this->respond(
            $response,
            new ActionPayload(200, $data)
        );
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
      $userId = (int) $args["id"] ?? 0;

      try {
        $this->repository->deleteTokensByUserId($userId);
        $this->repository->getModel("accountRoleUserMapping")->deleteWhere(['user_id' => $userId]);
        $this->repository->getModel("accountGroupUserMapping")->deleteWhere(['user_id' => $userId]);

        $result = $this->repository->getModel()->delete($userId);

        if($result) {
          return $this->noContent($response);
        }

        throw new Exception("Could not delete user.");

      } catch(Exception $e) {
        return $this->respond($response, new ActionPayload(400, [
            "error" => $e->getMessage()
        ]));
      }


    }
}
