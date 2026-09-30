<?php

namespace Analytics\Model;

use Analytics\Model\Abstraction as AbstractModel;

class TenderHistoryStatus extends AbstractModel
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
    protected $table = 'tender_history_status';

    /**
     * @var array
     */
    protected $columns = [
        'label',
    ];

    /**
     * @var string
     */
    protected $connection = "project_service";
}
