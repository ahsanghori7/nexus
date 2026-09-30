<?php

namespace Models;

use App\Models\Signatory;
use PHPUnit\Framework\TestCase;

class SignatoryEmailSenderTest extends TestCase
{

    /**
     * @return array
     */
    protected function users(): array
    {
        return [
            ['id' => 166, 'display_name' => 'C-Link Apo', 'job_title' => ''],
            ['id' => 21672, 'display_name' => 'dan Dan', 'job_title' => 'Quantity Surveyor'],
        ];
    }

    public function testItFindsTheUserThatTriggeredTheAction(): void
    {
        $user = Signatory::findAccountUser($this->users(), 21672);

        $this->assertSame('dan Dan', $user['display_name']);
        $this->assertSame('Quantity Surveyor', $user['job_title']);
    }

    public function testItFindsTheFirstAccountUserWhenTheyTriggeredTheAction(): void
    {
        $this->assertSame('C-Link Apo', Signatory::findAccountUser($this->users(), 166)['display_name']);
    }

    public function testItReturnsNothingWhenNoUserIsGiven(): void
    {
        $this->assertSame([], Signatory::findAccountUser($this->users(), 0));
    }

    public function testItReturnsNothingWhenTheUserIsNoLongerOnTheAccount(): void
    {
        $this->assertSame([], Signatory::findAccountUser($this->users(), 99999));
        $this->assertSame([], Signatory::findAccountUser([], 21672));
    }
}
