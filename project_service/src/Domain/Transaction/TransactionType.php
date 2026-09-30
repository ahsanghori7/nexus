<?php


namespace App\Domain\Transaction;


use App\Domain\AbstractTypeModel;

class TransactionType extends AbstractTypeModel
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
    protected $table = 'transaction_type';

    /**
     * @var array
     */
    protected $columns = [
        'label',
    ];
}
