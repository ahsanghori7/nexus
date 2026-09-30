<?php

    namespace App\Domain\Website;

    use App\Domain\AbstractModel;

    /** Maintain a website model so we can link subscription to our web platforms */
    class Website extends AbstractModel
    {
        /**
         * @var array
         */
        protected $columns = [
            'label' => [
                'type' => 'int',
                'required' => true
            ],
            'url' => [
                'type' => 'string',
                'required' => true
            ]
        ];
    }
