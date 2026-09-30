<?php


namespace App\Api\Email;

use App\Api\Client;
use App\core\Config;

/**
 * Class Email
 * @package App\Api
 */
class Email extends Client
{

    /**
     * @var array
     */
    protected static $forward_address = [];

    /**
     * @var array
     */
    protected static array $typeCache = [];

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "send" => [
                "type" => "POST",
                "requires_session" => true
            ]
        ]
    ];

    /**
     * @param string $k
     * @return false|string
     */
    public static function getForwardingAddress(string $k)
    {
        if (isset(self::$forward_address[$k])) {
            return baseUrl() . self::$forward_address[$k];
        }
        return false;
    }

    /**
     * @return array|\array[][]
     */
    public static function getSecurity()
    {
        return self::$security;
    }

    /**
     * @param string $step
     * @param string $url
     */
    public static function setForwardingAddress($step, $url)
    {
        self::$forward_address[$step] = $url;
    }

    /**
     * @param array $data
     * @param string $app
     */
    public static function send(array $data, string $app = 'prosper'): void
    {
        if(!isset($data['from'])) {
            $data['from'] = Config::get("api.email.default.$app.address");
        }
        self::post("email/send", $data);
    }

    /**
     * @param int $sender_id
     * @param array $bulk_data
     * @TODO Implement bulkaction into email servive route
     */
    public static function sendBulk(int $sender_id, array $bulk_data = []): void
    {
        foreach($bulk_data as $data){
            self::send([
                'sender'   => ['id' => $sender_id],
                'to'       => $data['email'],
                'template' => $data['template'],
                'extra'    => $data,
                'bcc'      => $data['bcc'] ?? []
            ], $data['app']);
        }
    }

}
