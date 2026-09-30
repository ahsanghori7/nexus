<?php

use App\Api\Prequalification;
use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Generic;
use Core\Middleware\Form;
use Prequalification\Middleware\PDFMiddleware;
use Prequalification\Middleware\PrequalificationMiddleware;
use Prequalification\Middleware\S3Middleware;
use Prequalification\Form\Validation;
use Core\Middleware\Conditional;
use Core\Middleware\Service\AccountMiddleware;
use Core\Service\Manager;
use Prosper\Model\TeamManager;

use Prequalification\Model\PrequalificationModel;
use Prequalification\Middleware\EmailMiddleware as PrequalEmailMiddleware;
use Prosper\Middleware\EmailMiddleware as Email;
use SupplyChain\Middleware\EloquentMiddleware;
use Core\Middleware\Procedure;

include_once(__DIR__ . "/../../api/config/routes/document/procedures.php");

$unsubscribe_email_id = 1;

return [
    "index" => [
        "type" => "http",
        "middleware" => [],
        "default_action" => [
            "middleware" => [Generic::healthCheck()]
        ],
    ],
    "prequalification" => [
        "type" => "http",
        "middleware" => [],
        "onError" => [
            "bad_request" => Generic::badRequest(),
            "invalid_subcontractor" => Generic::noRoute(),
            "authError" => Generic::notAuthorised(),
            "documentOwnershipError"    => Generic::exceptionResponse("HTTP/1.0 403"),
            "noDocumentFound"           => Generic::exceptionResponse("HTTP/1.0 404")
        ],
        "actions" => [
            [
                "key" => "(?<aid>[0-9]{1,7})\/?(?<token>[a-z0-9]+)?$",
                "method" => "GET",
                "middleware" => [
                    function($a){
                        $a->set("requestor_id", $a->getRoute()->getRequest()->getArgs()->get("requestor_id"));
                    },
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::loadSections(),
                    PrequalificationMiddleware::loadCompanyInformation(),
                    PrequalificationMiddleware::loadOrganisation(),
                    PrequalificationMiddleware::addOrganisationAccountOwner("uriArgs.aid"),
                    PrequalificationMiddleware::loadCompanyFinancials(),
                    PrequalificationMiddleware::loadReferences(),
                    PrequalificationMiddleware::loadDocumentTypes(),
                    PrequalificationMiddleware::loadDocumentsSections(),
                    PrequalificationMiddleware::loadCertificates(),
                    PrequalificationMiddleware::loadSectionStatuses(),
                    Generic::set("json",  function ($action) {
                        return json_encode(["data" => $action->get("prequalification")]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/download\/(?<did>[0-9]{1,7})",
                "method" => "GET",
                "middleware" => [
                    PrequalificationMiddleware::loadDocument(),
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::loadSections(),
                    PrequalificationMiddleware::loadDocumentTypes(),
                    PrequalificationMiddleware::loadDocumentsSections(),
                    PrequalificationMiddleware::loadCertificates(),
                    PrequalificationMiddleware::createTempDirectory(),
                    PrequalificationMiddleware::downloadDocument(),
                    PrequalificationMiddleware::outputCertificate(),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/reference\/(?<name>)",
                "method" => "GET",
                "middleware" => [
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::loadReferences(),
                    PrequalificationMiddleware::loadReferenceDocument(),
                    PrequalificationMiddleware::createTempDirectory(),
                    PrequalificationMiddleware::downloadDocument(),
                    PrequalificationMiddleware::outputCertificate(),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/company_profile$",
                "method" => "PATCH",
                "middleware" => [
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::checkUniqueCompanyName(),
                    PrequalificationMiddleware::updateCompanyInformation(),
                    PrequalificationMiddleware::loadSections(),
                    PrequalificationMiddleware::loadCompanyInformation(),
                    PrequalificationMiddleware::loadOrganisation(),
                    PrequalificationMiddleware::addOrganisationAccountOwner("uriArgs.aid"),
                    PrequalificationMiddleware::loadCompanyFinancials(),
                    PrequalificationMiddleware::loadReferences(),
                    PrequalificationMiddleware::loadDocumentTypes(),
                    PrequalificationMiddleware::loadDocumentsSections(),
                    PrequalificationMiddleware::loadCertificates(),
                    PrequalificationMiddleware::loadSectionStatuses(),
                    PrequalificationMiddleware::checkPqqStatus(),
                    Conditional::switched("pqq_status", [
                        function ($action) {
                            $action->set("receiver_id", $action->get("session")->get('user')['id']);
                        },
                        PrequalificationMiddleware::getNotificationsByReceiverId(),
                        PrequalificationMiddleware::checkPqqNotificationStatus(),
                        Conditional::switched("is_notify", [
                            PrequalEmailMiddleware::notifyPqqCompleted(),
                            PrequalEmailMiddleware::notifyMainContractorPqqCompleted(),
                            function ($action) {
                                $userNotifications = $action->get("receiver_notifications");
                                foreach ($userNotifications as $notification) {
                                    Manager::getService('account')->update("user/notifications/{$notification->get('id')}", new Shape([
                                        'data' => [
                                            "status" => 1
                                        ]
                                    ]));
                                }
                            },
                        ]),
                    ]),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/organisation",
                "method" => "PATCH",
                "middleware" => [
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::updateOrganisation(),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/turnover",
                "method" => "PATCH",
                "middleware" => [
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::updateTurnover(),
                    PrequalificationMiddleware::loadSections(),
                    PrequalificationMiddleware::loadCompanyInformation(),
                    PrequalificationMiddleware::loadOrganisation(),
                    PrequalificationMiddleware::addOrganisationAccountOwner("uriArgs.aid"),
                    PrequalificationMiddleware::loadCompanyFinancials(),
                    PrequalificationMiddleware::loadReferences(),
                    PrequalificationMiddleware::loadDocumentTypes(),
                    PrequalificationMiddleware::loadDocumentsSections(),
                    PrequalificationMiddleware::loadCertificates(),
                    PrequalificationMiddleware::loadSectionStatuses(),
                    PrequalificationMiddleware::checkPqqStatus(),
                    Conditional::switched("pqq_status", [
                        function ($action) {
                            $action->set("receiver_id", $action->get("session")->get('user')['id']);
                        },
                        PrequalificationMiddleware::getNotificationsByReceiverId(),
                        PrequalificationMiddleware::checkPqqNotificationStatus(),
                        Conditional::switched("is_notify", [
                            PrequalEmailMiddleware::notifyPqqCompleted(),
                            PrequalEmailMiddleware::notifyMainContractorPqqCompleted(),
                            function ($action) {
                                $userNotifications = $action->get("receiver_notifications");
                                foreach ($userNotifications as $notification) {
                                    Manager::getService('account')->update("user/notifications/{$notification->get('id')}", new Shape([
                                        'data' => [
                                            "status" => 1
                                        ]
                                    ]));
                                }
                            },
                        ]),
                    ]),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/references",
                "id"  => "create_reference",
                "method" => "POST",
                "middleware" => [
                    AccountMiddleware::loadTokenTypes("prosper_reference"),
                    PrequalificationMiddleware::loadCollection(),
                    Form::validate(Validation::getSignature("work_reference"), "work_reference_post_data"),
                    PrequalificationMiddleware::updateReferences(),
                    function ($a) {
                        $account = $a->getShape("session")->getShape("account");
                        $user    = $a->getShape("session")->getShape("user");
                        $a->setItems([
                            "account_data" => $account->get(),
                            "user_id"      => $user->get("id"),
                            "user_data"    => $user->get()
                        ]);
                        AccountMiddleware::createUserToken(
                            "user_id",
                            "token_type",
                            Config::getUrl("site_url", "relay/v1/account/reference/token"),
                            ['reference_id' => $a->get("reference_id")]
                        )($a);
                        $a->set("completion_date", date('d F Y', strtotime($a->get("work_reference_post_data.completion_date"))));
                        Email::send("Reference",[
                            "to"     => $a->get("work_reference_post_data.contact_email"),
                            "sender" => $user,
                            'token'  => new Shape(['url' => $a->get("token_url")]),
                            'extra'  => new Shape([
                                'subcontractor'   => $a->get("account_data.name"),
                                'firstname'       => $a->get("user_data.firstname"),
                                'contact_name'    => $a->get("work_reference_post_data.contact_name"),
                                'project_name'    => $a->get("work_reference_post_data.project_name"),
                                'client_name'     => $a->get("work_reference_post_data.client_name"),
                                'contract_value'  => $a->get("work_reference_post_data.contract_value"),
                                'sow'             => $a->get("work_reference_post_data.sow"),
                                'completion_date' => $a->get("completion_date")
                            ])
                        ])($a);
                    },
                    PrequalificationMiddleware::loadSections(),
                    PrequalificationMiddleware::loadCompanyInformation(),
                    PrequalificationMiddleware::loadOrganisation(),
                    PrequalificationMiddleware::addOrganisationAccountOwner("uriArgs.aid"),
                    PrequalificationMiddleware::loadCompanyFinancials(),
                    PrequalificationMiddleware::loadReferences(),
                    PrequalificationMiddleware::loadDocumentTypes(),
                    PrequalificationMiddleware::loadDocumentsSections(),
                    PrequalificationMiddleware::loadCertificates(),
                    PrequalificationMiddleware::loadSectionStatuses(),
                    PrequalificationMiddleware::checkPqqStatus(),
                    Conditional::switched("pqq_status", [
                        function ($action) {
                            $action->set("receiver_id", $action->get("session")->get('user')['id']);
                        },
                        PrequalificationMiddleware::getNotificationsByReceiverId(),
                        PrequalificationMiddleware::checkPqqNotificationStatus(),
                        Conditional::switched("is_notify", [
                            PrequalEmailMiddleware::notifyPqqCompleted(),
                            PrequalEmailMiddleware::notifyMainContractorPqqCompleted(),
                            function ($action) {
                                $userNotifications = $action->get("receiver_notifications");
                                foreach ($userNotifications as $notification) {
                                    Manager::getService('account')->update("user/notifications/{$notification->get('id')}", new Shape([
                                        'data' => [
                                            "status" => 1
                                        ]
                                    ]));
                                }
                            },
                        ]),
                    ]),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => true]);
                    })
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/reference\/(?<id>[0-9]{1,7}\/resend)",
                "method" => "POST",
                "middleware" => [
                    AccountMiddleware::loadTokenTypes("prosper_reference"),
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::loadReferences(),
                    function ($a) {
                        $id = (int)$a->get("uriArgs.id");
                        $a->set("access", false);
                        (new \Core\Data\Collection($a->get("prequalification.references"), Shape::class))->map(function ($item) use ($id, $a) {
                            if ($item->get("id") === $id) {
                                $a->setItems([
                                    'access'    => true,
                                    'reference' => $item
                                ]);
                            }
                            return $item;
                        });
                    },
                    Conditional::switched('access', [
                        function ($a) {
                            $account = $a->getShape("session")->getShape("account");
                            $user    = $a->getShape("session")->getShape("user");
                            $a->setItems([
                                "account_data" => $account->get(),
                                "user_id"      => $user->get("id"),
                                "user_data"    => $user->get()
                            ]);
                            AccountMiddleware::createUserToken(
                                "user_id",
                                "token_type",
                                Config::getUrl("site_url", "relay/v1/account/reference/token"),
                                ['reference_id' => (int)$a->get("reference.id")]
                            )($a);
                            $a->set("completion_date", date('d F Y', strtotime($a->get("reference.completion_date"))));
                            Email::send("Reference",[
                                "to"     => $a->get("reference.contact_email"),
                                "sender" => $user,
                                'token'  => new Shape(['url' => $a->get("token_url")]),
                                'extra'  => new Shape([
                                    'subcontractor'   => $a->get("account_data.name"),
                                    'firstname'       => $a->get("user_data.firstname"),
                                    'contact_name'    => $a->get("reference.contact_name"),
                                    'project_name'    => $a->get("reference.project_name"),
                                    'client_name'     => $a->get("reference.client_name"),
                                    'contract_value'  => $a->get("reference.contract_value"),
                                    'sow'             => $a->get("reference.sow"),
                                    'completion_date' => $a->get("completion_date")
                                ])
                            ])($a);
                        }
                    ]),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/reference\/(?<id>[0-9]{1,7})",
                "method" => "DELETE",
                "middleware" => [
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::loadReferences(),
                    function ($a) {
                        $a->set("form", [
                            'status' => 'deleted'
                        ]);
                    },
                    PrequalificationMiddleware::updateReference("uriArgs.id", 'form'),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/section\/(?<id>[0-9]{1,7})",
                "method" => "DELETE",
                "middleware" => [
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::loadDocumentTypes(),
                    PrequalificationMiddleware::loadDocumentsSections(),
                    PrequalificationMiddleware::loadCertificates(),
                    PrequalificationMiddleware::hasSectionAccess("uriArgs.id"),
                    Conditional::switched("access", [
                        PrequalificationMiddleware::removeSectionData('uriArgs.id'),
                    ]),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => $action->get("access", false)]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/create_certificate\/?(?<section>[a-z0-9_-]+)?$",
                "method" => "POST",
                "middleware" => [
                    function ($a) {
                        $a->set("account", $a->get("session.account"));
                        $a->set("document_id", $a->getRoute()->getRequest()->getData()->get('form.id'));
                    },
                    Conditional::isset(
                        "document_id",
                        [
                            Procedure::get("documentCheckOwnership", ['key' => 'id', 'value' => 'document_id'])
                        ]
                    ),
                    PrequalificationMiddleware::loadSections(),
                    function($a){
                        $section = $a->get("uriArgs.section");
                        $sections = $a->get("sections");
                        if (array_search($section, $sections->values("label"))) {
                            $a->set("valid_section", true);
                        }
                    },
                    Conditional::hasKey("valid_section",
                        [
                            PrequalificationMiddleware::loadCollection(),
                            PrequalificationMiddleware::loadDocumentTypes(),
                            PrequalificationMiddleware::updateSectionData(),
                            PrequalificationModel::fulfillRequest(),
                            AccountMiddleware::loadAccountsByIdArray("requestor_aids"),
                            PrequalEmailMiddleware::sendDocumentRequestFulfilled(),
                            PrequalificationMiddleware::loadSections(),
                            PrequalificationMiddleware::loadCompanyInformation(),
                            PrequalificationMiddleware::loadOrganisation(),
                            PrequalificationMiddleware::addOrganisationAccountOwner("uriArgs.aid"),
                            PrequalificationMiddleware::loadCompanyFinancials(),
                            PrequalificationMiddleware::loadReferences(),
                            PrequalificationMiddleware::loadDocumentTypes(),
                            PrequalificationMiddleware::loadDocumentsSections(),
                            PrequalificationMiddleware::loadCertificates(),
                            PrequalificationMiddleware::loadSectionStatuses(),
                            PrequalificationMiddleware::checkPqqStatus(),
                            Conditional::switched("pqq_status", [
                                function ($action) {
                                    $action->set("receiver_id", $action->get("session")->get('user')['id']);
                                },
                                PrequalificationMiddleware::getNotificationsByReceiverId(),
                                PrequalificationMiddleware::checkPqqNotificationStatus(),
                                Conditional::switched("is_notify", [
                                    PrequalEmailMiddleware::notifyPqqCompleted(),
                                    PrequalEmailMiddleware::notifyMainContractorPqqCompleted(),
                                    function ($action) {
                                        $userNotifications = $action->get("receiver_notifications");
                                        foreach ($userNotifications as $notification) {
                                            Manager::getService('account')->update("user/notifications/{$notification->get('id')}", new Shape([
                                                'data' => [
                                                    "status" => 1
                                                ]
                                            ]));
                                        }
                                    },
                                ]),
                            ]),
                            Generic::set("json",  function () {
                                return json_encode(["success" => true]);
                            })
                        ],
                        //Else
                        [
                            Generic::set("json",  function () {
                                return json_encode(["success" => false]);
                            })
                        ]
                    ),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/export_pdf\/?(?<token>[a-z0-9]+)?",
                "method" => "GET",
                "middleware" => [
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::loadCompanyInformation(),
                    PrequalificationMiddleware::loadOrganisation(),
                    PrequalificationMiddleware::loadCompanyFinancials(),
                    PrequalificationMiddleware::loadReferences(),
                    PrequalificationMiddleware::loadDocumentTypes(),
                    PrequalificationMiddleware::loadDocumentsSections(),
                    PrequalificationMiddleware::loadCertificates(),
                    PrequalificationMiddleware::createTempDirectory(),
                    PDFMiddleware::loadLogos(),
                    PDFMiddleware::setHeader(),
                    PDFMiddleware::setFooter(),
                    PDFMiddleware::loadSectionCertificates(),
                    PDFMiddleware::loadSectionCertificatesFiles(),
                    PDFMiddleware::loadPDFLibrary(),
                    PDFMiddleware::loadPDFPages(),
                    PDFMiddleware::generatePDF(),
                    S3Middleware::uploadPrequalification(),
                    PDFMiddleware::outputPDF(),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/statuses",
                "method" => "POST",
                "middleware" => [
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::loadSections(),
                    PrequalificationMiddleware::updateStatuses(),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/export_reference\/(?<id>[0-9]{1,7})",
                "method" => "GET",
                "middleware" => [
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::loadCompanyInformation(),
                    PrequalificationMiddleware::loadReferences("uriArgs.id"),
                    PrequalificationMiddleware::loadDocumentTypes(),
                    PrequalificationMiddleware::createTempDirectory(),
                    PDFMiddleware::loadLogos(),
                    function($a){
                        $a->set("reference_data",[
                            'project_name'          => $a->get("prequalification.references.project_name"),
                            'client_name'           => $a->get("prequalification.references.client_name"),
                            'completion_date'       => $a->get("prequalification.references.completion_date"),
                            'contract_value'        => $a->get("prequalification.references.contract_value"),
                            'contact_name'          => $a->get("prequalification.references.contact_name"),
                            'contact_email'         => $a->get("prequalification.references.contact_email"),
                            'description_of_works'  => $a->get("prequalification.references.sow"),
                            'client_summary'        => $a->get("prequalification.references.client_summary"),
                        ]);

                        $a->set("logo", [
                            'prosper' => Config::get("logo.prosper")
                        ], true);
                        $a->set("pdf", [
                            'name' => $a->get("uriArgs.id") . ".pdf"
                        ]);
                    },
                    PDFMiddleware::setHeader('reference'),
                    PDFMiddleware::setFooter('reference'),
                    PDFMiddleware::loadPDFLibrary(),
                    PDFMiddleware::loadReferencePDFPages(),
                    PDFMiddleware::generateReferencePDF(),
                    S3Middleware::uploadPrequalification("reference"),
                    Generic::set("json",  function ($action) {
                        $path = parse_url($action->get("export_pdf"));
                        return json_encode(["data" => ['pdf' => [
                            'name'   => trim($path['path'], "/") ?? null,
                            'bucket' => 'document'
                        ]]]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/section_request",
                "method" => "POST",
                "middleware" => [
                    PrequalificationMiddleware::loadCollection(),
                    PrequalificationMiddleware::loadSections(),
                    PrequalificationMiddleware::loadDocumentTypes(),
                    AccountMiddleware::loadTokenTypes("auto_loader"),
                    function($a) {
                        $data = $a->getRoute()->getRequest()->getData();
                        $json = $data->getShape("json");
                        $a->setItems([
                            'contractor' => (int)$json->get("contractor"),
                            'section' => $json->get("section"),
                            'document' => [
                                "label" => $json->get("name"),
                                "document_owner" => (int)$a->get("uriArgs.aid"),
                                "type" => (int)$a->get("document_type")->filterByField("uid", 'account-documents')->getFirst()->get("id"),
                                "subtype" => (int)$a->get("document_subtype")->filterByField("uid", $json->get("section"))->getFirst()->get("id"),
                                "request_type" => (int)$json->get("request_type")
                            ],
                        ]);
                        $a->set("certificate_data", $a->get("document") + ['requestor_id' => $a->get("contractor")]);
                        $a->set("can_request", PrequalificationModel::canRequestCertificate($a->get("certificate_data")));
                    },
                    Conditional::isTrue("can_request", [
                        function($a) use ($unsubscribe_email_id){
                            PrequalificationModel::createRequest($a->get("certificate_data"));
                            AccountMiddleware::loadById("contractor", "contractor_account")($a);
                            AccountMiddleware::loadById("uriArgs.aid", "subcontractor_account")($a);
                            $account = $a->get("subcontractor_account");
                            $user = new Shape($account->get("users")[0]);
                            $a->setItems([
                                "account_data"    => $account,
                                "user_id"         => $user->get("id"),
                                "user_data"       => $user->get(),
                                "document_name"   => $a->get("document.label"),
                                "contractor_name" => $a->get("contractor_account.name")
                            ]);
                            //Create an autologin token and unsubscribe link for the email
                            AccountMiddleware::createUserToken(
                                "user_id", "token_type", Config::getUrl("site_url", "account/auto_loader")
                            )($a->set("token_type", $a->get("token_type")));
                            $a->set("unsubscribe_url",
                                Config::getUrl("site_url", "account/email/" . base64_encode(strval($a->get("account_data.email"))) . "/unsubscribe/$unsubscribe_email_id")
                            );
                            //Get cc email list
                            $a->set("cc_emails", TeamManager::getTeamMemberEmails("sid", [$a->get("user_data.email")])($a));
                            //Send the Email
                            Email::send("Document Request",[
                                "sender"     => $a->get("contractor_account"),
                                'recipient'  => $user,
                                'token'      => new Shape(['url' => $a->get("token_url")]),
                                'extra'      => new Shape([
                                    'company_name'  => $a->get("contractor_account.name"),
                                    'document_name' => $a->get("document_name")
                                ]),
                            ])($a);
                        }
                    ]),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => $action->get("can_request", false)]);
                    }),
                ]
            ],
        ]
    ]
];
