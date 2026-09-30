<?php


use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;
use Email\Factory;
use Email\Template\AbstractLoader;
use Core\Data\Collection as CollectionClass;

/**
 * @codeCoverageIgnore
 */
class FactoryTest extends TestCase
{

    public function testGetTemplateLoaderNoTemplate()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Method exception: No template loader provided');
        Factory::getTemplateLoader("");
    }


    public function testGetTemplateLoaderRequiredArgument()
    {
       $this->expectException(\Exception::class);
       $this->expectExceptionMessage('Config error: loader is required to be an instance of abstractLoader');
       Factory::getTemplateLoader("test");
    }

    public function testGetDefaultTemplateLoader()
    {
        $factory = Factory::getTemplateLoader();
        $this->assertInstanceOf(AbstractLoader::class, $factory);
    }

}
