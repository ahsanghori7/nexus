<?php

namespace Email;

use Core\Config;
use Core\Middleware\TemplateLoader;
use Email\Template\AbstractTemplateLoader;
use Email\Service\Client;

class Factory
{

    /**
     * @param string $email
     * @param string $password
     * @param string|null $client
     * @return Client|mixed|string
     * @throws \Exception
     */
    public static function getClient(string $email, string $password, string $client = null)
    {
        if(!is_string($client)){
            $client = Config::get("email.client.loader.default");
        }
        if($client){
            if(is_a($client, Client::class, true))
            {
                return is_string($client) ? (new $client($email, $password)) : $client;
            }
            throw new \Exception("Config error: client is required to be an instance of Client");
        }
        throw new \Exception("Method exception: No client loader provided");
    }

    /**
     * @param string|null $loader
     * @return AbstractTemplateLoader|mixed|string
     * @throws \Exception
     */
    public static function getTemplateLoader(string $loader = null)
    {
        if(!is_string($loader)){
            $loader = Config::get("email.template.loader.default");
        }
        if($loader){
            if(is_a($loader, AbstractTemplateLoader::class, true))
            {
                return is_string($loader) ? (new $loader) : $loader;
            }
            throw new \Exception("Config error: loader is required to be an instance of abstractLoader");
        }
        throw new \Exception("Method exception: No template loader provided");
    }

    public static function getEmail(Client $client = null, TemplateLoader $templateLoader = null )
    {

    }

}
