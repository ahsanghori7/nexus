<?php

namespace Core\Service\Document\File;

use Core\Config;

abstract class FileAbstract
{
    /**
     * @var String
     */
    public const CLIENT = "";

    /**
     * @return mixed
     * @throws \Exception
     */
    public static function getDefaultClient(): mixed
    {
        return Config::get("document.file.default");
    }

    /**
     * @return mixed
     * @throws \Exception
     */
    public static function getClientName(): mixed
    {
        if(!$client = self::CLIENT){
            $client = self::getDefaultClient();
        }
        return $client;
    }

    /**
     * @return mixed
     */
    abstract public function getName(): mixed;

    /**
     * @return mixed
     */
    abstract public function getPath(): mixed;

    /**
     * @return mixed
     */
    abstract public function getSize(): mixed;

    /**
     * @return mixed
     */
    abstract public function getType(): mixed;

    /**
     * @return mixed
     */
    abstract public function isValid(): mixed;
}
