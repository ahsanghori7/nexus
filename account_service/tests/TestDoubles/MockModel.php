<?php
declare(strict_types=1);

namespace Tests\TestDoubles;

use App\Domain\AbstractModel;

class MockModel extends AbstractModel
{
    public const NAME = 'mock_model';

    protected $columns = [
        'id' => [
            'type' => 'int',
            'pk' => true,
        ],
        'name' => [
            'type' => 'string',
            'required' => true,
            'validate' => 'maxlength:10',
        ],
        'email' => [
            'type' => 'string',
            'required' => true,
        ],
        'status',
        'type',
    ];
}
