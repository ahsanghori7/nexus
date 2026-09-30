<?php

namespace Core\Service;

use Aws\Sqs\SqsClient;
use Core\Data\Shape;
use Core\Layer\OutgoingInterface;


class SqsService extends ServiceAbstract
{

    /**
     * @var SqsClient
     */
    protected SqsClient $sqs_client;

    /**
     * @return SqsClient
     */
    public function getClient (): SqsClient
    {
        if ( !isset($this->sqs_client) ) {
            $this->sqs_client = new SqsClient([
                'version' => $this->get("version"),
                'region' => $this->get("region"),
                'credentials' => [
                    'key' => $this->get("access_key"),
                    'secret' => $this->get("secret_key"),
                ]
            ]);
        }
        return $this->sqs_client;
    }

    /**
     * @param array $message
     */
    public function remove(array $message): void
    {
        $this->getClient()->deleteMessage([
            'QueueUrl' => $this->get("url"),
            'ReceiptHandle' => $message['ReceiptHandle'] ?? ''
        ]);
    }

    /**
     * @param array $message
     * @return mixed
     */
    public function getContent(array $message): mixed
    {
        return json_decode($message['Body'], true);
    }

    /**
     * @return int
     */
    public function getQueueParallel(): int
    {
        return intval($this->get("parallel"));
    }

    public function getNewRequest(string $path): OutgoingInterface
    {
        // TODO: Implement getNewRequest() method.
        // The client should really be moved to its own outgoing interface
    }

    /**
     * @param string $suffix
     * @param string $type
     * @return string
     */
    public function getPath(string $suffix = "", string $type = "fifo"): string
    {
        return $this->get("url", "") . "/" . $suffix . ".$type";
    }

    /**
     * @param string $path
     * @param array $params
     * @return Shape
     * @throws \Exception
     */
    public function fetch(string $path, array $params = []): Shape
    {
        $result = $this->getClient()->receiveMessage([
            'QueueUrl'            => $this->getPath($path),
            'WaitTimeSeconds'     => $this->get("wait_time_in_seconds", 0),
            'MaxNumberOfMessages' => $this->getQueueParallel(),
        ]);

        return new Shape(["messages" => $result->get("Messages") ?? []]);
    }

    /**
     * @param string $path
     * @param Shape $shape
     * @return Shape
     */
    public function write(string $path, Shape $shape): Shape
    {
        $res = $this->getClient()->sendMessage([
            'MessageBody'    => $shape->get("body"),
            'MessageGroupId' => $shape->get("group_id", ""),
            'QueueUrl'       => $this->getPath($path)
        ]);

        return new Shape(["write_response" => $res]);
    }

    /**
     * @param string $path
     * @param Shape $shape
     * @return Shape
     * @throws \Exception
     */
    public function update(string $path, Shape $shape): Shape
    {
        throw new \Exception("SqS Service does not support update");
    }

    /**
     * @param string $path
     * @param array $params
     * @return Shape
     * @throws \Exception
     */
    public function delete(string $path, array $params = []): Shape
    {
        $res = $this->getClient()->deleteMessage([
            'QueueUrl'      => $this->getPath($path),
            'ReceiptHandle' => $params['ReceiptHandle'] ?? ''
        ]);
        return new Shape(["delete_response" => $res]);
    }
}
