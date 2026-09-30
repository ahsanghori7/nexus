<?php


namespace App\Domain\Project;


use App\Domain\AbstractTypeModel;

class InstructionType extends AbstractTypeModel
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
    protected $table = 'instruction_type';

    /**
     * @var array
     */
    protected $columns = [
        'uid',
        'label',
    ];
}
