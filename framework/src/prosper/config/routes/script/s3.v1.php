<?php

use Core\Service\Manager;
use Core\Config;

return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "actions" => [
        [
            "key" => "upload",
            "middleware" => [
                function() use ($argv) {
                    $file = $argv[3] ?? null;
                    if(file_exists($file)){
                        $file_name = pathinfo($file, PATHINFO_BASENAME);
                        $file_content = file_get_contents($file);
                        $res = Manager::getService('s3')->uploadContent(
                            'document',
                            Config::get("environment") . '/scripts/' . $file_name,
                            $file_content,
                        );
                        if($res->get("ObjectURL")){
                            echo "File" . $file_name . " uploaded successfully. \n";
                            die;
                        }
                    }
                },
            ]
        ],
    ]
];
