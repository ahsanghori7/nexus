<?php

declare(strict_types=1);

namespace Aws;

use ArrayObject;

class Result extends ArrayObject
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, ArrayObject::ARRAY_AS_PROPS);
    }
}
