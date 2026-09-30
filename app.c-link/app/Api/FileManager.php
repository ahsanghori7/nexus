<?php

namespace App\Api;

use App\Api\Client\Response\JsonResponse;
use App\core\Request;
use App\Models\User;

class FileManager extends Project
{

  /**
   * Allow Config to be overridden
   */
  const API_CONFIG_KEY = "project";

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
  protected static array $historyCache = [];

  /**
   * @var array
   */
  protected static $security = [
    "methods" => [
      "downloadCategory" => [
        "type" => 'GET',
        "requires_session" => true,
        "pre_checks" => [
          "validateProjectOwner"
        ],
        "required_args" => [
          "tid" => "int",
          "pid" => "int",
          "cid" => "int",
        ]
      ],
      "downloadTenderCategories" => [
        "type" => 'GET',
        "requires_session" => true,
        "pre_checks" => [
          "validateProjectOwner"
        ],
        "required_args" => [
          "tid" => "int",
          "pid" => "int",
        ]
      ]
    ]
  ];

  /**
   * @param string $k
   * @return false|string
   */
  public static function getForwardingAddress (string $k)
  {
    if ( isset(self::$forward_address[$k]) ) {
      return baseUrl() . self::$forward_address[$k];
    }
    return false;
  }

  /**
   * @return array|\array[][]
   */
  public static function getSecurity ()
  {
    return self::$security;
  }

  /**
   * @param string $step
   * @param string $url
   */
  public static function setForwardingAddress ($step, $url)
  {
    self::$forward_address[$step] = $url;
  }

  /**
   * @param Request $request
   * @param User $user
   * @param array $args
   * @return JsonResponse
   */
  public static function downloadCategory(Request $request, User $user, array $args) : jsonResponse
  {
    list("pid" => $pid, "tid" => $tid, "cid" => $cid) = $args;
    return self::jsonResponse(["url" => sprintf('%s/category/%s/%s/%s', config('document.download.url'), $pid, $tid, $cid)]);
  }

  /**
   * @param Request $request
   * @param User $user
   * @param array $args
   * @return JsonResponse
   */
  public static function downloadTenderCategories(Request $request, User $user, array $args) : jsonResponse
  {
    list("pid" => $pid, "tid" => $tid) = $args;
    return self::jsonResponse(["url" => sprintf('%s/categories/%s/%s', config('document.download.url'), $pid, $tid)]);
  }

}
