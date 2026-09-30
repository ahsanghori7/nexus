<?php

use Core\Config;
use Core\Data\Shape;
use Prosper\Middleware\EmailMiddleware;
use Core\Middleware\Service\AccountMiddleware;
use Core\Data\Collection;
use Core\Middleware\Service\UserMiddleware;
use SupplyChain\Middleware\SupplyChainMiddleware;
use SupplyChain\Middleware\v2\SupplyChainMiddleware as SupplyChainMiddlewarev2;

return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "actions" => [
        [
            "key" => "email",
            "middleware" => [
                function ($a) use ($argv) {
                    $file = $argv[3] ?? null;
                    $aid  = $argv[4] ?? 0;
                    if (!$aid) {
                        echo "Please specify the main contractor account id";
                        die;
                    }
                    $a->set("account_id", $aid);
                    if ($file && file_exists($file)) {
                        $accounts = file_get_contents($file);
                        $a->set('accounts_ids', explode("\n", $accounts));
                    } else {
                        echo "The specified file $file was not found";
                        die;
                    }
                },
                AccountMiddleware::loadAccountsByIdArray("accounts_ids"),
                AccountMiddleware::loadTokenTypes("supply_chain"),
                AccountMiddleware::loadById("account_id"),
                function ($a) {
                    $contractor      = $a->get("account");
                    $contractor_user = $contractor->getCollection("users")->first();
                    (new Collection($a->get("accounts"), Shape::class))->map(function ($account) use ($a, $contractor, $contractor_user) {
                        $user = $account->getCollection("users")->first();
                        $a->set("id", $user->get("id"));
                        AccountMiddleware::createUserToken(
                            "id",
                            "token_type",
                            Config::getUrl("site_url", "supply-chain-portal/token"),
                            ['contractor_aid' => $contractor->get("id")]
                        )($a);
                        SupplyChainMiddlewarev2::loadUserByAccountId("account_id")($a);
                        SupplyChainMiddleware::getOwner()($a);
                        EmailMiddleware::send("Supply Chain Add External", [
                            "sender" => $user,
                            "to"     => $user->get("email"),
                            "extra"  => new Shape([
                                'supply_chain_owner_name'         => $contractor_user->get("firstname") . " " . $contractor_user->get("lastname"),
                                'supply_chain_owner_company'      => $contractor->get("name"),
                                'supply_chain_owner_name' => $a->get("owner.name"),
                                'supply_chain_owner_role' => $a->get("owner.role"),
                                'supply_chain_contact_first_name' => $user->get("firstname"),
                            ]),
                            "token" => new Shape(["url" => $a->get("token_url")])
                        ])($user);
                    });
                },
            ]
        ],
    ]
];
