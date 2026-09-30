<?php

namespace Core\Service\Auth;

use Core\Data\Shape;
use Core\Layer\OutgoingInterface;

class Basic extends Shape implements AuthInterface
{
    /**
     * @param OutgoingInterface $request
     * @return void
     */
    public function apply(OutgoingInterface $request) : void {
        $authEnabled   = (bool) $this->get("enabled", false);
        $prefix          = $this->get("prefix", "");
        $suffix          = $this->get("suffix", "");

        if($authEnabled) {
            $request->setOptions(
                [CURLOPT_USERPWD => trim(strval($prefix) . ":" . strval($suffix))]
            );
        }
    }
}
