<?php
    declare(strict_types=1);

    namespace App\Domain\Account;

    use App\Domain\AbstractTypedModel;
    use App\Domain\Account\AccountType;
    use App\Domain\User\Role;
    use App\Domain\User\RoleMappings;
    use App\Domain\User\User;
    use App\Domain\User\UserOrganisation;
    use App\Infrastructure\Environment;
    use App\Domain\Account\AccountRole;
    use App\Domain\Account\AccountRoleUserMapping;

    /**
     * Class Account
     * @package App\Domain\Account
     */
    class Account extends AbstractTypedModel
    {

        public CONST CONFIRMED_STATUS_ID = 2;

        public CONST CLINK_LOGO_PATH = '/wp-content/themes/clink/images/sunset-london.jpg';
        public CONST MAIN_CONTRACTOR_LOGO_PATH = '/wp-content/themes/clink/documents/profiles/{id}/logos/';
        public CONST PROSPER_LOGO_PATH = '/wp-content/themes/clink/framework/public/static/users/{id}/logo/';
        public CONST EXTERNAL_LOGO_PATH = '/wp-content/themes/clink/images/default-icon.png';
        public CONST PROSPER_DEFAULT_LOGO_PATH = '/wp-content/themes/clink/framework/public/static/default/images/specialist-logo.png';
        public CONST LEGACY_PROSPER_PROSPER_LOGO_NAME = 'specialist-logo.png';

        /**
         * @var string
         */
        protected $typeModel = AccountType::class;

        /**
         * @var array
         */
        protected $columns = [
            'id' => [
                'type' => 'int',
                "pk" => true,
                "ai" => true
            ],
            'name' => [
                'type' => 'string',
                'required' => true
            ],
            'email' => [
                'type' => 'email',
                'required' => true
            ],
            'address' => [
                'type' => 'string'
            ],
            'landline' => [
                'type' => 'string'
            ],
            'description' => [
              'type' => 'text'
            ],
            'mobile' => [
                'type' => 'string'
            ],
            'reg_number' => [
                'type' => 'int',
                'required' => true
            ],
            'logo' => [
                'type' => 'string'
            ],
            'utr' => [
                'type' => 'string'
            ],
            'type_id' => [
                'type' => 'int',
                'required' => true
            ],
            'region_group_id' => [
                'type' => 'int',
                'required' => true
            ],
            'slogan' => [
                'type' => 'string'
            ],
            'website' => [
              'type' => 'string'
            ],
            'created_at' => [
                'type' => 'date'
            ],
            'status' => [
                'type' => 'int'
            ],
            'team_seats' => [
              'type' => 'int',
            ],
            'first_pqq_sent' => [
              'type' => 'int'
            ],
            "meta" => [
                "type" => "text"
            ]
        ];

      /**
       * @param int $account_id
       * @param int $type_id
       * @param string $logo
       * @return string
       */
        public function getAccountLogoUrl(int $account_id, int $type_id, string $logo): string
        {

          switch ($type_id){
            case 2:
              $path = self::MAIN_CONTRACTOR_LOGO_PATH;
            break;

            case 3:
              $path = self::PROSPER_LOGO_PATH;
            break;

            case 4:
              $path = self::EXTERNAL_LOGO_PATH;
            break;

            default:
              $path = self::CLINK_LOGO_PATH;
            break;
          }

          /*
           * This logo is the default logo for prosper from legacy production
           */
          if($logo == self::LEGACY_PROSPER_PROSPER_LOGO_NAME || !$logo){
            $logo = '';
            $path = self::PROSPER_DEFAULT_LOGO_PATH;
          }

          return Environment::getValue("CLINK_URL") . str_replace("{id}", (string) $account_id, $path) . $logo;
        }

      /**
       * @throws \ReflectionException
       */
      public function getMembership()
        {
          if($this->isLoaded())
          {
            return (new Membership())->load($this->getId(), "account_id");
          }
        }

      /**
       * @return $this
       * @throws \App\Domain\DomainException
       */
      public function setActive()
      {
        if($this->isLoaded())
        {
          $this->save(['status' => self::CONFIRMED_STATUS_ID]);
        }

        return $this;
      }

        /*
         * This is just for importing accounts
         */
      /**
       * @param int $id
       */
      public function updateId(int $id): void
        {
          $this->data['id'] = $id;
        }

        /**
         *  If Account has no Membership, create as free trial by default.
         */
        public function afterSave()
        {
            $aid = $this->getId();
            $membership = (new Membership())->load($aid, "account_id");
            if (!$membership->isLoaded()) {
                $membership->save(["account_id" => $aid]);
            }
        }

      /**
       * @return array|mixed
       * @throws \ReflectionException
       */
      public function getAccountHolder()
        {
            $this->loadUsers();
            $id = null;
            $account_holder = false;
            foreach($this->children["users"] as $user){
              if(!$account_holder || $user->getId() < $account_holder->getId()){
                $account_holder = $user;
              }
            }

            return $account_holder;
        }

        /**
         * @TODO make the findall return an object instead of array
         * +     * @return $this
         * +     * @throws \ReflectionException
         * +     */
        public function loadUsers()
        {
            $this->children["users"] = [];
            if ($this->isLoaded()) {
                $users = [];
                foreach ((new User())->findAll(["account_id" => $this->getId()]) as $user) {
                    $user['logo_path'] =  self::getAccountLogoUrl((int)$user['id'], (int)$this->getData('type_id'), (string)$user["logo"]);
                    $user["type"] = (new User())->getTypeModel()->getLabel((int) $user["type_id"]);
                    $accountrole = (new AccountRoleUserMapping())->getMappedAccountRolesForUser((int) $user["id"]);
                    $accountGroups = (new AccountGroupUserMapping())->getMappedAccountGroupsForUser((int) $user["id"]);
                    //$roleIds = array_column($roleMapping, "account_role_id");
                    //$roles = (new AccountRole())->getWhereIn('id', $roleIds);
                    $user["roles"] = $accountrole;
                    $user["groups"] = $accountGroups;
                    $users[] = (new User())->setData($user);
                }
                $this->children["users"] = $users;
            }
            return $this;
        }

      /**
       * @return $this
       */
      public function loadMembership(): Account
        {
          if ($this->isLoaded()) {
            $membership = (new Membership())->load($this->getId(), 'account_id');
            $this->children['membership'] = $membership;
          }
          return $this;
        }

        /**
         * @param array $data
         * @return User
         */
        public function createUser(array $data) : User {
          $user = new User();
          if($this->isLoaded()) {
              $data["account_id"] = $this->getId();
              if(!isset($data["type_id"]) || !isset($data["type"])) {
                  $data["type"] = User::ACCOUNT_HOLDER_TYPE;
              }
              $user->save($data);
              $user->setAccount($this);
          }
          return $user;
        }

        /**
         * @param mixed $key
         * @return array|mixed|object
         */
        public function getMeta(mixed $key = null) {
           $json = $this->data["meta"] ?? "";
           $meta = [];
           if($json) {
               $meta = json_decode($json, true);
           }
           if(is_string($key)) {
               return $meta[$key] ?? [];
           }

           return $meta;
        }
    }
