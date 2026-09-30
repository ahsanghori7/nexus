<?php


use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;
use Email\Factory;
use Core\Data\Collection as CollectionClass;

use Email\Utility\Email;
/**
 * @codeCoverageIgnore
 */
class UtilityEmail extends TestCase
{

    public function testGetClientFromEmailDomain()
    {
        $domain = Email::getClientFromEmailDomain("dqs.danyel@yahoo.com");
        $this->assertEquals(null, $domain);


        $domain = Email::getClientFromEmailDomain("dqs.danyel@outlook.com", ['outlook']);
        $this->assertEquals('Email\Service\Client\Outlook', $domain);
    }

}
