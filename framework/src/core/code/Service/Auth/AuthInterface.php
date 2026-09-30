<?php

namespace Core\Service\Auth;

use Core\Layer\OutgoingInterface;

interface AuthInterface
{
    public function apply(OutgoingInterface $request) : void;
}
