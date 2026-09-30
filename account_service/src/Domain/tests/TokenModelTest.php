<?php

use App\Domain\User\Token;

class TokenModelMock extends Token
{

  public $data = [];

  /** @phpstan-ignore-next-line */
  public function getDB () {}

  public function save (array $data, $insertOnly = false)
  {
    return $this;
  }
}


class TokenModelTest extends \PHPUnit\Framework\TestCase
{

  protected $t;

  public function setUp (): void
  {
    $this->t = new TokenModelMock();
  }

  public function test_get_expiry_timestamp()
  {
    $hours = 3;
    $value = $this->t->getExpiryTimeStamp($hours);
    $date = date('Y-m-d H:i:s', strtotime("+$hours hours"));
    $this->assertEquals($date, $value);
  }

  public function test_generate_token()
  {
    $length = 16;
    $value = $this->t->generateToken($length);
    $this->assertEquals($length * 2, strlen($value));
  }

  public function test_token_is_valid ()
  {
    $this->t->data['active'] = 1;
    $this->t->data['expires'] = '2020-11-14 19:00:00';
    $value = $this->t->isValid();
    $this->assertFalse($value);

    $this->t->data['active'] = 1;
    $this->t->data['expires'] = date('Y-m-d H:i:s', strtotime("+1 hours"));;
    $value = $this->t->isValid();
    $this->assertTrue($value);

    $this->t->data['active'] = 0;
    $this->t->data['expires'] = '2020-11-22 19:00:00';
    $value = $this->t->isValid();
    $this->assertFalse($value);
  }

  public function test_token_has_expired ()
  {
    $this->t->data['expires'] = '2020-11-14 19:00:00';
    $value = $this->t->hasExpired();
    $this->assertTrue($value);

    $this->t->data['expires'] = date('Y-m-d H:i:s', strtotime("+1 hours"));
    $value = $this->t->hasExpired(true);
    $this->assertFalse($value);
  }

}
