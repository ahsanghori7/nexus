<?php


namespace App\Domain\Project;


use App\Domain\AbstractTypeModel;

class InstructionStatus extends AbstractTypeModel
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
    protected $table = 'instruction_status';

    /**
     * @var array
     */
    protected $columns = [
        'uid',
        'label',
    ];
}
