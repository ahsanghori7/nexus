<?php

use App\Models\User;
use PHPUnit\Framework\TestCase;

class MockUser extends User {

    public function __construct($id, $aid, $token) {
        $this->id = $id;
        $this->accountId = $aid;
        $this->token = $token;
    }

    /**
     * @throws \App\Api\Exception
     */
    public function loadFromApi() {}

}


class TestUser extends TestCase
{

    public function testCanChangeTeamMember ()
    {
        $user = new MockUser(1,2,3);

        $user->setData(['type' => 'administrator']);
        $this->assertTrue($user->canChangeTeamMember("team_admin"));
        $this->assertTrue($user->canChangeTeamMember("team_manager"));
        $this->assertTrue($user->canChangeTeamMember("team_assistant"));


        $user->setData(['type' => 'account_holder']);
        $this->assertTrue($user->canChangeTeamMember("team_admin"));
        $this->assertTrue($user->canChangeTeamMember("team_manager"));
        $this->assertTrue($user->canChangeTeamMember("team_assistant"));


        $user->setData(['type' => 'team_admin']);
        $this->assertTrue($user->canChangeTeamMember("team_admin"));
        $this->assertTrue($user->canChangeTeamMember("team_manager"));
        $this->assertTrue($user->canChangeTeamMember("team_assistant"));


        $user->setData(['type' => 'team_manager']);
        $this->assertNotTrue($user->canChangeTeamMember("team_admin"));
        $this->assertTrue($user->canChangeTeamMember("team_manager"));
        $this->assertTrue($user->canChangeTeamMember("team_assistant"));


        $user->setData(['type' => 'team_assistant']);
        $this->assertNotTrue($user->canChangeTeamMember("team_admin"));
        $this->assertNotTrue($user->canChangeTeamMember("team_manager"));
        $this->assertNotTrue($user->canChangeTeamMember("team_assistant"));

    }

    public function testGetInitials ()
    {

        $user = new MockUser(1,2,3);

        $firstname = 'Dan';
        $lastname = 'Alexandru';
        $user->setData([
            'firstname' => $firstname,
            'lastname' => $lastname,
        ]);
        $this->assertEquals("DA", $user->getNameInitials());


        $firstname = 'dan';
        $lastname = 'barbatosu';
        $user->setData([
            'firstname' => $firstname,
            'lastname' => $lastname,
        ]);
        $this->assertEquals("DB", $user->getNameInitials());


        $firstname = 'dan';
        $lastname = 'Barbatosu';
        $user->setData([
            'firstname' => $firstname,
            'lastname' => $lastname,
        ]);
        $this->assertEquals("DB", $user->getNameInitials());


        $firstname = 'Dan';
        $lastname = 'barbatosu';
        $user->setData([
            'firstname' => $firstname,
            'lastname' => $lastname,
        ]);
        $this->assertEquals("DB", $user->getNameInitials());


        $firstname = '1';
        $lastname = '2';
        $user->setData([
            'firstname' => $firstname,
            'lastname' => $lastname,
        ]);
        $this->assertEquals("12", $user->getNameInitials());


        $firstname = ' s';
        $lastname = 't';
        $user->setData([
            'firstname' => $firstname,
            'lastname' => $lastname,
        ]);
        $this->assertEquals("ST", $user->getNameInitials());


        $firstname = 'super ';
        $lastname = '  man ';
        $user->setData([
            'firstname' => $firstname,
            'lastname' => $lastname,
        ]);
        $this->assertEquals("SM", $user->getNameInitials());


        $firstname = '';
        $lastname = '';
        $user->setData([
            'firstname' => $firstname,
            'lastname' => $lastname,
        ]);
        $this->assertEquals("", $user->getNameInitials());


        $firstname = '';
        $lastname = 'A';
        $user->setData([
            'firstname' => $firstname,
            'lastname' => $lastname,
        ]);
        $this->assertEquals("A", $user->getNameInitials());


        $firstname = 'K';
        $lastname = '';
        $user->setData([
            'firstname' => $firstname,
            'lastname' => $lastname,
        ]);
        $this->assertEquals("K", $user->getNameInitials());
    }
}
