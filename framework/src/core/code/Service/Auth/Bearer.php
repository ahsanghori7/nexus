<?php

namespace Core\Service\Auth;

use Core\Data\Shape;
use Core\Layer\OutgoingInterface;

class Bearer extends Shape implements AuthInterface
{
    /**
     * @param OutgoingInterface $request
     * @return void
     */
    public function apply(OutgoingInterface $request) : void {
        $authEnabled   = (bool) $this->get("enabled", false);
        $bearer         = $this->get("token");

        if($authEnabled) {
            if(!is_string($bearer)) {
                throw new \Exception("Misconfiguration bearer authentication");
            }
            $request->setHeaders(['Authorization' => 'Bearer ' . $bearer]);
        }
    }


}
