<?php

namespace Core\Service\Auth;

use Core\Layer\OutgoingInterface;

use Core\Data\Shape;

class Token extends Shape implements AuthInterface
{
    /**
     * @param OutgoingInterface $request
     * @return void
     */
    public function apply(OutgoingInterface $request) : void {
        $authEnabled   = (bool) $this->get("enabled", false);
        $token         = $this->get("token");
        $tokenParamKey = $this->get("token_key", "api_token");

        if($authEnabled) {
            if(!is_string($token) || !is_string($tokenParamKey)) {
                throw new \Exception("Misconfiguration token authentication");
            }
            $request->setArgs(new Shape([$tokenParamKey => $token]));
        }
    }


}
