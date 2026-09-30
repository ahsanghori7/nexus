<?php

namespace Prosper\Model;

use Core\Data\Shape;
use Core\Data\Collection;
use Core\Service\Manager;

class Opportunity
{

    /**
     * @param array<mixed> $package
     * @return bool
     */
    public static function canRegister(array $package): bool
    {
      return $package['has_trade']
        && $package['has_region']
        && !$package['awarded']
        && !$package['registered'];
    }

    /**
     * @param array<mixed> $package
     * @param Collection $types
     * @return int
     */
    public static function getNumberOfInterest(array $package, Collection $types): int
    {
        $accepted = $types->filterByField("uid", "accepted")->first()->get("id");
        $interests = 0;
        $enquiries  = (array)$package["Enquiry"] ?: [];
        foreach ((array)$package["history"] ?: [] as $sid => $interest) {
            $interest = (array)$interest;
            if ($interest["last_status"] === $accepted) {
                $interests++;
            }
            //Unset and registered interest IDs so enquiries is only added from supply chain
            unset($enquiries[intval($sid)]);
        }
        return count(array_keys($enquiries)) + $interests;
    }

    /**
     * @param array<mixed> $package
     * @param Shape $sent_status
     * @param array<int> $contractors
     * @param int $project_group_id
     *
     * @return void
     */
    public static function addContractor(array &$package, Shape $sent_status, array &$contractors, int $project_group_id)
    {
        //this needs to take in consideration the "Interest" key
        $enquiry = $package['Enquiry'];
        if (!is_null($enquiry)) {
            $lastIndex = (int)array_key_last((array)$enquiry);
            $history = ((array)$enquiry)[$lastIndex];
            if (!is_null(((array)$history)["history"])) {
                $lastIndex = (int)array_key_last((array)$enquiry);
                $enquiry = ((array)$enquiry)[$lastIndex];
                $history_first = [];
                foreach ((array)((array)$enquiry)["history"] as $item) {
                    $item = (array)$item;
                    if (intval($item['status_id']) === $sent_status->get("id")) {
                        $history_first = $item;
                    }
                }
            }
        }

        $aid = $history_first['author_id'] ?? $project_group_id;
        $package["history_first"] = ['author_id' => $aid];
        $contractors[] = $aid;
    }

    /**
     * @param array<string|int> $contractors
     * @return array<Collection>
     */
    public static function getAccountsData(array $contractors): array
    {
        $contractors = implode(",", array_unique($contractors));
        $users = Manager::getService('account')->fetch('user', ['account_id' => "[$contractors]"])->getCollection('data');

        $accounts = [];
        array_map(function ($user) use (&$accounts) {
            $accounts[] = $user->get("account_id");
        }, $users->getItems());

        $accounts = implode(",", array_unique($accounts));
        $accounts = Manager::getService('account')->fetch('account', ['id' => "[$accounts]"])->getCollection('data');
        return ['users' => $users, 'accounts' => $accounts];
    }

    /**
     * @param array<array<mixed>> $opportunities
     * @param array<Collection> $accountsData
     * @param Collection $types
     *
     * @return array<mixed>
     */
    public static function formatOpportunities(array $opportunities, array $accountsData, Collection $types): array
    {

        $users = $accountsData["users"];
        $accounts = $accountsData["accounts"];

        $result = [];
        foreach ($opportunities as $opportunity) {
            $nInterest = self::getNumberOfInterest($opportunity, $types);

            $opportunity = new Shape($opportunity);

            $history_first = $opportunity->get("history_first");
            $mainContractor = "";

            //$history_first['author_id'] this will be a user id as all the interest and enquiries are stored with the user id
            //but because not all the enquiries or interest have a value for the author id
            //we need to fallbakc and get the contractor id from the project group id
            //but the project group id is always a account id

            if (is_array($history_first) && isset($history_first['author_id'])) {

                $user_data = $users->filterByField("id", $history_first['author_id'], cast: "int");

                if ($user_data->count()) {
                    $user = $user_data->getFirst();
                    $aid = intval($user->get("account_id"));
                } else {
                    $aid = (int)$history_first['author_id'];
                }

                $account = $accounts->filterByField("id", (int)$aid, cast: "int");
                if ($account->count()) {
                    $mainContractor = $account->getFirst()->get("name");
                }
            }

            $result[] = [
                'project' => $opportunity->get("name"),
                'package' => $opportunity->get("label"),
                'id' => $opportunity->get("pid") . $opportunity->get("tid"),
                'main_contractor' => $mainContractor,
                'tender_return' => $opportunity->get("tender_return"),
                'start_on_site' => $opportunity->get("start_on_site"),
                'current_interest' => $nInterest,
            ];
        }

        return $result;
    }

    /**
     * @param string|int $region
     * @param array<string|int> $subRegions
     * @return bool
     */
    public static function hasRegion(string|int $region, array $subRegions): bool
    {
        return in_array($region, $subRegions, false);
    }
}
