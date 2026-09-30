<?php

namespace App\Api\Aws;

use App\Api\Client;
use Aws\Sqs\SqsClient;

class Sqs extends Client
{

    public const WAIT_TIME_SECONDS = 0;
    public const MESSAGE_GROUP_ID = 'enquiry_data';

    /**
     * @var int
     */
    public static $max_number_messages = 1;

    /**
     * @return SqsClient
     */
    public static function getClient(): SqsClient
    {
        return new SqsClient(self::getConfig("setup"));
    }

    /**
     * @param string $queue
     * @return string
     */
    public static function getQueueUrl(string $queue): string
    {
        $queues = self::getConfig("queues");
        if(isset($queues[$queue])) {
            return $queues[$queue]["url"];
        }
        throw new \Exception("Unknown or invalid queue $queue");
    }

    /**
     * @param string $queue
     * @return array
     */
    public static function read(string $queue): array
    {
        $result = self::getClient()->receiveMessage([
            'QueueUrl' => self::getQueueUrl($queue),
            'WaitTimeSeconds' => self::WAIT_TIME_SECONDS,
            'MaxNumberOfMessages' => self::getQueueParallel(),
        ]);

         if (!empty($result->get('Messages'))) {
             $messages = $result->get('Messages');
         }

        return $messages ?? [];
    }

    /**
     * @param array $message
     * @return array|mixed|object
     */
    public static function getContent(array $message)
    {
        return json_decode($message['Body'], true);
    }

    /**
     * @return int
     */
    public static function getQueueParallel(): int
    {
        return self::$max_number_messages;
    }

    /**
     * @return array
     */
    public static function process(): array
    {
        return self::read('process');
    }

    /**
     * @param int $nr
     * @return array
     */
    public static function processParallel(int $nr): array
    {
        return self::queueParallel('process', $nr);
    }

    /**
     * @param string $queue
     * @param int $nr
     * @return array
     */
    public static function queueParallel(string $queue, int $nr): array
    {
        self::$max_number_messages = $nr;
        return self::read($queue);
    }

    /**
     * @param string $queue
     * @param string $message
     */
    public static function send(string $message, string $queue): void
    {
        self::getClient()->sendMessage([
            'MessageBody' => $message,
            'MessageGroupId' => self::MESSAGE_GROUP_ID,
            'QueueUrl' => self::getQueueUrl($queue)
        ]);
    }

    /**
     * @param string $queue
     * @param array $message
     */
    public static function remove(array $message, string $queue = 'default'): void
    {
        self::getClient()->deleteMessage([
            'QueueUrl' => self::getQueueUrl($queue),
            'ReceiptHandle' => $message['ReceiptHandle'] ?? ''
        ]);
    }
}
