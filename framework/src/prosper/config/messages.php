<?php
use Core\Config;

return [
    "site_messages" => [
        "register_interest" => [
            'prequalification_not_approved' => [
                'message' => 'Please complete your prequalification before registering interest.',
                'button'  => [
                    'label' => 'Complete your prequalification',
                    'url'   => Config::getUrl("site_url", "my-company/prequalification")
                ]
            ],
            'no_tokens_left' => [
                'message' => 'You don\'t have any tokens left.',
                'button'  => null
            ],
            'no_trade_no_region' => [
                'message' => 'Your profile doesn\'t include this trade or location, if applicable please add to your profile and then register interest.',
                'button'  => null
            ],
            'trial' => [
                'message' => 'To register interest click the link below',
                'button'  => [
                    'label' => 'Upgrade your account',
                    'url'   => Config::get("upgrade_account_url")
                ]
            ],
        ]
    ]
];
