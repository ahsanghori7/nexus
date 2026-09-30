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
    'xlsx' => 'PhpOffice\PhpSpreadsheet\Writer\Xlsx',
];
$token_campaign = Config::get("scripts.token_campaign", []);
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
                Conditional::isTrue($token_campaign['enabled'], [
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
                                $aids = [];
                                foreach ($sheet->toArray() as $data) {
                                    $aids[] = trim($data[0]); //id
                                }
                                $a->setItems([
                                    'aids'    => $aids,
                                    'emailId' => $emailId
                                ]);
                            }
                            else{
                                throw new \Exception("No file or emailId provided");
                            }

                        }catch (\Exception $e){
                           echo $e->getMessage();
                           die;
                        }
                    },
                    AccountMiddleware::loadAccountsByIdArray("aids"),
                    function($a) use ($unsubscribe_email_id){
                        foreach($a->getCollection("accounts") as $account) {
                            //Use the first user from the account, perhaps better to filter this by user type?
                            $account->set("user", $account->getCollection("users")->first());
                            //Create an opt in token and unsubscribe link for the email
                            AccountMiddleware::createUserToken(
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
                                    "user.display_name"  => "first_name",
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
