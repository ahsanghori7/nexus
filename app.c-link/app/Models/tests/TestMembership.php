<?php

use App\Models\Membership;
use PHPUnit\Framework\TestCase;


class TestMembership extends TestCase
{
  public function testExpiryDate ()
  {

    $membership = new Membership([
        'subscription' => ['expires_at' => date("Y-m-d H:i:s", strtotime('-1 hour'))]
    ]);
    $this->assertEquals(0, $membership->getRemainingDays());
    $this->assertTrue($membership->hasExpired());


    $membership = new Membership([
      'subscription' => ['expires_at' => date("Y-m-d H:i:s", strtotime('-1 year'))]
    ]);
    $this->assertEquals(0, $membership->getRemainingDays());
    $this->assertTrue($membership->hasExpired());


    $membership = new Membership([
      'subscription' => ['expires_at' => date("Y-m-d H:i:s", strtotime('-1 day'))]
    ]);
    $this->assertEquals(0, $membership->getRemainingDays());
    $this->assertTrue($membership->hasExpired());


    $membership = new Membership([
      'subscription' => ['expires_at' => date("Y-m-d H:i:s", strtotime('-2 day'))]
    ]);
    $this->assertEquals(0, $membership->getRemainingDays());
    $this->assertTrue($membership->hasExpired());


    $membership = new Membership([
      'subscription' => ['expires_at' => date("Y-m-d H:i:s", strtotime('+1 year'))]
    ]);
    $this->assertFalse($membership->hasExpired());


    $membership = new Membership([
      'subscription' => ['expires_at' => date("Y-m-d H:i:s")]
    ]);
    $this->assertEquals(0, $membership->getRemainingDays());
    $this->assertTrue($membership->hasExpired());


    $membership = new Membership([
      'subscription' => ['expires_at' => date("Y-m-d H:i:s", strtotime('+1 hour'))]
    ]);
    $this->assertEquals(1, $membership->getRemainingDays());
    $this->assertFalse($membership->hasExpired());


    $membership = new Membership([
      'subscription' => ['expires_at' => date("Y-m-d H:i:s", strtotime('+1 day'))]
    ]);
    $this->assertEquals(1, $membership->getRemainingDays());
    $this->assertFalse($membership->hasExpired());


    $membership = new Membership([
      'subscription' => ['expires_at' => date("Y-m-d H:i:s", strtotime('+2 day'))]
    ]);
    $this->assertEquals(2, $membership->getRemainingDays());
    $this->assertFalse($membership->hasExpired());


    //13 days and 23 hours
    $hours = (13 * 24) + 23;
    $membership = new Membership([
      'subscription' => ['expires_at' => date("Y-m-d H:i:s", strtotime('+'.$hours.' hours'))]
    ]);
    $this->assertEquals(14, $membership->getRemainingDays());
    $this->assertFalse($membership->hasExpired());


  }
}
