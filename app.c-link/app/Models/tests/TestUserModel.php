<?php

use PHPUnit\Framework\TestCase;
use \App\Models\UserModel;

class MockUserModel extends UserModel {

    /**
     * @param string $data
     */
   public function mockData(string $data): void
   {
       $this->data['account']['address'] = $data;
   }
}


class TestUserModel extends TestCase
{

    public function testGetAddress (): void
    {
        $user = new MockUserModel();

        $separator = ['separator' => "\n"];
        $user->mockData('Iron Bridge House,3 Bridge Approach,London,NW1 8BD');
        $this->assertEquals("Iron Bridge House\n3 Bridge Approach\nLondon\nNW1 8BD", $user->getAddress($separator));

        $user->mockData('Iron Bridge House,3 Bridge Approach,London');
        $this->assertEquals("Iron Bridge House\n3 Bridge Approach\nLondon", $user->getAddress($separator));

        $user->mockData('Iron Bridge House,3 Bridge Approach');
        $this->assertEquals("Iron Bridge House\n3 Bridge Approach", $user->getAddress($separator));

        $user->mockData('Iron Bridge House');
        $this->assertEquals("Iron Bridge House", $user->getAddress($separator));

        $user->mockData('');
        $this->assertEquals("", $user->getAddress($separator));

        $user->mockData(',,,,,');
        $this->assertEquals("\n\n\n\n\n", $user->getAddress($separator));


        $separator = ['separator' => "  "];
        $user->mockData('Iron Bridge House,3 Bridge');
        $this->assertEquals("Iron Bridge House  3 Bridge", $user->getAddress($separator));


        $separator = ['separator' => ""];
        $user->mockData('Iron Bridge House,3 Bridge');
        $this->assertEquals("Iron Bridge House3 Bridge", $user->getAddress($separator));
    }
}
