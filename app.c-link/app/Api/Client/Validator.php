<?php


namespace App\Api\Client;

use App\Api\Client;
use App\core\Request;
use App\Models\User;

class Validator {

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @throws Response\JsonException
     */
    public static function hasPostData(Request $request, User $user, array &$args): void
    {
        if(!$request->getData()) {
            Client::throwJsonException("Request missing post data", 500);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @throws Response\JsonException
     */
    public static function hasJsonData(Request $request, User $user, array &$args): void
    {
        if(!$request->getJson()) {
            Client::throwJsonException("Request missing json data", 500);
        }
    }
}
