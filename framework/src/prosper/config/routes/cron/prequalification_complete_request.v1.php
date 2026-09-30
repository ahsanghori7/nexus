<?php

use Core\Data\Shape;
use Core\Service\Manager;
use Prosper\Middleware\EmailMiddleware as ProsperEmailMiddleware;

CONST ACTIVATED_SUPPLY_CHAIN_MEMBERSHIP_ID = 16;
CONST CONTRACTOR_TYPE_ID = 2;

return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "onError" => [

    ],
    "actions" => [
        [
            "key" => "reminder",
            "middleware" => [
                function (){
                    $invited_by = [];
                    $accountsCollection = Manager::getService('account')->fetch("account/list?limit=999999")->getCollection('data');
                    $supplyChainCollection = Manager::getService('account')->fetch("account/supply_chain")->getCollection('data');
                    $supplyChainCollection->map(function($supply_chain) use (&$invited_by){
                        $invited_by[$supply_chain->get("child_id")] = $supply_chain->get("parent_id");
                    });
                    $contractors = [];
                    $accountsCollection->map(function($contractor) use (&$contractors){
                        if($contractor->int("type") === CONTRACTOR_TYPE_ID) {
                            $users      = $contractor->get("users");
                            $first_user = array_shift($users);
                            $aid        = $first_user['account_id'];
                            $contractor->set("account_id", $aid);
                            $contractors[$aid] = $contractor->get();
                        }
                        return $contractor;
                    });
                    $accountsCollection->map(function($account) use ($invited_by, $contractors){
                        $users      = $account->get("users");
                        $first_user = array_shift($users);
                        $aid        = $first_user['account_id'];
                        if($account->int("subscription_id") !== ACTIVATED_SUPPLY_CHAIN_MEMBERSHIP_ID){
                            return $account;
                        }
                        if(isset($invited_by[$aid]) && !$account->get("first_pqq_sent")){
                            $contractor_id = $invited_by[$aid];
                            $contractor = new Shape($contractors[$contractor_id] ?? []);
                            //contractor is exempted from pegasus
                            if($contractor->get("first_pqq_sent")){
                                return $account;
                            }
                            $targetDate = new DateTime($account->get("created_at"));
                            $today      = new DateTime();
                            $diff       = $today->diff($targetDate);
                            if($diff->days === 1){
                                ProsperEmailMiddleware::send("First PQQ Request", [
                                    "sender" => new Shape($first_user),
                                    'recipient' => new Shape(['id' => $first_user['id']]),
                                    'extra' => new Shape([
                                        'company' => $contractor->get("name"),
                                    ]),
                                ])($account);
                                Manager::getService('account')->update("account/$aid", new Shape([
                                    'data' => [
                                        'first_pqq_sent' => true
                                    ]
                                ]));
                            }
                        }
                        return $account;
                    });
                }
            ]
        ]
    ]
];
