<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence\Account;

use App\Domain\Account\Account;
use App\Domain\User\UserNotFoundException;

class InMemoryAccountRepository
{
  private $account;

  protected $users;

  /**
   * InMemoryAccountRepository constructor.
   * @param Account $account
   */
  public function __construct (Account $account)
  {
    $this->account = $account;
  }

  /**
   * {@inheritdoc}
   */
  public function findAll (): array
  {
     return $this->account->getAllAccounts();
  }

  /**
   * @param int $id
   * @return Account
   */
  public function findUserOfId (int $id): Account
  {
    if ( !isset($this->users[$id]) ) {
      throw new \RuntimeException('User not found');
    }
    return $this->users[$id];
  }

  /**
   * @param int $id
   * @return bool
   */
  public function deleteById (int $id): bool
  {
    if ( !isset($this->users[$id]) ) {
        throw new \RuntimeException('User not found');
    }
    return true;
  }

  /**
   * @param array $args
   * @return bool
   */
  public function create (array $args): bool
  {

    if(empty($args)){
      return false;
    }

    return true;
  }

  /**
   * @param int $id
   * @param array $args
   * @return bool
   */
  public function updateById (int $id, array $args): bool
  {
    if ( !isset($this->users[$id]) ) {
       throw new \RuntimeException('User not found');
    }
    return true;
  }
}
