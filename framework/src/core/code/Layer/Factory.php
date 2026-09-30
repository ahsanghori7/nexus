<?php

namespace Core\Layer;

use Core\Layer\IncomingInterface;
use Core\Layer\OutgoingInterface;
use Core\Layer\IOInterface;

class Factory
{
    /**
     * @param string $type
     * @return IncomingInterface
     */
    public static function getIncoming(string $type) : IncomingInterface {
        $interface = self::getIo($type, "incoming");
        if(is_a($interface, IncomingInterface::class)) {
            return $interface;
        }
        throw new \Exception("Invalid Incoming Layer, must implement Core\Layer\IncomingInterface");
    }

    /**
     * @param string $type
     * @param string $direction
     * @return IoAbstract
     */
    public static function getIo(string $type, string $direction) : IoAbstract {
        $cls = sprintf("%s\\%s\\%s", __NAMESPACE__, ucwords($type), ucwords($direction));
        if(class_exists($cls)) {
            $o = new $cls();
            if(is_a($o, IoAbstract::class)) {
                return $o;
            }
            throw new \Exception("Invalid IO class doesnt not extend IoAbstract");
        }
        throw new \Exception("Layer Class not found $cls");
    }
}
