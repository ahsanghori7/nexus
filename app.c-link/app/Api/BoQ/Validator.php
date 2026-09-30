<?php

namespace App\Api\BoQ;

use App\core\Request;
use App\Models\User;

class Validator {

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @throws \Exception
     */
    public static function isEntityOwner(Request $request, User $user, array &$args): void
    {
        $entity = $request->getQueryValue("eid");
        if(!$entity) {
            throw new \Exception("Missing required args eid");
        }
        try {
            $args["eid"] = $entity;
            BoQ::validateOwner($request, $user, $args);
        }
        catch(\Exception $e) {
            throw new \Exception($e->getMessage());
        }
    }

}
