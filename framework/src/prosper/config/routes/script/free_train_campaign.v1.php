<?php

use Core\Middleware\Conditional;
use Core\Config;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Manager;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Hubspot;

$unsubscribe_email_id = 1;
$phpSpreadsheet = [
    'csv'  => 'PhpOffice\PhpSpreadsheet\Reader\Csv',
    'xlsx' => 'PhpOffice\PhpSpreadsheet\Reader\Xlsx',
];
$free_train_campaign = Config::get("scripts.free_train_campaign", []);
return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "onError" => [
        "queueError" => function(MiddlewareException $ex) {
            error_log($ex->getMessage());
        }
    ],
    "actions" => [
        [
            "key" => "send",
            "middleware" => [
                Conditional::isTrue($free_train_campaign['enabled'], [
                    AccountMiddleware::loadTokenTypes("auto_loader"),
                    function($a) use ($argv, $phpSpreadsheet) {
                        $save_path = Config::get("scripts.save.path");
                        if(!is_dir($save_path)) {
                            mkdir($save_path, Config::get("scripts.save.permission"), true);
                        }
                        try{
                            $path = Config::get("environment") . '/scripts/';
                            $file = $argv[3] ?? null;
                            $emailId = $argv[4] ?? null;
                            $ext = pathinfo($file, PATHINFO_EXTENSION);

                            if($file && isset($phpSpreadsheet[$ext]) && $emailId) {
                                Manager::getService('s3')->save(
                                    'document',
                                    $path . $file,
                                    $save_path . "/" . $file
                                );
                                $reader = new $phpSpreadsheet[$ext]();
                                $reader->setReadDataOnly(true);
                                $spreadsheet = $reader->load($save_path . "/" . $file);
                                $sheet = $spreadsheet->getSheet(0);

                                $account_data = [];
                                $aids = [];
                                foreach ($sheet->toArray() as $key => $data) {
                                    $aid    = (int)trim($data[0]);
                                    $aids[] = $aid;
                                    $account_data[$aid]['trade']     = trim($data[8]);
                                    $account_data[$aid]['firstname'] = trim($data[9]);
                                }
                                $a->setItems([
                                    'aids'       => $aids,
                                    'excel_data' => $account_data,
                                    'emailId'    => $emailId
                                ]);
                            }
                            else{
                                throw new \Exception("No file or emailId provided");
                            }

                        }catch (\Exception $e){
                            throw new \Exception($e->getMessage());
                        }
                    },
                    AccountMiddleware::loadAccountsByIdArray("aids"),
                    function($a) use ($unsubscribe_email_id){
                        foreach($a->getCollection("accounts") as $account) {
                            $aid = $account->get("id");
                            $excel_data = $a->get("excel_data")[$aid] ?? [];
                            //Use the first user from the account, perhaps better to filter this by user type?
                            $user = $account->getCollection("users")->first();
                            $user->setItems([
                                'firstname' => $excel_data['firstname'],
                                'trade'     => $excel_data['trade']
                            ]);
                            $account->set("user", $user);
                            //Create an opt in token and unsubscribe link for the email
                            AccountMiddleware::createusertoken(
                                "user.id", "token_type", Config::getUrl("site_url", "account/auto_loader")
                            )($account->set("token_type", $a->get("token_type")));
                            $account->set("unsubscribe_url",
                                Config::getUrl("site_url", "account/email/". base64_encode(strval($account->get("user.email"))) ."/unsubscribe/$unsubscribe_email_id")
                            );
                            //Send the Email via hubspot
                            Hubspot::email(
                                intval($a->get("emailId")),
                                "user.email", [],
                                [
                                    "user.firstname"  => "first_name",
                                    "user.trade"      => "trade",
                                    "token_url",
                                    "unsubscribe_url"
                                ], "prosper_hubspot",
                            )($account);
                        }
                    }
                ])
            ]
        ]
    ]
];
