<?php
declare(strict_types=1);

namespace CostPlanningTool\Model;

use CostPlanningTool\Model\Abstraction as AbstractModel;


class Submitted extends AbstractModel
{

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'submitted';

    /**
     * @var string
     */
    protected $connection = "cost_planning_tool";

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'data',
        'email',
        'source'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'data' => [
            'type' => 'string',
            'required' => true
        ],
        'email' => [
            'type' => 'string',
            'required' => true
        ],
        'source' => [
            'type' => 'string'
        ],
        'created_at' => [
            'type' => 'date',
        ],
    ];
}
