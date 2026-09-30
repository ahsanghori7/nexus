<?php

namespace Email\Utility;

use Email\Service\Client\Gmail;
use Email\Service\Client\Hubspot;
use Email\Service\Client\Outlook;

class Email
{

    /**
     * @var array
     */
    protected static array $emailDomains = [
        'google',
        'outlook'
    ];

    /**
     * @var string[]
     */
    protected static array $clients = [
        'default' => Hubspot::class,
        'hubspot' => Hubspot::class,
        'gmail'   => Gmail::class,
        'outlook' => Outlook::class,
    ];

    /**
     * @return array
     */
    public static function getAvailableClients(): array
    {
        return self::$emailDomains;
    }

    /**
     * @param string $client
     * @return mixed
     */
    public static function getClient(string $client): mixed
    {
        return self::$clients[$client];
    }

    /**
     * @param string $email
     * @param array $available_domains
     * @return mixed
     */
    public static function getClientFromEmailDomain(string $email, array $available_domains = []): mixed
    {
        $clients = [];
        if ((filter_var($email, FILTER_VALIDATE_EMAIL)) !== false) {
            $domain = explode("@", $email);
            $clients = array_map(static function($record){
                if($record['type'] === 'MX'){
                    return $record['target'];
                }
                return false;
            }, dns_get_record(end($domain)));
        }

        $found_client = null;

        $domains = $available_domains ?? self::getAvailableClients();
        foreach($domains as $item) {
            foreach ($clients as $value) {
                if ( str_contains($value, $item) ) {
                    $found_client = self::getClient($item);
                    break;
                }
            }
        }
        return $found_client;
    }
}
