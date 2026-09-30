<?php


    namespace App\Models;
    use App\Api\Account;
    use App\Api\Exception;

    class User
    {
        const ACCOUNT_DATA_KEY = "account";

        const LOGOS_MIGRATED = false;

        const USER_LOGO_PATH = 'wp-content/themes/clink/documents/profiles';

        const ACCOUNT_LOGO_PATH = 'wp-content/themes/clink/documents/pro_companies';

        const DEFAULT_LOGO = 'images/png/default-icon.png';

        const STATUS_INACTIVE = 0;

        const STATUS_PENDING  = 1;

        const STATUS_ACTIVE   = 2;


        /**
         * @todo this label should be exposed via the account service, wait until we have a cache layer
         * in place first.
         */
        const ADMIN_ROLE_NAME = "administrator";

        /**
         * @var mixed|string
         */
        protected $id;

        /**
         * @var mixed|string
         */
        protected $accountId;

        /**
         * @var mixed|string
         */
        protected $token = "";

        /**
         * @var array
         */
        protected $data = [];

        /**
         * @var array
         */
        protected $team = [];

        /**
         * @var array
         */
        protected array $team_role_permissions = [
            'administrator'   => ['administrator','account_holder','super_admin','team_admin','team_manager','team_assistant','witness','approver'],
            'account_holder'  => ['administrator','account_holder','super_admin','team_admin','team_manager','team_assistant','witness','approver'],
            'super_admin' => [
                'super_admin',
                'team_admin',
                'team_manager',
                'team_assistant',
                'approver',
                'witness',
                'project_team_member'
            ],
            'team_admin' => [
                'team_manager',
                'team_assistant',
                'approver',
                'witness'
            ],
            'team_manager' => [
                'team_assistant',
                'approver',
                'witness'
            ],
        ];

        protected $membership;

        /**
         * User constructor.
         * @param $id
         * @param $aid
         * @param $token
         * @throws \App\Api\Exception
         */
        public function __construct($id, $aid, $token) {
            $this->id = $id;
            $this->accountId = $aid;
            $this->token = $token;
            $this->loadFromApi();
        }

        /**
        * @return array|mixed|string|string[]|null
        */
        public function getTeamRole () {
            return $this->getData('type');
        }

        /**
         * @return string
         */
        public function getCompanyLogo() : string {
          $url = Account::getConfig("company_logo_url");
          $hash = md5($this->getAccountId());
          return sprintf("%s/%s/logo.png",
              $url, $hash
          );
        }

      /**
       * @return bool
       * @throws Exception
       */
        public static function isAdministrator(): bool
        {
          $token = app()->Cookie->getCookie('token');
          $isAdmin = false;
          if($token) {
            if($user_session = app()->Cookie->getUserSession()) {
              $account_info = Account::getUser($user_session['user_id']);
              $role = array_search($account_info['type_id'], Account::getTypes('account'), true);
              $isAdmin = ($role === 'administrator');
            }
          }
          return $isAdmin;
        }

        /**
         * @return mixed|string
         */
        public function getId() {
            return $this->id;
        }

        /**
         * @return mixed|string
         */
        public function getAccountId() {
            return $this->accountId;
        }

        /**
         * @return mixed|string
         */
        public function getRole(bool $parent = false) {

          $type_id = $this->getAccountData('type_id') ?? $this->getData('type_id');
          $role = array_search($type_id, Account::getTypes(), true);

          if($parent){
            if($role == 'specialist_free' || $role == 'specialist_monthly' || $role == 'specialist_yearly'){
              return 'specialist';
            }
          }
          return $role;
        }

        /**
         * @return mixed|string
         */
        public function getToken() {
            return $this->token;
        }

        /**
         * @param array $data
         * @return $this
         */
        public function setData(array $data) {
            $this->data = $data;
            return $this;
        }

        /**
         * @param mixed|null $k
         * @return array|mixed|string|string[]|null
         */
        public function getData($k="", $area="") {
            $data = $this->data;
            if($area) {
                $data = $this->data[$area] ?? [];
            }

            if($k) {
                return $data[$k] ?? null;
            }
            return $data;
        }

      /**
       * @param string $k
       * @return array|mixed|string|string[]|null
       */
      public function getAccountData($k="") {
            return $this->getData($k, User::ACCOUNT_DATA_KEY);
        }

      /**
       * @return string
       */
      public function getFullName(): string
        {
          return (string)$this->getData('display_name');
        }

        /**
         * @return false|string
         */
        public function getNameInitials()
        {
            return strtoupper(mb_substr(trim($this->getData('firstname')),0,1) . mb_substr(trim($this->getData('lastname')),0,1));
        }

        /**
         * @return Membership
         */
        public function getMembership() {
          if(!$this->membership) {
              $this->membership = new Membership(
                  $this->data[User::ACCOUNT_DATA_KEY]["membership"],
                  $this->isAdmin()
              );
          }
          return $this->membership;
        }

        /**
         * @return bool
         */
        public function isAdmin() {
            return (strcasecmp($this->getRole(), $this::ADMIN_ROLE_NAME) === 0);
        }

        /**
         * @throws \App\Api\Exception
         */
        public function loadFromApi() {
            $this->data = [];
            if($this->id) {
                $account = Account::getAccount($this->getAccountId());
                foreach($account["users"] as $user) {
                    if((int)$user["id"] === (int)$this->getId()) {
                        $this->data = $user;
                    }
                }

                $this->team = $account["users"];

                unset($account["users"]);
                $this->data[User::ACCOUNT_DATA_KEY] = $account;
            }
        }

      /**
       * @return array
       */
        public function getUserIds()
        {
          $ids = [];
          foreach($this->team as $user){
             $ids[] = $user['id'];
          }

          $ids[] = $this->getAccountId();
          return $ids;
        }

      /**
       * The lowest id found in the array is the account holder because we assume that the first one
       * that is created in the team is the holder id
       */
      public function getAccountHolderId(): int
        {
          $id = 0;
          foreach($this->team as $user){
            if(!$id || $id > $user['id']){
              $id = $user['id'];
            }
          }
          if(!$id){
            throw new \Exception('Could not locate account holder id');
          }
          return $id;
        }

        /**
         * @return array
         */
        public function getTeam(): array
        {
            return $this->team;
        }

        /**
         * @return array
         */
        public function getTeamRolePermissions(): array
        {
            return $this->team_role_permissions;
        }

        /**
         * @param string $permission
         * @return array
         */
        public function getTeamRolePermission(string $permission): array
        {
            return $this->getTeamRolePermissions()[$permission] ?? [];
        }

        /**
         * @param string $role
         * @return bool
         */
        public function canChangeTeamMember(string $role): bool
        {
            if($role_permission = $this->getTeamRolePermission($this->getTeamRole())){
                return (
                    in_array($role, $role_permission, false) ||
                    in_array("*",   $role_permission, false)
                );
            }
            return false;
        }

        /**
         * @param string $key
         * @param $data
         * @return $this
         */
        public function setSession(string $key, $data){
            $_SESSION[$key] = $data;
            return $this;
        }

        /**
         * @param string $key
         * @return mixed|null
         */
        public function getSession(string $key) {
            return $_SESSION[$key] ?? null;
        }

        /**
         * @param string $key
         * @return $this
         */
        public function clearKey(string $key) {
            $_SESSION[$key] = null;
            return $this;
        }

        /**
         * @param $id
         * @return bool
         */
        public function isAccountId($id) : bool {
            return ((int) $id === (int) $this->getAccountId());
        }

        /**
         * @param int $region_id
         * @return array
         * @throws \Exception
         */
        public function getRegionGroupByRegionId(int $region_id): array {

            if($region_group = Account::getRegionGroups()) {
                $region = array_filter($region_group, function ($group) use ($region_id) {
                    if ( (int)$group['id'] === $region_id ) {
                        return $group;
                    }
                    return false;
                });
                return array_shift($region);
            }
            return [];
        }

        /**
         * @return int
         */
        public function getRegionId(): int {
            return (int)($this->getData("account")['region_group_id'] ?? ACCOUNT::DEFAULT_REGION_ID);
        }

        /**
         * @param string|null $metaKey
         * @return mixed|null
         */
        public function getAccountMeta(?string $metaKey = null)
        {
            $meta = $this->getAccountData("meta");
            $meta = json_decode((string)$meta, true);
            return $meta[$metaKey] ?? null;
        }

        /**
         * @param string $metaKey
         * @return bool
         */
        public function getAccountMetaKey(string $metaKey): bool
        {
            return (bool)$this->getAccountMeta($metaKey);
        }

        /**
         * @throws \App\Api\Exception
         */
        public function __wakeup () {
            $this->loadFromApi();
        }
    }
