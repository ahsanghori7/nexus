<?php

namespace Core\Service;

use Aws\Sns\SnsClient;
use Core\Data\Shape;

class SnsService extends RestService
{
  /**
   * @var SnsClient
   */
  protected SnsClient $sns_client;

  /**
   * @return SnsClient
   */
  public function getClient(): SnsClient
  {
    if(!isset($this->sns_client)){
      $this->sns_client = new SnsClient([
        'version' => $this->get("version"),
        'region'  => $this->get("region"),
        'credentials' => [
          'key'    => $this->get("access_key"),
          'secret' => $this->get("secret_key"),
        ]
      ]);
    }
    return $this->sns_client;
  }

  /**
   * @param string $topic
   * @return string
   * @throws \Exception
   */
  public function getTopicUrl(string $topic) : string {
    $topics = $this->get("topics");
    $url    = false;
    if(isset($topics[$topic])) {
      $url =  $topics[$topic]["url"] ?? false;
    }

    if(!$url) {
      throw new \Exception("Invalid topic or no defined topic url for $topic");
    }
    return $url;
  }

  /**
   * @param string $path
   * @param Shape $shape
   * @return Shape
   */
  public function write(string $path, Shape $shape): Shape
  {
    try{
      $res = $this->getClient()->publish([
        'Message'  => json_encode($shape->get("data")),
        'TopicArn' => $this->getTopicUrl($path)
      ]);
    }catch (\Exception $e){
      return new Shape([
        "write_response" => $e->getMessage(),
        'write_error'    => true
      ]);
    }

    return new Shape([
      "write_response" => $res,
      'write_error'    => false
    ]);
  }

  /**
   * @param string $type
   * @param string $message
   * @param Shape $shape
   * @return Shape
   */
  public function sendException(string $type, string $message, Shape $shape)
  {
    $shape->set("data", [
      'message' => $message,
      'data'    => $shape->get(),
    ]);
    return $this->write($type, $shape);
  }



}
