<?php


namespace Prosper\Model;

use Core\Data\Shape;
use Core\Service\Manager;

class TeamManager
{

    /**
     * @param Shape $user
     * @return bool
     * @throws \Exception
     */
    public static function isAccountOwner(Shape $user): bool
    {
        $user_types = Manager::getService('account')->fetch('user/type')->getCollection('data');
        if($user_types->count()) {
            $team_admin = $user_types->filterByField('label', 'team_admin')->values("id");
        }
        return in_array(intval($user->get("type_id")), $team_admin ?? [], false);
    }

    /**
     * @param int $aid
     * @return mixed
     * @throws \Exception
     */
    public static function getAccountOwner(int $aid = 0): mixed
    {
        $account_owner = [];
        if($aid) {
            self::getTeamMembersByAccountid($aid)->map(function ($account) use (&$account_owner) {
                if ( self::isAccountOwner($account) ) {
                    $account_owner = $account;
                }
            });
        }
        return $account_owner;
    }

    /**
     * @param string $aidKey
     * @param string $key
     * @return mixed
     */
    public static function extractTeamMemberData(string $aidKey, string $key): mixed
    {
        return function ($a) use ($aidKey, $key) {
            $team = TeamManager::getTeamMembersByAccountid(intval($a->get($aidKey)));
            if($team->count()){
                $data = $team->values($key);
            }
            return $data ?? [];
        };
    }

    /**
     * @param string $aidKey
     * @param array $exclude
     * @return mixed
     */
    public static function getTeamMemberEmails(string $aidKey, array $exclude = []): mixed
    {
        return function ($a) use ($aidKey, $exclude) {
            $emails = self::extractTeamMemberData($aidKey, 'email')($a);
            return array_diff($emails, $exclude);
        };
    }


    /**
     * @param int $aid
     * @param array $exclude_type_ids
     * @return mixed
     */
    public static function getTeamMembersByAccountid(int $aid = 0, array $exclude_type_ids = []): mixed
    {
        try {
            $collection = Manager::getService("account")->fetch("account/$aid")->getCollection('data.users');
            $members = $collection->filterByNotExistInArray('type_id', $exclude_type_ids, false);
        } catch (\Exception $e) {
            $members = [];
        }
        return $members;
    }

    /**
     * @param string $memberType
     * @param string $resultKey
     * @return mixed
     */
    public static function getTeamMemberTypeIds(string $memberType,string $resultKey = 'team_admin_ids'): mixed
    {
        return function ($a) use ($resultKey, $memberType) {
            $team_member_types = Manager::getService('account')->fetch('user/type')->getCollection('data');
            $a->set($resultKey, $team_member_types->filterByField('label', $memberType)->values("id"));
        };
    }

    /**
     * @param string $aidKey
     * @param string $idKey
     * @param string $restrictedKey
     * @param string $typeKey
     * @param string $resultKey
     * @return \Closure
     */
    public static function memberCanBeRemoved(string $aidKey = 'aid', string $idKey = 'id', string $restrictedKey = '', string $typeKey = 'type_id', string $resultKey = 'member_can_be_removed'): \Closure
    {
        return function ($a) use ($aidKey, $idKey, $restrictedKey, $typeKey, $resultKey) {
            $member = self::getTeamMembersByAccountid(intval($a->get($aidKey)))->filterByField('id', intval($a->get($idKey)), cast: 'int');
            $allow = false;
            if($member->count()){
                $allow = !in_array(intval($member->first()->get("type_id")), $a->get($restrictedKey) ?? [], false);
            }
            if(is_null($a->get($idKey))){
                $allow = true;
            }
            if($allow) {
                $allow = in_array((int)$a->get($typeKey), $a->get($restrictedKey) ?? [], false);
            }
            $a->set($resultKey, $allow ?? false);
        };
    }

    /**
     * @param string $signatoriesKey
     * @param string $transactionStatusKey
     * @return \Closure
     */
    public static function memberHasSignatoryActive(string $signatoriesKey, string $transactionStatusKey): \Closure
    {
        return function ($a) use ($signatoriesKey, $transactionStatusKey) {
            $active_signatory = false;
            if($a->get($signatoriesKey)) {
                $status_id = (int)$a->get($transactionStatusKey);
                $a->get($signatoriesKey)->map(function($sign) use (&$active_signatory, $status_id){
                    $categories   = Manager::getService("document")->fetch("category", ['document_id' => $sign->get("document_id")])->getShape("data")->toArray();
                    if($categories) {
                        $category   = array_shift($categories);
                        $transactions = Manager::getService("project")->fetch("transaction", ['tender_id' => $category['entity_id']])->getShape("data")->toArray();
                        $transaction  = array_shift($transactions);
                        //check to see if the order is not withdrew
                        if(!$active_signatory) {
                            $active_signatory = (isset($transaction['status_id']) && (int)$transaction['status_id'] !== $status_id);
                        }
                    }
                });
            }
            $a->set("active_signatory", $active_signatory);
        };
    }
}
