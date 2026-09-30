<?php

namespace SupplyChain\Middleware\v2;

use Core\Config;
use Core\Data\Shape;
use Core\System\Environment as E;
use Core\Layer\Http\Outgoing;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Hubspot;

class HubspotMiddleware
{

    /**
     * @param string $path
     * @param array<mixed> $data
     * @param mixed $apiKey
     * @return Outgoing
     * @throws \Exception
     */
    public static function getNewRequest(string $path, array $data = [], mixed $apiKey = null): Outgoing
    {
        $hubspotApiUrl = E::get("HUBSPOT_API_URL");
        $hubspotApiKey = $apiKey ?? E::get("PROSPER_HUBSPOT_API_KEY");
        $request = (new Outgoing($hubspotApiUrl . $path, [], ['Content-Type' => 'application/json']));
        $request->setHeaders(['Authorization' => 'Bearer ' . strval($hubspotApiKey)]);
        if ($data) {
            $request->setData(new Shape($data));
        }
        return $request;
    }

    /**
     * @param string $resource
     * @param array $filters
     * @return Outgoing
     * @throws \Exception
     */
    public static function search(string $resource, array $filters): Outgoing
    {
        return self::getNewRequest(
            "/crm/v3/objects/$resource/search",
            $filters
        );
    }

    /**
     * @return \Closure
     */
    public static function aggregateProperties(): \Closure
    {
        return function ($action) {
            $body = $action->get("body");
            $action->set("properties", array_merge([
                "company" => $body->get("name"),
                "firstname" => $body->get("users.firstname"),
                "lastname" => $body->get("users.lastname"),
                "email" => $body->get("email"),
                "phone" => $body->get("phone"),
                "arrived_from_supply_chain" => true
            ], $action->get("supply_chain") ?? []));
        };
    }


    /**
     * @return \Closure
     */
    public static function supplyChainProperties(): \Closure
    {
        return function ($action) {

            $supply_chain_data = [
                'trades' => $action->getCollection('trades'),
                'regions' => $action->getCollection('regions')
            ];

            foreach ($supply_chain_data as $key => $collection) {
                $format = [];
                $body = $action->get("body")->get($key);
                if (is_array($body)) {
                    foreach ($body as $value) {
                        $format[] = $collection->filterByField("id", (int)$value)
                            ->getFirst()
                            ->get("label");
                    }
                }
                $action->set($key, implode(", ", $format));
            }

            // TODO: These properties need be added into the Prosper properties
            // Request fails because these only can be found on C-Link Hubspot

            // $action->set("supply_chain", [
            //     "supply_chain_owner_company" => $action->get("body.contractor.company"),
            //     "supply_chain_owner_name" => $action->get("body.contractor.name"),
            //     "supply_chain_trade" => $action->get("trades"),
            //     "supply_chain_region" => $action->get("regions")
            // ]);
        };
    }

    /**
     * @param string $email
     * @return bool
     * @throws \Exception
     */
    public static function exist(string $email): bool
    {
        $search = self::search("contacts", [
            "filters" => [[
                "propertyName" => "email",
                "operator" => "EQ",
                "value" => $email
            ]]
        ]);
        $content = $search->getResponse()->get('content') ?? '';
        $results = json_decode(strval($content), true);

        return is_array($results) && isset($results['total']) && $results["total"] > 0;
    }

    /**
     * @return \Closure
     */
    public static function addUser(): \Closure
    {
        return function ($action) {
            if (!self::exist($action->get("body")->get("email"))) {
                $res = self::getNewRequest("/crm/v3/objects/contacts", ["properties" => $action->get("properties")]);
                $res->getResponse();
                $action->set("hubspot_add_user", true);
            } else {
                $action->set("hubspot_add_user", false);
            }
        };
    }

    /**
     * @return \Closure
     */
    public static function sendMarketingExternalEmail(): \Closure
    {
        return function ($action) {

            AccountMiddleware::createUserToken(
                "subcontractor_uid",
                "token_type",
                Config::getUrl("site_url", "supply-chain-portal/token"),
                ['contractor_aid' => $action->get("main_contractor_id")]
            )($action);

            Hubspot::email(
                intval(Config::get("hubspot_emails.supply_chain.add_external")),
                "body.email",
                [],
                [
                    "body.users.firstname"     => "supply_chain_contact_first_name",
                    "body.contractor.company"  => "supply_chain_owner_company",
                    "body.contractor.name"  => "supply_chain_owner_name",
                    "token_url"
                ],
                "prosper_hubspot",
            )($action);
        };
    }

    /**
     * @return \Closure
     */
    public static function sendMarketingEmail(): \Closure
    {
        return function ($action) {
            if (E::get("HUBSPOT_SUPPLY_CHAIN_EMAIL_ENABLED", true) && $action->get("hubspot_add_user")) {
                $package = [
                    "message" => [
                        "to" => $action->get("body")->get("email"),
                    ],
                    "emailId" => E::get("HUBSPOT_SUPPLY_CHAIN_EMAIL_ID")
                ];

                $res = self::getNewRequest("/marketing/v3/transactional/single-email/send", $package);
                $res->getResponse();
            }
        };
    }

    /**
     * @return \Closure
     */
    public static function sendMarketingExternalReAddedEmail(): \Closure
    {
        return function ($action) {
            Hubspot::email(
                intval(Config::get("hubspot_emails.supply_chain.readded")),
                "body.email",
                [],
                [
                    "body.users.firstname"    => "supply_chain_contact_first_name",
                    "body.contractor.company" => "supply_chain_owner_company",
                    "body.contractor.name"    => "supply_chain_owner_name",
                ],
                "prosper_hubspot",
            )($action);
        };
    }
}
