<?php

namespace App\Api\Aws;

use App\Api\Client;
use Aws\Sns\SnsClient;

class Sns extends Client
{
    /**
     * @return SnsClient
     */
    public static function getClient(): SnsClient {
        return new SnsClient(self::getConfig("setup"));
    }

    /**
     * @param string $topic
     * @param string $message
     * @return \Aws\Result
     * @throws \Exception
     */
    public static function send(string $topic, string $message) : \Aws\Result {
        $client = self::getClient();
        return $client->publish([
            'Message' => $message,
            'TopicArn' => self::getTopicUrl($topic),
        ]);
    }

    /**
     * @param string $topic
     * @return string
     * @throws \Exception
     */
    public static function getTopicUrl(string $topic) : string {
        $topics = self::getConfig("topics");
        $url    = false;
        if(isset($topics[$topic])) {
            $url =  $topics[$topic]["url"] ?? false;
        }

        if(!$url) {
            throw new \Exception("Invalid topic or no defined topic url for $topic");
        }
        return $url;
    }
}
