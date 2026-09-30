<?php

    namespace App\Domain\User;

    use App\Domain\AbstractTypedModel;

    /**
     * Class Token
     * @package App\Domain\User
     */
    class UserActionNotifications extends AbstractTypedModel
    {

        /*
        * @var AbstractTypeModel
        */
        protected $typeModel = UserActionTypes::class;

        /**
         * @var array
         */
        protected $columns = [
            'id',
            'action_id',
            'requester_id',
            'receiver_id',
            'status',
            'created_at',
            'updated_at'
        ];
    }
