<?php

namespace Prosper\Middleware\Relay;

use Core\Data\Shape;
use Core\Service\Exception\RestException;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;

class TokenHistoryMiddleware
{

  const TOKEN_HISTORY_FREE_TYPE   = 'free';
  const TOKEN_HISTORY_PAID_TYPE   = 'paid';

  /**
   * Type: FREE
   *    If there is no free token used record AND there is a record of a free issued token
   *    OR
   *    The total number of free token used is less than the total number of free token issued
   *
   * Type: PAID
   *    If there is no free token issued
   *    OR
   *    If the total number of free token issued is equal to the total number of free token used
   *
   * @return \Closure
   */
  public static function getTokenHistoryType()
  {
    return function ($action) {
      $free_tokens_issued = $action->get("token_free_issued");
      $free_tokens_used   = $action->get("token_free_used");
      if ((!$free_tokens_used && $free_tokens_issued) || ($free_tokens_issued > $free_tokens_used)) {
        return self::TOKEN_HISTORY_FREE_TYPE;
      }
      return self::TOKEN_HISTORY_PAID_TYPE;
    };
  }

  /**
   * @return callable
   */
  public static function getTokenHistory(): callable
  {
    return function ($action) {
      $user = $action->getShape("session")->getShape("user");
      $res = Manager::getService("account")->fetch("token_history", [
        'account_id' => $user->get("account_id"),
        'user_id'    => $user->get("id")
      ]);

      $action->setItems([
        'token_free_issued' => array_sum($res->getCollection('data.issued')->filterByStringField("cost", 0)->values("token_amount")),
        'token_free_used'   => $res->getCollection('data.used')->filterByStringField("token_type", self::TOKEN_HISTORY_FREE_TYPE)->count(),
      ]);
    };
  }


    /**
     * @param bool $allAccounts
     * @return callable
     */
  public static function getTokenUsedHistoryCount(bool $allAccounts = false): callable
  {
    return function ($action) use ($allAccounts) {

      if(!$allAccounts){
        $user = $action->getShape("session")->getShape("user");
        $params = [
            'account_id' => $user->get("account_id")
        ];
      }
      try{
        $res = Manager::getService("account")->fetch("token_history/used", $params ?? []);
        if($allAccounts){
          $data = $res->getCollection('data');
        }
        else{
          $data = new Shape([
            'paid' => $res->getCollection('data')->filterByStringField("token_type", self::TOKEN_HISTORY_PAID_TYPE)->count(),
            'free' => $res->getCollection('data')->filterByStringField("token_type", self::TOKEN_HISTORY_FREE_TYPE)->count(),
          ]);
        }
      }catch (\Exception $e){
        $data = [];
      }

      $action->set("token_used", $data);

    };
  }

  /**
   * @return callable
   */
  public static function useToken(): callable
  {
    return function ($action) {
      try {
        $aid = intval($action->get("aid"));
        $uid = intval($action->get("uid"));
        $pid = intval($action->get("pid"));
        $res = Manager::getService("account")->write("token_history/used", new Shape(['data' => [
          'account_id'    => $aid,
          'user_id'       => $uid,
          'project_id'    => $pid,
          'token_type'    => self::getTokenHistoryType()($action),
        ]]));
        $action->set("new_project_unlocked", $res->getShape("info")->get("http_code") === 200);
      } catch (RestException $e) {
        throw new MiddlewareException(
          "relayError",
          $e->getMessage()
        );
      }
    };
  }

  /**
   * @param string $accountKey
   * @param string $projectKey
   * @param string $setKey
   * @return callable
   */
  public static function isUnlockedProject(string $accountKey, string $projectKey, string $setKey): callable
  {
    return function ($action) use ($accountKey, $projectKey, $setKey) {
      $id = intval($action->get($accountKey));
      $pid = intval($action->get($projectKey));
      if ($id && $pid) {
        try {
          $res = Manager::getService("account")->fetch("token_history/used", [
            "account_id" => $id,
            "project_id" => $pid,
          ])->getShape("data");
          $valid = (bool)$res->hasData();
        } catch (\Exception $e) {
          $valid = false;
        }
        $action->set($setKey, $valid);
      }
    };
  }

  /**
   * @return callable
   */
  public static function issueToken(): callable
  {
    return function ($action) {
      try {
        $action->set("token_issued", Manager::getService("account")->write("token_history/issued", new Shape(['data' => [
          'token' => $action->get("payment_data.metadata")->payment_token,
          'cost' => $action->get("payment_data.price"),
          'token_amount' => $action->get("payment_data.meta.tokens"),
        ]])));
      } catch (RestException $e) {
        throw new MiddlewareException(
          "relayError",
          $e->getMessage()
        );
      }
    };
  }
}
