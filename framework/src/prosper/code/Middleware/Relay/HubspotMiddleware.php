<?php

namespace Prosper\Middleware\Relay;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Hubspot;
use Core\Middleware\ServiceMiddleware;
use Core\Service\Manager;
use Prosper\Model\TeamManager;

class HubspotMiddleware extends ServiceMiddleware
{

    const SERVICE = 'prosper_hubspot';

    /**
     * @param string $emailKey
     * @param string $propertiesKey
     * @return \Closure
     */
    public static function updateByEmail(string $emailKey, string $propertiesKey = 'hubspot_data'): \Closure
    {
        return function ($action) use ($emailKey, $propertiesKey) {
            $email = $action->get($emailKey);
            $hubspot = self::getService();
            $properties = [
                'email' => $email
            ] + $action->get($propertiesKey);
            $hubspot->write("/crm/v3/objects/contacts", new Shape(['data' => ['properties' => $properties]]));
            if (method_exists($hubspot, 'getContactId')) {
                if ($cid = intval($hubspot->getContactId($email))) {
                    $hubspot->update("/crm/v3/objects/contacts/$cid", new Shape(['data' => ['properties' => $action->get($propertiesKey)]]));
                }
            }
        };
    }

    /**
     * @param string $emailKey
     * @return \Closure
     */
    public static function loadContactDataByEmail($emailKey): \Closure
    {
        return function ($a) use ($emailKey) {
            $email = $a->get($emailKey);
            $hubspot = self::getService();
            $data = [];
            if (method_exists($hubspot, 'getContact')) {
                $contact = $hubspot->getContact($email);
                $how_to_win_work_opted = isset($contact["properties"]["how_to_win_work_opted"]) ? $contact["properties"]["how_to_win_work_opted"] : '';
                $data = filter_var($how_to_win_work_opted, FILTER_VALIDATE_BOOLEAN);
            }
            $a->set("loaded_hubspot_data", $data);
        };
    }

    /**
     * @return \Closure
     */
    public static function loadInterestProjects(): \Closure
    {
        return function ($action) {
            $data = Manager::getService('project')->fetch("tender", ["specialist_id" => $action->get("subcontractor.user.account_id"), "tender_history_type" => "Interest"])->getCollection('data');
            $projects = [];
            array_map(function ($history) use (&$projects) {
                $projects[] = $history->get("name");
                return $history;
            }, $data->getItems());

            $projects = array_unique($projects);
            $projects = implode("\n", $projects);
            $projects = str_replace('&amp;', '&', $projects);
            $action->set("projects", $projects);
        };
    }

    /**
     * @return \Closure
     */
    public static function aggregateProperties(): \Closure
    {
        return function ($action) {
            $action->set("hubspot_data", [
                'email'                      => $action->get("subcontractor.user.email"),
                'firstname'                  => $action->get("subcontractor.user.firstname"),
                'lastname'                   => $action->get("subcontractor.user.lastname"),
                'jobtitle'                   => $action->get("subcontractor.user.job_title"),
                'phone'                      => $action->get("subcontractor.user.contact_number"),
                'registered_interest_in_a_project' => true
            ], true);
        };
    }
}
