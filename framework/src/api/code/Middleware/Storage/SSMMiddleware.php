<?php

namespace Api\Middleware\Storage;

use Core\System\Environment as E;

class SSMMiddleware extends StorageMiddleware
{

    public const SERVICE = 'ssm';

    /**
     * @var array|true[]
     */
    public static array $config = [
        "withDecryption" => true,
        "fullKeyPath"    => true
    ];

    /**
     * @param string $key
     * @return string
     */
    public static function getMainPath(string $key = ''): string
    {
        $path = sprintf("/%s/provider/%s", E::get("ENVIRONMENT"), self::getProvider());
        if($key){
            $path .= "/$key";
        }
        return $path;
    }

    /**
     * @return string
     */
    public static function getPath(): string
    {
        return self::getMainPath() . "/" . self::getConfigKey("key");
    }

    /**
     * @return mixed
     * @throws \Exception
     */
    public static function getCredentials(): mixed
    {
        $cert = self::getService()->getParameters(self::getMainPath(), self::getConfigKey("withDecryption"), self::getConfigKey("fullKeyPath"));
        $cert = $cert['test.cer'] ?? null;
        $tmp = tempnam(sys_get_temp_dir(), 'test.cer');
        file_put_contents($tmp, $cert);
        return self::getService()->getParameters(self::getPath(), self::getConfigKey("withDecryption"), self::getConfigKey("fullKeyPath")) + ['certificate' => $tmp];
    }

    /**
     * @param string $key
     * @param string $saveAs
     * @return mixed
     * @throws \Exception
     */
    public static function getData(string $key = '', string $saveAs = ""): mixed
    {
        if($key === "certificate"){
            $key    = 'test.cer';
            $saveAs = $key;
        }
        $data = self::getService()->getParameters(self::getMainPath(), self::getConfigKey("withDecryption"), self::getConfigKey("fullKeyPath"));

        if( $saveAs && $data ) {
            $tmp = tempnam(sys_get_temp_dir(), 'test.cer');
            file_put_contents($tmp, $data[$key]);
            return $tmp;
        }

        if(!$key){
            return $data;
        }
        return $data[$key] ?? null;
    }
}
