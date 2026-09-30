<?php

namespace Email\Utility;

use Core\Config;
use Defuse\Crypto\Key;
use Defuse\Crypto\Crypto;

class Encrypt
{

    /**
     * @return Key
     * @throws \Defuse\Crypto\Exception\BadFormatException
     * @throws \Defuse\Crypto\Exception\EnvironmentIsBrokenException
     */
    public static function loadEncryptionKeyFromConfig(): Key
    {
        $key = Config::get("crypto_defuse_key");
        if(!is_string($key)){
            throw new \Exception("Encrypt key not found");
        }
        return Key::loadFromAsciiSafeString($key);
    }

    /**
     * @param string $data
     * @return string
     * @throws \Defuse\Crypto\Exception\BadFormatException
     * @throws \Defuse\Crypto\Exception\EnvironmentIsBrokenException
     */
    public static function encrypt(string $data): string
    {
        return Crypto::encrypt($data, self::loadEncryptionKeyFromConfig());
    }

    /**
     * @param string $ciphertext
     * @return string
     * @throws \Defuse\Crypto\Exception\BadFormatException
     * @throws \Defuse\Crypto\Exception\EnvironmentIsBrokenException
     */
    public static function decrypt(string $ciphertext): string
    {
        try {
            return Crypto::decrypt($ciphertext, self::loadEncryptionKeyFromConfig());
        } catch (\Defuse\Crypto\Exception\WrongKeyOrModifiedCiphertextException $ex) {
            // An attack! Either the wrong key was loaded, or the ciphertext has
            // changed since it was created -- either corrupted in the database or
            // intentionally modified by Eve trying to carry out an attack.

            // ... handle this case in a way that's suitable to your application ...
            throw new Exception($ex->getMessage());
        }
    }

}
