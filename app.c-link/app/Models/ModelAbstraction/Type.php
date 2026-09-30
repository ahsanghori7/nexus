<?php

namespace App\Models\ModelAbstraction;

use App\Models\Abstraction;

class Type extends Abstraction
{
    /**
     * @param string $uid
     * @return bool
     */
    public function isUid(string $uid) : bool {
        return (strcasecmp($this->getData("uid"), $uid) === 0);
    }

    /**
     * @param array $uids
     * @return bool
     */
    public function uidIn(array $uids) : bool {
        return in_array($this->getData("uid"), $uids);
    }

}
