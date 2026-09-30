<?php

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Conditional;
use Core\Middleware\Generic;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\TemplateLoader;
use Prosper\Middleware\EmailMiddleware;
use Prosper\Middleware\Relay;
use Prosper\Middleware\Relay\EnquiriesMiddleware;
use Prosper\Model\Signatory;
use Prosper\Model\TeamManager as TeamManagerModel;
use Core\Middleware\Exception as MiddlewareException;
use Prosper\Middleware\AccountMiddleware as ProsperAccount;
use Prosper\Form\Validation as FormValidation;
use Core\Middleware\Form;
use Core\Middleware\Session;
use Prequalification\Middleware\PrequalificationMiddleware;
use \Core\Data\Collection;
use Core\Service\Manager;
use Prequalification\Middleware\S3Middleware;
use Prequalification\Middleware\EmailMiddleware as PrequalEmailMiddleware;
use Prequalification\Middleware\PDFMiddleware;

$teamManagerTemplate = TemplateLoader::load(
    "page/react.php",
    "core",
    ["react_url" => Config::get("react_url"), "react_app" => "prosper"]
);

$user_confirmed_status = 2;

const WITNESS_LABEL = "Witness";

return [
    "key" => "^relay$",
    "rules" => [Relay::isResource("team_manager")],
    "middleware" => [],
    "type" => "http",
    "onError" => [
        "relayError" => function ($e, $a) {
            $a->set("json", $e->getMessage());
        },
        "noSession" => Generic::notAuthorised(),
        "failedRemoveTeamMember" => function (MiddlewareException $ex) {
            error_log($ex->getMessage());
            Generic::set("json",  function () {
                return json_encode(["success" => false]);
            });
        },
        "teamMemberExists" => function (MiddlewareException $ex) {
            error_log($ex->getMessage());
            Generic::set("json",  function () {
                return json_encode(["success" => false]);
            });
        },
        "failedSignup" => function ($e, $a) {
            error_log($e->getMessage());
            $a->set("json", json_encode(["success" => false]));

        },
    ],
    "actions" => [
        [
            "key" => "(?<aid>[0-9]{1,7})$",
            "method" => "GET",
            "middleware" => [
                Generic::set("json",  function ($action) {
                    return json_encode(
                        [
                            "data" => TeamManagerModel::getTeamMembersByAccountid((int)$action->get("uriArgs.aid")),
                        ]
                    );
                })
            ]
        ],
        [
            "key" => "(?<aid>[0-9]{1,7})\/member\/invite",
            "method" => "POST",
            "middleware" => [
                Session::validate(),
                AccountMiddleware::load("user/type","", "user_types"),
                function($a) {
                    $form = $a->getRoute()->getRequest()->getData()->getShape("form");
                    if (!$form->hasData()) {
                        $form = $a->getRoute()->getRequest()->getJson();
                    }
                    $a->setItems([
                        'aid' => $a->get("uriArgs.aid"),
                        'create_user' => $form->get("permission") ?? "true",
                        "user_data" => [
                            'email'          => $form->get("email"),
                            'firstname'      => $form->get("firstname"),
                            'contact_number' => $form->get("phone"),
                            'lastname'       => $form->get("lastname"),
                            'password'       => md5($form->get("email")),
                            'type_id'        => $a->getCollection("user_types")->filterByField("label", "team_assistant")->getFirst()->get("id")
                        ]
                    ]);
                },
                Conditional::isTrue("create_user",
                    [
                        AccountMiddleware::existsByKey("user_data.email", "email", skipAccount: true),
                    ],
                    true
                ),
                Conditional::switched("exists", [
                    function($a){
                        $a->set("create_user", false);
                    }

                ]),
                AccountMiddleware::load("account/organisation/type","", "roles"),
                function($a) {
                    $form = $a->getRoute()->getRequest()->getData()->getShape("form");
                    if (!$form->hasData()) {
                        $form = $a->getRoute()->getRequest()->getJson();
                    }
                    $role_id = null;
                    $roles = $a->getCollection("roles")->filterByField("label", $form->get("role"));
                    if($roles->count()){
                        $role_id = $roles->getFIrst()->get("id");
                    }
                    $a->setItems([
                        'aid' => $a->get("uriArgs.aid"),
                        "user_data" => [
                            'email'     => $form->get("email"),
                            'firstname' => $form->get("firstname"),
                            'lastname'  => $form->get("lastname"),
                            'contact_number'  => $form->get("phone"),
                            'password'  => md5($form->get("email")),
                            'type_id'   => $a->getCollection("user_types")->filterByField("label", "team_assistant")->getFirst()->get("id"),
                            'role'      => $form->get("role"),
                            'role_id'   => $role_id
                        ]
                    ]);
                },
                function($a){
                    $createUser = $a->get("create_user", false);
                    $role = $a->get("user_data.role");
                    if ($createUser || $role === WITNESS_LABEL) {
                        ProsperAccount::createUser("user_data", [
                            'firstname',
                            'lastname',
                            'email',
                            'password',
                            'contact_number',
                            'type_id'
                        ])($a);
                        $a->set("user_data", [
                            'user_id' => $a->get("new_user.id")
                        ], true);
                    }
                    if ($createUser) {
                        AccountMiddleware::loadTokenTypes("team_invite")($a);
                        AccountMiddleware::createUserToken(
                            "new_user.id", "token_type", Config::getUrl("site_url", "relay/v1/team_manager/token")
                        )($a);
                        EmailMiddleware::send("Team Manager Invite",[
                                "sender" => $a->get("new_user"),
                                "token"  => new Shape(['url' => $a->get("token_url")]),
                                "extra"  => new Shape([
                                    'member_first_name' => $a->get("user_data.firstname"),
                                    'first_name'        => $a->getShape("session")->getShape("user")->get("firstname"),
                                    'name'              => $a->getShape("session")->getShape("account")->get("name")
                                ])
                            ]
                        )($a);
                    }
                },
                ProsperAccount::createOrganisationMember("user_data", [
                    'firstname',
                    'lastname',
                    'contact_number',
                    'email',
                    'role',
                    'role_id',
                    'user_id'
                ]),
                S3Middleware::updateOrganisationLogo(memberIdKey : 'id'),
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
                Generic::set("json",  function ($a) {
                    return json_encode(["data" => ['id' => (int)$a->get("id")]]);
                })
            ]
        ],
        [
            "key" => "token\/(?<token>[0-9a-z]+)$",
            "method" => "GET",
            "middleware" => [
                AccountMiddleware::existsByToken("uriArgs.token", "team_invite"),
                function ($a){
                    $team    = $a->get("account");
                    $account = new Shape($team->get("account", []));
                    $user    = new Shape($team->get("user", []));
                    $a->set("reactData", json_encode([
                        'token'        => $a->get("uriArgs.token"),
                        'account_id'   => $account->get("id"),
                        'company_name' => $account->get("name"),
                        'email'        => $user->get("email"),
                        'firstname'    => $user->get("firstname"),
                        'lastname'     => $user->get("lastname"),
                        "phone"        => $user->get("contact_number"),
                    ], JSON_HEX_APOS));
                },
                Session::setCookie(strval($sessionCookie->get("name")), "uriArgs.token", $sessionCookie),
                $teamManagerTemplate
            ]
        ],
        [
            "key" => "activate\/(?<token>[0-9a-z]+)$",
            "method" => "POST",
            "middleware" => [
                AccountMiddleware::loadTokenTypes("auto_loader"),
                Form::validate(FormValidation::getSignature("team_manager")),
                AccountMiddleware::existsByToken("uriArgs.token", "team_invite"),
                function ($a) use ($user_confirmed_status) {
                    $a->set("uid", $a->get("account")->get("user.id"));
                    //update the user profile
                    AccountMiddleware::getService()->update(sprintf("user/%s/profile", $a->get("uid")), new Shape([
                        'data' => [
                            'status'         => $user_confirmed_status,
                            'firstname'      => $a->get("validated_form")->get("firstname"),
                            'lastname'       => $a->get("validated_form")->get("lastname"),
                            'password'       => $a->get("validated_form")->get("password"),
                            'contact_number' => $a->get("validated_form")->get("phone_number"),
                            'display_name' => sprintf("%s %s", $a->get("validated_form")->get("firstname"), $a->get("validated_form")->get("lastname"))
                        ]
                    ]));
                    //Create an autologin token and loged in the user
                    AccountMiddleware::createUserToken(
                        "account.user.id",
                        "token_type",
                        Config::getUrl("site_url", "account/auto_loader")
                    )($a);
                },
                Generic::set("json",  function ($a) {
                    return json_encode(["data" => [
                        "success"   => true,
                        "redirect" => sprintf("%s/redirect=dashboard", $a->get("token_url"))
                    ]]);
                })
            ]
        ],
        [
            "key" => "(?<aid>[0-9]{1,7})\/member\/(?<id>[0-9]{1,7})\/delete",
            "method" => "DELETE",
            "middleware" => [
                Session::validate(),
                TeamManagerModel::getTeamMemberTypeIds("team_admin"),
                function($a){
                    PrequalificationMiddleware::loadOrganisation("uriArgs.aid")($a);
                    $member = (new Collection($a->get("prequalification.organisation"), Shape::class))->filterByStringField("id", $a->get("uriArgs.id"));
                    if($member->count()){
                        $a->set("user_id", $member->getFirst()->get("user_id"));
                    }

                    $a->setItems([
                        "type_id"               => $a->getShape("session")->getShape("user")->get("type_id"),
                        "transaction_status_id" => EnquiriesMiddleware::TRANSACTION_WITHDRAW_ID,
                        "signatory_status_id"   => Signatory::getSignatories("pending")->get("id")
                    ]);
                },
                TeamManagerModel::memberCanBeRemoved("uriArgs.aid", "user_id", "team_admin_ids"),
                Signatory::hasActiveSignatory("user_id", "signatory_status_id"),
                TeamManagerModel::memberHasSignatoryActive("signatories", "transaction_status_id"),
                function($a){
                    $a->set("member_removed", false);
                    if($a->get("member_can_be_removed", false)){
                        if(!$a->get("active_signatory")) {
                            AccountMiddleware::getService()->delete("user/" . (int)$a->get("user_id"));
                            ProsperAccount::removeOrganisationMember("uriArgs.aid", "uriArgs.id")($a);
                            $a->set("member_removed", true);
                        }
                    }
                },
                Generic::set("json",  function ($a) {
                    return json_encode(["success" => $a->get("member_removed")]);
                })
            ]
        ],
        [
            "key" => "(?<aid>[0-9]{1,7})\/member\/(?<id>[0-9]{1,7})\/update",
            "method" => "PATCH",
            "middleware" => [
                Session::validate(),
                AccountMiddleware::load("user/type","", "user_types"),
                AccountMiddleware::load("account/organisation/type","", "roles"),
                function($a){
                    PrequalificationMiddleware::loadOrganisation()($a);
                    $member = (new Collection($a->get("prequalification.organisation"), Shape::class))->filterByStringField("id", $a->get("uriArgs.id"));
                    if($member->count()){
                        $a->set("user_id", $member->getFirst()->get("user_id"));
                    }

                    $form = $a->getRoute()->getRequest()->getData()->getShape("form");
                    if (!$form->hasData()) {
                        $form = $a->getRoute()->getRequest()->getJson();
                    }
                    $role_id = null;
                    $roles = $a->getCollection("roles")->filterByField("label", $form->get("role"));
                    if($roles->count()){
                        $role_id = $roles->getFIrst()->get("id");
                    }

                    if($a->get("user_id")){
                        if($form->get("permission") === true) {
                            $form->set("permission", "false");
                        }
                        else{
                            $a->set("user_id", null);
                        }
                    }

                    $a->set("create_user", ($form->get("permission") === true && !$a->get("user_id")));
                    $a->setItems([
                        'aid' => $a->get("uriArgs.aid"),
                        "user_data" => [
                            'email'           => $form->get("email"),
                            'firstname'       => $form->get("firstname"),
                            'lastname'        => $form->get("lastname"),
                            'display_name'    => sprintf("%s %s", $form->get("firstname"), $form->get("lastname")),
                            'contact_number'  => $form->get("phone"),
                            'type_id'         => $a->getCollection("user_types")->filterByField("label", "account_holder")->getFirst()->get("id"),
                            'role'            => $form->get("role"),
                            'role_id'         => $role_id,
                            'password'        => md5($form->get("email")),
                            'user_id'         => $a->get("user_id", null),
                        ]
                    ]);
                },
                Conditional::isTrue("create_user",
                    [
                        ProsperAccount::createUser("user_data", [
                            'firstname',
                            'lastname',
                            'email',
                            'password',
                            'contact_number',
                            'type_id'
                        ]),
                        function($a){
                            $a->set("user_data", [
                                'user_id' => $a->get("new_user.id")
                            ], true);
                        },
                        AccountMiddleware::loadTokenTypes("team_invite"),
                        function($a){
                            AccountMiddleware::createUserToken(
                                "uid", "token_type", Config::getUrl("site_url", "relay/v1/team_manager/token")
                            )($a);
                            $a->setItems([
                                "company_first_name" => $a->getShape("session")->getShape("user")->get("firstname"),
                                "company_name"       => $a->getShape("session")->getShape("account")->get("name"),
                            ]);

                            EmailMiddleware::send("Team Manager Invite",[
                                    "sender" => $a->get("new_user"),
                                    "token"  => new Shape(['url' => $a->get("token_url")]),
                                    "extra"  => new Shape([
                                        'member_first_name' => $a->get("user_data.firstname"),
                                        'first_name'        => $a->get("company_first_name"),
                                        'name'              => $a->get("company_name")
                                    ])
                                ]
                            )($a);
                        },
                    ],
                    true
                ),
                ProsperAccount::updateOrganisationMember("uriArgs.aid", "uriArgs.id", "user_data", [
                    'firstname',
                    'lastname',
                    'display_name',
                    'contact_number',
                    'email',
                    'role',
                    'role_id',
                    "user_id"
                ]),
                S3Middleware::updateOrganisationLogo(),
                Generic::set("json",  function () {
                    return json_encode(["success" => true]);
                })
            ]
        ],
        [
            "key" => "(?<aid>[0-9]{1,7})\/member\/(?<id>[0-9]{1,7})\/remove_logo",
            "method" => "DELETE",
            "middleware" => [
                function($a){
                    $a->set("aid", $a->get("uriArgs.aid"));
                },
                S3Middleware::removeOrganisationLogo(),
                Generic::set("json",  function ($action) {
                    return json_encode(["success" => true]);
                }),
            ]
        ],
    ]
];
