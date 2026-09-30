<?php

namespace App\Api\Hubspot;

use App\Api\Client;
use App\Api\Client\Request as ClientRequest;

class V2 extends Client
{
    const API_CONFIG_KEY = "hubspot_v2";

    /**
     * @param string $uri
     * @param string $type
     * @return ClientRequest
     * @throws \Exception
     */
    public static function getRequest(string $uri, $type="GET")
    {
        $conf = self::getConfig();

        $bearer = $conf["token"];
        if ( !$bearer ) {
            throw new \Exception("Missing Bearer Token");
        }

        $request = new ClientRequest($conf['url'] . $uri, $type);
        $request->setHeaders(['Authorization' => 'Bearer ' . $bearer]);
        return $request;
    }

    /**
     * @param string $resource
     * @param array $filters
     * @return array
     */
    public static function search(string $resource, array $filters) : array {
        $res = self::post("/crm/v3/objects/$resource/search",
           $filters
        );

        return $res->json();
    }

    /**
     * @param string $to
     * @param string $from
     * @param int $emailId
     * @param array $properties
     * @param array $cc
     * @return mixed
     */
    public static function sendEmail(string $to, int $emailId, array $properties = [], array $cc = []) {

        $package = [
            "message" => ["to" => $to],
            "emailId" => $emailId
        ];
        if($cc){
            $package["message"]["cc"] = $cc;
        }
        if($properties && isset($properties["contact"])) {
            $package["contactProperties"] = $properties["contact"];
        }
        if($properties && isset($properties["custom"])) {
            $package["customProperties"] = $properties["custom"];
        }

        $res = self::post("/marketing/v3/transactional/single-email/send", $package);
        return $res->json();
    }

}
