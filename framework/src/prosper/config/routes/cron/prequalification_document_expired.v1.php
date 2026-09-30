<?php

use Core\Config;
use Core\Middleware\Service\AccountMiddleware;
use Core\Service\Manager;
use Prequalification\Middleware\PrequalificationMiddleware;
use Core\Data\Shape;
use Prosper\Middleware\EmailMiddleware as ProsperEmailMiddleware;

$sections = [
    'insurances',
    'accreditation',
    'management-system',
    'custom-certificate',
    'health-safety',
    'health-safety-environmental-qualifications',
    'environmental',
    'quality',
    'example-documents'
];

return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "onError" => [],
    "actions" => [
        [
            "key" => "expired",
            "middleware" => [
                AccountMiddleware::loadTokenTypes("auto_loader"),
                PrequalificationMiddleware::loadDocumentTypes(),
                function ($action) use ($sections) {
                    $document_type = $action->get("document_type")->filterByField("uid", 'account-documents')->getFirst();
                    $subtypes  = $action->get("document_subtype")->filterByExistInArray("uid", $sections);
                    $documents = Manager::getService('document')->fetch("document", ["type" => $document_type->get("id"), "subtype" => implode(",", $subtypes->values("id"))])->getCollection('data');
                    $sections = [];
                    $documents->map(function ($document) use ($action, &$sections) {
                        $meta = json_decode($document->get("meta", ''), true);
                        $subtype = $action->get("document_subtype")->filterByField("id", $document->get("subtype"))->getFirst();
                        if (isset($meta['date']) && ($meta['date'] === date("d-m-Y") || $meta['date'] === date("Y-m-d"))) {
                            $owner = $document->get("owner", []);
                            $owner = array_shift($owner);
                            $account_id = $owner['owner_id'] ?? null;
                            if ($account_id) {
                                $sections[$account_id]['sections'][]     = $subtype->get("label");
                                $sections[$account_id]['certificates'][] = $document->get("name");
                            }
                        }
                    });
                    foreach ($sections as $key => $section) {
                        $account = Manager::getService("account")->fetch("account/$key")->get("data");
                        $user = $account->getCollection("users")->first();
                        $action->set("data", new Shape([
                            "subcontractor" => $account,
                            "user"          => $user,
                            "document"      => [
                                'sections'     => implode(", ", array_unique($section['sections'])),
                                'certificates' => '<li>' . implode('</li><li>', $section['certificates']) . '</li>',
                            ]
                        ]));
                        //auto loader token
                        AccountMiddleware::loadTokenTypes("auto_loader")($action);
                        //Create an autologin token
                        AccountMiddleware::createUserToken(
                            "data.user.id",
                            "token_type",
                            Config::getUrl("site_url", "account/auto_loader")
                        )($action->set("token_type", $action->get("token_type")));
                        //Send the Email
                        ProsperEmailMiddleware::send("Document Expired", [
                            'sender' => $action->get("data.user"),
                            'token'  => new Shape(['url' => $action->get("token_url")]),
                            'extra'  => new Shape([
                                'sections'  => $action->get("data.document.sections"),
                                'documents' => $action->get("data.document.certificates")
                            ]),
                        ])($action);
                    }
                },
            ]
        ],
    ]
];
