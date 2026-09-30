<?php
    declare(strict_types=1);

    namespace App\Domain\Trade;

    use App\Domain\AbstractModel;

    /**
     * Class Trade
     * @package App\Domain\Trade
     */
    class Trade extends AbstractModel
    {

        use \App\Domain\Traits\LabelTrait;

        /**
         * @var array
         */
        protected $columns = [
            'id' => [
                'type' => 'int'
            ],
            'label' => [
                'type' => 'string',
                'required' => true
            ]
        ];
    }
