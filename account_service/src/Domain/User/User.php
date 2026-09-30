<?php

namespace App\Domain\User;

use App\Domain\AbstractTypedModel;
use App\Domain\Account\Account;

class User extends AbstractTypedModel
{

    const ACCOUNT_HOLDER_TYPE = "account_holder";

    const USER_STATUS_ACTIVE = 2;

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'account_id' => [
      'type' => 'int',
      'required' => true
    ],
    'firstname' => [
      'type' => 'string',
      'required' => true,
      'validate' => 'minlength:0|maxlength:50'
    ],
    'lastname' => [
      'type' => 'string',
      'required' => true,
      'validate' => 'minlength:0|maxlength:50'
    ],
    'logo' => [
      'type' => 'string',
      'required' => false
    ],
    'job_title' => [
      'type' => 'string',
    ],
    'display_name' => [
      'type' => 'string',
    ],
    'contact_number' => [
      'type' => 'string',
    ],
    'email' => [
      'type' => 'email',
      'required' => true
    ],
    'password' => [
      "type" => 'string',
      'required' => true,
      'validate' => 'minlength:12|maxlength=100'
    ],
    'type_id' => [
      'type' => 'int',
      'required' => true
    ],
    'status' => [
      'type' => 'int',
    ],
    'acl_enabled' => [
      'type' => 'int',
    ],
    'migrated' => [
      'type' => 'int',
    ],
    "meta" => [
        "type" => "text",
        'required' => false
    ]
  ];

  protected $itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; //wordpress ito64 for password hash
  protected $iteration_count_log2 = 8; //wordpress value

    /**
     * @var string
     */
  protected $typeModel = Role::class;

  protected $response_column_blacklist = [
    'password'
  ];

  protected $account;

  /**
   * @return Account
   */
  public function getAccount()
  {
    if(!$this->account){
      if($this->isLoaded()){
        $this->account = (new Account)->load($this->getData('account_id'));
      }
    }
    return $this->account;
  }

  /**
   * @param Account $account
   */
  public function setAccount(Account $account)
  {
    $this->account = $account;

    return $this;
  }

  /**
   * @param int $id
   * @throws \ReflectionException
   */
  public function getUsersByAccount (int $id): void
  {
      if(method_exists($this->getDb(), 'getRow')) {
          $this->data = $this->getDb()::getRow(
              sprintf('SELECT * FROM %s WHERE account_id=? LIMIT 1', $this->getName()),
              [$id]
          );
      }
  }

    /**
     * @param string $password
     * @return bool
     * @throws \Exception
     */
  public function validatePassword (string $password): bool
  {
    $hash = $this->data["password"] ?? false;

    if ( !$hash ) {
      return false;
    }
    if ( $this->hasPasswordMigrated() ) {
      return password_verify($password, $hash);
    } else {
      return $this->password_old_verify($password, $hash);
    }

  }

    /**
     * @param string $password
     * @param string $password_hash
     * @return bool
     */
  public function password_old_verify (string $password, string $password_hash): bool
  {

    // If the hash is still md5...
    if ( strlen($password_hash) <= 32 ) {
      $output = md5($password);
    }else {

      $count_log2 = strpos($this->itoa64, $password_hash[3]);
      $count = 1 << $count_log2;

      $salt = substr($password_hash, 4, 8);
      $hash = md5($salt . $password, TRUE);
      do {
        $hash = md5($hash . $password, TRUE);
      } while (--$count);

      $output = substr($password_hash, 0, 12);
      $output .= $this->legacy_encode64($hash, 16);
    }

    return $output === $password_hash;
  }

  /**
   * If the user created a new account we dont need to check if the password is migrated
   * @return bool
   */
  public function hasPasswordMigrated (): bool
  {
    if(!isset($this->data['password']))
    {
      throw new \Exception('User is missing password');
    }
    return strpos($this->data['password'], '$argon2id$') === 0;
  }

  /**
   * Wordpress function used in password hashing
   * DON'T MODIFY IT
   * @param string $input
   * @param int $count
   * @return string
   */
  public function legacy_encode64(string $input, int $count): string
  {
    $output = '';
    $i = 0;
    do {
      $value = ord($input[$i++]);
      $output .= $this->itoa64[$value & 0x3f];
      if ($i < $count)
        $value |= ord($input[$i]) << 8;
      $output .= $this->itoa64[($value >> 6) & 0x3f];
      if ($i++ >= $count)
        break;
      if ($i < $count)
        $value |= ord($input[$i]) << 16;
      $output .= $this->itoa64[($value >> 12) & 0x3f];
      if ($i++ >= $count)
        break;
      $output .= $this->itoa64[($value >> 18) & 0x3f];
    } while ($i < $count);

    return $output;
  }

  /**
   * We need to encrypt the password with wordpress hashing method because we need to support
   * backwards compatibility
   * @param string $password
   * @return string
   */
  public function encryptPassword (string $password): string
  {
    /*
     * If the password has failes we will fallback to our own hash implementation
     */
    return password_hash($password, PASSWORD_ARGON2ID);
  }


  /**
   * This function needs to be implemented after we migrate everything from
   * wordpress because currently we still rely to wordpress to handling the password
   * hash implementation
   *
   * Currently we are using the same hashing ecryption as wordpress so we can check if the passwords
   * are correct
   *
   * @param string $password
   * @throws \Exception
   */
  public function migratePassword (string $password): void
  {
      if ( !$this->hasPasswordMigrated() ) {
        $data['password'] = $password;
        $data['migrated'] = 1;
        $this->save($data);
      }
  }

    /**
     * @param string $first_name
     * @param string $last_name
     * @param string $separator
     * @return string
     */
    public function setDisplayName(string $first_name, string $last_name = '', string $separator = ' '): string
    {
        if ($first_name && $last_name) {
            return $first_name . $separator . $last_name;
        }

        return $first_name ?: $last_name;
    }

  /*
   * This is just for importing accounts
  */
  public function updateId(int $id)
  {
    $this->data['id'] = $id;
  }

  /**
   * @param array $values
   * @return array
   */
  public function beforeSave ($values,array $raw = []): array
  {

    /*
     * If the password is no migrated we need to encrypt it
     */
    if ( isset($raw["password"]) ) {
      $values["password"] = $this->encryptPassword($raw["password"]);
    }

    //this is not sent by the user is created dynamically by us from firstname and lastname
    if ( !isset($values["display_name"]) ) {
      $values["display_name"] = $this->setDisplayName(($values['firstname'] ?? ''), ($values['lastname'] ?? ''));
    }

    return $values;
  }

  public function setLegacyPassword(string $password)
  {
    $this->data['password'] = $password;
  }

  /**
   * Flags the user's account as Active. Needed for logins (e.g. SSO) that never go through
   * the invite-acceptance flow, which is otherwise the only place that sets this status.
   */
  public function activate(): void
  {
    if ((int) $this->getData('status') !== self::USER_STATUS_ACTIVE) {
      $this->save(['status' => self::USER_STATUS_ACTIVE]);
    }
  }
}
