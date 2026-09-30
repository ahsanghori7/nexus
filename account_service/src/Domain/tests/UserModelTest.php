<?php

use App\Domain\User\User;

class UserModelMock extends User
{
  public $data = [];

  /** @phpstan-ignore-next-line */
  public function getDB () { }

  public function save (array $data, $insertOnly = false)
  {
      $this->data = $data;
    return $this;
  }
}

class UserModelTest extends \PHPUnit\Framework\TestCase
{

  protected $u;

  public function setUp (): void
  {
    $this->u = new UserModelMock();
  }

  public function testSetDisplayName()
  {
    $firstname = 'Dan';
    $lastname = 'Alexandru';
    $separator = 'potato';
    $value = $this->u->setDisplayName($firstname,$lastname,$separator);
    $this->assertEquals('DanpotatoAlexandru', $value);

    $firstname = 'Dan';
    $lastname = 'Alexandru';
    $separator = ' ';
    $value = $this->u->setDisplayName($firstname,$lastname,$separator);
    $this->assertEquals('Dan Alexandru', $value);

    $firstname = '';
    $lastname = 'Alexandru';
    $separator = 'potato';
    $value = $this->u->setDisplayName($firstname,$lastname,$separator);
    $this->assertEquals('Alexandru', $value);

    $firstname = 'Dan';
    $lastname = '';
    $separator = 'potato';
    $value = $this->u->setDisplayName($firstname,$lastname,$separator);
    $this->assertEquals('Dan', $value);

    $firstname = '';
    $lastname = '';
    $separator = 'potato';
    $value = $this->u->setDisplayName($firstname,$lastname,$separator);
    $this->assertEquals('', $value);
  }

  public function testEncryptPassword ()
  {
    $password = 123;
    $value = $this->u->encryptPassword($password);
    $this->assertTrue((strpos($value, '$argon') === 0));
  }

  /**
   * if the user is not migrated the encryption used is md5
   * if the user is migrated the encryption used is the native password_verify from php
   */
  public function testValidatePassword ()
  {
    $u = new UserModelMock();

    $password = '123';
    $hash = $u->encryptPassword($password);

    $u->setData(['password' => $hash, 'migrated' => 0]);
    $value = $u->validatePassword($password);
    $this->assertEquals(true, $value);

    $u->data['password'] = md5($password);
    $u->data['migrated'] = 0;
    $value = $u->validatePassword($password);
    $this->assertEquals(true, $value);

  }

    public function testPasswordOldVerify ()
    {
        $u = new UserModelMock();

        $password = '123';
        $hash = md5($password);
        $value = $u->password_old_verify($password, $hash);
        $this->assertEquals(true, $value);

        $hash = md5("1234");
        $value = $u->password_old_verify($password, $hash);
        $this->assertEquals(false, $value);

        $password = '123';
        $hash = $password;
        $value = $u->password_old_verify($password, $hash);
        $this->assertEquals(false, $value);
    }

  public function testHasPasswordMigrated ()
  {
    $u = new UserModelMock();
    $u->data['password'] = 'd41eef7c46160380f60e2f55eec280b2';
    $value = $u->hasPasswordMigrated();
    $this->assertEquals(false, $value);

    $u = new UserModelMock();
    $u->data['password'] = '$P$B./LzDr.slgJKzLtUkTY886pr7fuqr0';
    $value = $u->hasPasswordMigrated();
    $this->assertEquals(false, $value);

    $u->data['password'] = '$argon2id$v=19$m=65536,t=4,p=1$LmhsTVFadGdKMHJLYTBwbA$J39yWKCt4Rbrf3vxDF/aPSRHfQpoCZYa8kU7A8thv70';
    $value = $u->hasPasswordMigrated();
    $this->assertEquals(true, $value);

  }
}
