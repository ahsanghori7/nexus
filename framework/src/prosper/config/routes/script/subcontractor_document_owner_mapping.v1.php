<?php

use Core\Data\Shape;
use Core\Service\Manager;
use App\Api\Document as DocumentApi;

return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "actions" => [
        [
            "key" => "owner_mapping",
            "middleware" => [
                function() use ($argv) {
                    $history = Manager::getService('project')->fetch("tender/history")->getCollection('data');
                    $transactions = Manager::getService('project')->fetch("transaction")->getCollection('data');
                    $documents = Manager::getService('document')->fetch("document", [
                        'type'      => 2, //contractual
                        's3_bucket' => 'asset'
                    ])->getCollection('data');
                    $history_documents = [];
                    $history->map(function($item) use (&$history_documents){
                        $meta = $item->get("meta", "");
                        $meta = json_decode($meta, true);
                        if(isset($meta['document']) && is_array($meta['document'])){
                            foreach($meta['document'] as $sid => $document) {
                                if(isset($document['id'])) {
                                    $history_documents[$document['id']] = $sid;
                                }
                            }
                        }
                    });
                    $transactions->map(function($item) use (&$history_documents){
                        $meta = $item->get("meta", "");
                        $meta = json_decode($meta, true);

                        if(isset($meta['document']) && is_array($meta['document'])){
                            if(isset($meta['document']['id'])){
                                $history_documents[$meta['document']['id']] = $item->get("subcontractor_id");
                            }
                        }
                    });
                    foreach($documents as $document) {
                        $owners = [];
                        foreach($document->get("owner", []) as $owner) {
                            $owners[] = $owner['owner_id'];
                        }
                        $did = $document->get("id");
                        if(isset($history_documents[$did])){
                            $sid = $history_documents[$did];
                            if(!in_array($sid, $owners)) {
                                Manager::getService('document')->update(sprintf("document/%s/owner", $did), new Shape([
                                    "data" => ['owner_id' => $history_documents[$did]]
                                ]));
                            }
                        }
                    }
                },
            ]
        ],
    ]
];
