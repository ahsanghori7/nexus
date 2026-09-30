<?php
    declare(strict_types=1);

    namespace App\Application\Actions\Account;

    use Psr\Http\Message\ResponseInterface as Response;
    use Psr\Http\Message\ServerRequestInterface as Request;
    use Psr\Log\LoggerInterface;
    use App\Application\Actions\Action;
    use App\Application\Actions\ActionPayload;
    use App\Domain\Account\AccountRepository;
    use Exception;
    use Psr\Http\Message\ServerRequestInterface;

    CONST DEFAULT_REGION_CODE_ID = 1; //UK

    /**
     * Class AccountAction
     * @package App\Application\Actions\Account
     */
    class AccountAction extends Action
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
        public function createAccount(Request $request, Response $response, array $args) {
            $id = $this->repository->create($data);
            if($membership_type = $this->getData("membership")) {
                $membership   = $this->repository->getModel("membership")->findOne(["account_id" => $id]);
                $subscription = $this->repository->getModel("subscription")->findOne(["uid" => $membership_type]);
                $membership->save(
                    ["subscription_id" => $subscription->getData("id")],
                );
            }
            return $this->respond(
                $response,
                new ActionPayload(200, array('id' => $id))
            );
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         */
        public function listAccounts(Request $request, Response $response, array $args) {
            $ids = explode(",", str_replace(["[","]"], "", $args["ids"]));
            $accounts = $this->repository->getAccountsWithUsers($ids);
            return $this->respond(
                $response,
                new ActionPayload(200, $accounts)
            );
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         * @throws \Exception
         */
        public function updateMeta(Request $request, Response $response, array $args): Response
        {
            $id = (int)($args["id"] ?? null);
            $model = $this->repository->getModel("account_meta");
            $meta_keys = $model->loadMetaKeys();
            foreach($this->getData() as $key => $value){
                if( $model->isValidMetaKey($key)){
                    $meta_data = [
                        'account_id'  => $id,
                        'meta_key_id' => $meta_keys[$key],
                        'value'       => $value,
                    ];
                    try{
                        /*
                         * Update existing meta keys
                         */
                        $meta = $model->findOne(['account_id' => $id, 'meta_key_id' => $meta_keys[$key]]);
                        $meta_model = $model->load($meta->getId(), 'id');
                        $meta_model->save($meta_data);
                    }catch (\Exception $e){
                        /*
                         * Insert new meta key values
                         */
                        $this->repository->getModel("account_meta")->save($meta_data);
                    }
                }
            }

            return $this->noContent($response);
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
            return $this->listByModel($response, "type");
        }

        public function listUserTypes(Request $request, Response $response, array $args): Response
        {
            $model = $this->repository->getModel('role');
            return $this->respond($response, new ActionPayload(200, $model->findAll()));
        }

        public function listSubscriptions(Request $request, Response $response, array $args)
        {
            return $this->listByModel($response, "subscription");
        }

        public function getSubscriptionsByFilter(Request $request, Response $response,array  $args)
        {
            return $this->respond(
                $response,
                new ActionPayload(200, $this->repository->getModel("subscription")->findAll($args))
            );
        }

        public function listAllWebsites(Request $request, Response $response, array $args)
        {
            return $this->respond(
                $response,
                new ActionPayload(200, $this->repository->getModel("website")->findAll())
            );
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         */
        public function getMembership(Request $request, Response $response, array $args)
        {
            return $this->respond(
                $response,
                new ActionPayload(200, $this->repository->getMembership((int) $args["id"]))
            );
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         */
        public function getAccountsCustomerHealthScore(Request $request, Response $response, array $args)
        {
            return $this->respond(
                $response,
                new ActionPayload(200, $this->repository->getAccountsCustomerHealthScore())
            );
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         */
        public function updateAccountsCustomerHealthScore(Request $request, Response $response, array $args)
        {
            $newAids = $this->getData();
            return $this->respond(
                $response,
                new ActionPayload(200, $this->repository->updateAccountsCustomerHealthScore($newAids))
            );
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         */
        public function deleteAccountsCustomerHealthScore(Request $request, Response $response, array $args)
        {
            return $this->respond(
                $response,
                new ActionPayload(200, $this->repository->deleteAccountsCustomerHealthScore(intval($args['aid'])))
            );
        }

        /**
         * The account service is in need of a refactor, this functionality is becoing a bit of a mess
         * as there are now 3 actions to get accounts with and without users ect
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         */
        public function listAllAccounts(Request $request, Response $response, array $args) {
            $params  = $request->getQueryParams();
            $limit   = $params["limit"]  ?? 200;
            $offset  = $params["offset"] ?? 0;
            $account_type = $params["type"] ?? 0;
            $search = $params["query"] ?? "";
            $orderBy = $params["order"] ?? "";
            $desc = $params["desc"] ?? "1";
            $justAccount = $params["accounts"] ?? false;
            $region = $params["region"] ?? "";
            $trade = $params["trade"] ?? "";
            $subscriptions = $params["subscriptions"] ?? "";
            $status = $params["status"] ?? -1;

            $filters = [
                "region" => $region,
                "trade" => $trade,
                "subscriptions" => $subscriptions,
            ];
            $results = $this->repository->listAccountsAndUsers((int) $limit,  (int)$offset, (int) $account_type, $search, $orderBy, $desc, $filters, (bool) $justAccount, (int) $status);

            $paginator = $this->repository->getAccountUsersPaginator($request, (int) $account_type, $search, $filters, (bool) $justAccount, (int) $status);

            return $this->respond(
                $response,
                (new ActionPayload(200, $results))->setPager($paginator)
            );
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         * @throws \Exception
         */
        public function search(Request $request, Response $response, array $args) {
            $params = $request->getQueryParams();
            $search = $params["query"] ?? false;
            if($search) {
                $results = $this->repository->searchAccountsAndUsers($search);
                return $this->respond(
                    $response,
                    new ActionPayload(200, $results)
                );

            }
            return $this->badRequest($response);
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         */
        public function updateMembership(Request $request, Response $response, array $args)
        {
            $membership = $this->repository->getModel("membership")->load((int) $args["id"], "account_id");
            if (!$membership->isLoaded()) {
                return $this->notFound($response);
            }
            $membership->save($this->getData());
            return $this->noContent($response);
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @throws \Exception
         */
        public function createMembership(Request $request, Response $response, array $args)
        {
            $this->repository->getModel("membership")->save($this->getData());
        }

      /**
       * @param Request $request
       * @param Response $response
       * @param array $args
       * @throws \Exception
       */
        public function listAccountsByMembership(Request $request, Response $response, array $args)
        {
            $params = $request->getQueryParams();
            $model = $this->repository->getModel("membership")->findAll($params);
            return $this->respond(
              $response,
              new ActionPayload(200, $model)
            );
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         */
        public function getById(Request $request, Response $response, array $args): Response
        {
            $model = $this->repository->getModel()->load($args["id"])->loadUsers()->loadMembership();
            return $this->respond(
                $response,
                new ActionPayload(200, $model->load($args["id"]))
            );
        }

      /**
       * @param Request $request
       * @param Response $response
       * @param array $args
       * @return Response
       * @throws \App\Domain\DomainException
       */
      public function activate_account(Request $request, Response $response, array $args): Response
      {
        $hash = $args['token'] ?? null;

        if ( !isset($hash) || !$hash ) {
          return $this->badRequest($response);
        }

        $token_type = $this->repository->getModel('tokenType')->load('activation_link', 'label');
        try {
            $token = $this->repository->verify($hash, $token_type->getId());
            $user = $token->loadUser()->getUser();

            if(!$user) {
                throw new \Exception("Invalid user id");
            }

            $meta = $token->getData("meta");
            $region_id = DEFAULT_REGION_CODE_ID;
            if($meta) {
                $region    = json_decode($meta, true);
                $region_id = $region['region_id'] ?? $region_id;
            }
            $token->setTokenInactive();
            $session = $this->repository->createSession($user->getId(), ['region_id' => $region_id]);
            $session->setUser($user);

            $user->getAccount()->setActive();

        }
        catch(\Exception $e) {
            return $this->notFound($response);
        }

        return $this->respond(
            $response,
            new ActionPayload(200, $session)
        );

      }

      /**
       * @param Request $request
       * @param Response $response
       * @param array $args
       * @return Response
       * @throws \Exception
       */
      public function activation_link (Request $request, Response $response, array $args): Response
      {

        $email = $args["email"] ?? null;

        $model = $this->repository->getModel('user')->load($email, 'email');

        if ( !$model->isLoaded() ) {
          return $this->notFound($response);
        }

        $token_type = $this->repository->getModel('tokenType')->load('activation_link', 'label');

        try {
          $token = $this->repository->getModel('token')
            ->findOne([
              'user_id' => $model->getId(),
              'token_type_id' => $token_type->getId(),
              'active' => 1,
              'expires' => ['>', date('Y-m-d H:i:s')]
            ]);
        } catch (\Exception $e) {
          $token = $this->repository->getModel('token')
            ->createActivationLink($model->getId(), $token_type);
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
         * @return Response
         * @throws \Exception
         */
      public function paymentRequest(Request $request, Response $response, array $args): Response
      {
          $id = $args["id"] ?? null;

          $model = $this->repository->getModel("user")->load($id, 'account_id');

          if ( !$model->isLoaded() ) {
              return $this->notFound($response);
          }

          $token_type = $this->repository->getModel('tokenType')->load('payment_request', 'label');

          try {
              $token = $this->repository->getModel('token')
                  ->findOne([
                      'user_id' => $model->getId(),
                      'token_type_id' => $token_type->getId(),
                      'active' => 1,
                      'expires' => ['>', date('Y-m-d H:i:s')]
                  ]);
          } catch (\Exception $e) {
              $token = $this->repository->getModel('token')
                  ->createPaymentRequest($model->getId(), $token_type);
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
       * @return Response
       * @throws \Exception
       */
      public function autoLoader(Request $request, Response $response, array $args): Response
      {
          $hash = $args['token'] ?? null;

          if ( !isset($hash) || !$hash ) {
              return $this->badRequest($response);
          }

          $token_type    = $this->repository->getModel('tokenType')->load('auto_loader', 'label');
          $token_session = $this->repository->getModel('tokenType')->load('session', 'label');

          try {
              $token = $this->repository->verify($hash, $token_type->getId());
              $user = $token->loadUser()->getUser();
              $token->setTokenInactive();
              if(!$user) {
                  throw new \Exception("Invalid user id");
              }
              $session_token = $this->repository->getModel('token')->createActivationLink($user->getId(), $token_session);
              return $this->respond(
                  $response,
                  new ActionPayload(200, [
                      'token' => $session_token->getData("token"),
                      'user'  => $user
                  ])
              );
          }
          catch(\Exception $e) {
              return $this->notFound($response);
          }
      }

      /**
       * @param Request $request
       * @param Response $response
       * @param array $args
       * @return Response
       * @throws \Exception
       */
      public function optIn(Request $request, Response $response, array $args): Response
      {
          $hash = $args['token'] ?? null;

          if ( !isset($hash) || !$hash ) {
              return $this->badRequest($response);
          }

          $token_type    = $this->repository->getModel('tokenType')->load('opt_in_directory', 'label');

          try {
              $token = $this->repository->verify($hash, $token_type->getId());
              $user = $token->loadUser()->getUser();
              $token->setTokenInactive();
              if(!$user) {
                  throw new \Exception("Invalid user id");
              }
              return $this->respond(
                  $response,
                  new ActionPayload(200, [
                      'user'  => $user
                  ])
              );
          }
          catch(\Exception $e) {
              return $this->notFound($response);
          }
      }

        /***
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         * @throws \Exception
         */
      public function getAllOfferings(Request $request, Response $response, array $args): Response
      {
          $accounts = [];
          $params = $request->getQueryParams();

          /*
           * Offerings data
           */
          foreach(['trade', 'region', 'type'] as $model){
              $model_id = $model . '_id';
              /*
               * Filter by ids
               */
              if(isset($params[$model]) && $params[$model]){
                  $offering_filter[$model][$model_id] = $params[$model];
              }/*
               * Filter region by type_id
              */
              if(isset($params['region_type_id']) && $model == 'region'){
                  $offering_filter[$model]['type_id'] = $params['region_type_id'];
              }

              $modelMapping = $this->repository->getModel('offering_' . $model . '_mapping') ;
              foreach($modelMapping->all($offering_filter[$model] ?? []) as $value){
                  $accounts[$value['account_id']]['account_id'] = $value['account_id'];
                  $accounts[$value['account_id']]['offerings'][$model][$value[$model_id]] = (int)$value[$model_id];
              }
          }

          return $this->respond(
              $response,
              new ActionPayload(200, $accounts)
          );
      }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getEngagement(Request $request, Response $response, array $args): Response
    {
        $id = $args["id"] ?? null;
        $users = $this->repository->getModel('user')->findAll(['account_id' => $id]);
        $user_ids = [];
        array_map(function ($user) use (&$user_ids) {
            $user_ids[] = $user['id'];
        }, $users);

        return $this->respond(
            $response,
            new ActionPayload(200, $this->repository->getUsersEngagement($user_ids))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getEngagements(Request $request, Response $response, array $args): Response
    {
        $ids = explode(",", str_replace(["[", "]"], "", $args["ids"]));
        $accounts = $this->repository->getAccountsWithUsers($ids);
        $users = array_map(function($account){
            return array_map(function($user){
                return intval($user['id']);
            }, $account['users']);
        }, $accounts);

        $user_ids = [];
        foreach($users as $userList) {
            $user_ids = array_merge($user_ids, $userList);
        }
        $engagements = array_map(function($e) use ($users) {
            $extra = [];
            foreach($users as $aid => $userList) {
                if (in_array($e["user_id"], $userList)) {
                    $extra = ['account_id' => $aid];
                    break;
                }
            }
            return $e + $extra;
        }, $this->repository->getUsersEngagement($user_ids));
        return $this->respond(
            $response,
            new ActionPayload(200, $engagements)
        );
    }

      /**
       * @param Request $request
       * @param Response $response
       * @param array $args
       * @return Response
       * @throws \Exception
       */
      public function getOrganisation(Request $request, Response $response, array $args): Response
      {
          $id = $args["id"] ?? null;
          $users = $this->repository->getModel('userOrganisation')->all(['ur.account_id' => $id]);
          $data = [];
          array_map(function($user) use (&$data){
              $label = $user['label'] ?? null;
              if(isset( $user['custom_type_label']) &&  $user['custom_type_label']){
                  $label = $user['custom_type_label'];
              }
              $data[] = [
                  'id'        => (int)$user['id'],
                  'user_id'   => $user['user_id'],
                  'firstname' => $user['user_firstname'] ?? $user['firstname'],
                  'lastname'  => $user['user_lastname'] ?? $user['lastname'],
                  'phone'     => $user['contact_number'] ?? $user['user_phone'],
                  'email'     => $user['user_email'] ?: $user['email'],
                  'title'     => $label,
                  'type_id'   => (int)$user['type_id']
              ];

          }, $users);

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
         * @throws \ReflectionException
         */
      public function getOrganisationRoleType(Request $request, Response $response, array $args): Response
      {
          return $this->respond(
              $response,
              new ActionPayload(200, $this->repository->getModel('userOrganisationType')->all())
          );
      }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         * @throws \App\Domain\DomainException
         */
      public function createOrganisation(Request $request, Response $response, array $args): Response
      {
          $data = $this->getData();
          if ($data) {
              $id = $this->repository->getModel('userOrganisation')->save($data)->getId();
          } else {
              return $this->badRequest($response);
          }

          return $this->respond(
              $response,
              new ActionPayload(200, array('id' => $id))
          );
      }

      /**
       * @param Request $request
       * @param Response $response
       * @param array $args
       * @return Response
       * @throws \Exception
       */
      public function updateOrganisationMember(Request $request, Response $response, array $args): Response
      {
          $aid = (int)($args["aid"] ?? 0);
          $id  = (int)($args["id"]  ?? 0);
          $member = $this->repository->getModel('userOrganisation')->load($id, 'id');
          $data = $this->getData();
          if($member->isLoaded()){
              if((int)$member->getData("account_id") === $aid){
                  $user_id = (int)$member->getData("user_id");
                  if($user_id && $data['user_id']){
                      $user = $this->repository->getModel('user')->load($user_id, 'id');
                      if($user->isLoaded()){
                          $user->save([
                              'firstname'      => $data['firstname'],
                              'lastname'       => $data['lastname'],
                              'display_name'   => $data['display_name'] ?? '',
                              'contact_number' => $data['contact_number'],
                              'email'          => $data['user_email']
                          ]);
                      }
                  }
                  else{
                      $data['user_firstname']  = $data['firstname'];
                      $data['user_lastname']   = $data['lastname'];
                      $data['user_phone'] = $data['contact_number'];
                  }
                  $member->save($data);
                  return $this->respond(
                      $response,
                      new ActionPayload(200, array('id' => $id))
                  );
              }
          }
          return $this->badRequest($response);
      }

      /**
       * @param Request $request
       * @param Response $response
       * @param array $args
       * @return Response
       * @throws \Exception
       */
      public function deleteOrganisationMember(Request $request, Response $response, array $args): Response
      {
          $aid = (int)($args["aid"] ?? 0);
          $id  = (int)($args["id"]  ?? 0);
          $member = $this->repository->getModel('userOrganisation')->load($id, 'id');
          if($member->isLoaded()){
              if((int)$member->getData("account_id") === $aid){
                  $member->delete($id);
                  return $this->noContent($response);
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
      public function deleteOrganisationMemberByUserId(Request $request, Response $response, array $args): Response
      {
          $aid = (int)($args["aid"] ?? 0);
          $uid = (int)($args["id"] ?? 0);
          $member = $this->repository->getModel('userOrganisation')->load($uid, 'user_id');
          if($member->isLoaded()){
              if((int)$member->getData("account_id") === $aid){
                $id = (int)$member->getData("id");
                $member->delete($id);
                return $this->noContent($response);
              }
          }
          return $this->notFound($response);
      }

        public function getAccountsByRegion(Request $request, Response $response, array $args): Response
        {
            $params = $request->getQueryParams();
            $region = (int) ($args["rid"] ?? 0);
            if($region === 0) {
                return $this->badRequest($response);
            }

            $accounts = $this->repository->getAccountsByRegion($region, $params);
            $result = [];
            if (!empty($accounts)) {
                $ids = array_map(function ($item) {
                    return $item['id'];
                }, $accounts);
                $result = $this->repository->getAccountsWithUsers($ids);
            }
            return $this->respond(
                $response,
                new ActionPayload(200, $result)
            );
        }

        public function createAction(ServerRequestInterface $request, Response $response, array $args): Response
        {
            $data = $this->getData();
            $account_type = $this->repository->getModel('account_action_type')->getActionTypeId($data['action_type']);

            if ($account_type) {
                $this->repository->getModel('account_action')->save([
                    'account_id'              => (int) $data['account_id'],
                    'related_account_id'      => (int) $data['related_account_id'],
                    'account_user_id'         => (int) $data['account_user_id'],
                    'related_account_user_id' => $data['related_account_user_id'] ?? null,
                    'action_type'             => (int) $account_type,
                    'description'             => $data['description'],
                ]);
            }

            $response->getBody()->write(json_encode(['status' => 'success']));
            return $response->withHeader('Content-Type', 'application/json');
        }

        public function fetchAction(Request $request, Response $response, array $args): Response
        {
            try {
                $params = $request->getQueryParams();
                $limit = (int)($params["limit"] ?? 200);
                $offset = (int)($params["offset"] ?? 0);
                $actionType = $params["action_type"] ?? null;
                $actionDate = $params["action_date"] ?? null;

                $results = $this->repository->listAccountActions($limit, $offset, $actionType, $actionDate);

                $paginator = $this->repository->getAccountActionsPaginator($request, $actionType, $actionDate);

                return $this->respond(
                    $response,
                    (new ActionPayload(200, $results))->setPager($paginator)
                );
            } catch (\Exception $e) {
                return $this->respond($response, new ActionPayload(400, [
                    "error" => $e->getMessage()
                ]));
            }
        }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function fetchAccountUsers(Request $request, Response $response, array $args): Response
    {
        try {
            $params    = $request->getQueryParams();
            $accountId = (int)$args['account_id'];
            $term      = $params['term'] ?? null;
            $roleId    = isset($params['role']) ? (int)$params['role'] : null;
            $groupId   = isset($params['group']) ? (int)$params['group'] : null;
            $limit     = (int)($params['limit'] ?? 25);
            $offset    = (int)($params['offset'] ?? 0);
            $external  = isset($params['external']) ? (int)$params['external'] : null;

            $users = $this->repository->searchUsersByAccountId($accountId, $term, $roleId, $groupId, $limit, $offset, $external);

            $paginator = $this->repository->getAccountUsersPaginatorByAccount($request, $accountId, $term, $roleId, $groupId, $external);

            return $this->respond(
                $response,
                (new ActionPayload(200, $users))->setPager($paginator)
            );
        } catch (\Exception $e) {
            return $this->respond($response, new ActionPayload(400, [
                "error" => $e->getMessage()
            ]));
        }
    }
}
