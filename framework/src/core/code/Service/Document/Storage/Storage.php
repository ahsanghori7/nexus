<?php

namespace Core\Service\Document\Storage;

use Core\Config;
use Core\Service\Manager;
use Core\Service\ServiceAbstract;

class Storage
{

    public const STORAGE = '';

    /**
     * @return string
     * @throws \Exception
     */
    public static function getDefaultStorage(): string
    {
        return Config::get("document.storage.default");
    }

    /**
     * @return ServiceAbstract
     * @throws \Exception
     */
    public function getStorage(): ServiceAbstract
    {
        if(!$storage = $this::STORAGE){
            $storage = self::getDefaultStorage();
        }
        return Manager::getService($storage);
    }
}
