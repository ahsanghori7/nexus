<?php
namespace App\Models;

use App\core\Logger;

class Permission {

    /*
    $perms[] = [
        'role' => 'specialist',
        'resource' => 'prosper'
        'actions' => ['prequalification', 'profile'],
        'conditions' => ['owner']
    ];
    */
    public static $perms = [];

    public static function check($role, $resource, $action = "*", array $config = []){

        // checks if action was allowed at least once
        $allowed = false;
        $action = strtolower($action);

        foreach(self::$perms as $perm){
            if($perm['role'] === $role && $perm['resource'] === $resource){

                if(in_array($action, $perm["actions"], true) || $perm["actions"] === ["*"]){

                    $allowed = true;

                    foreach($perm["conditions"] as $condition){

                        if (!method_exists(__CLASS__, $condition)) {
                            error(500, "Permission, Method doesnt exists: " . $condition);
                        }

                        if(self::$condition($config) === false){
                            Logger::log("Permission", $role . " is not allowed to perform '" . $action . "' action on " . $resource . " because of " . $condition, __FILE__, __LINE__);
                            return false;
                        }
                    }
                }
            }
        }

        if(!$allowed){
            Logger::log("Permission", $role . " is not allowed to perform '" . $action . "' action on " . $resource, __FILE__, __LINE__);
        }

        return $allowed;
    }

    /**
     * @param $role
     * @param $resource
     * @param string|array $actions
     * @param array $conditions
     */
    public static function allow($role, $resource, $actions = "*", $conditions = []){
        $actions = array_map("strtolower", (array)$actions);
        self::$perms[] = ['role' => $role, 'resource' => $resource, 'actions' => $actions, 'conditions' => (array)$conditions];
    }


    public static function deny($role, $resource, $actions = "*"){

        $actions = array_map("strtolower", (array)$actions);
        foreach(self::$perms as $key => &$perm){
            if($perm['role'] === $role && $perm['resource'] === $resource){
                foreach($perm['actions'] as $index => $action){
                    if(in_array($action, $actions, true) || $actions === ["*"]){
                        unset($perm['actions'][$index]);
                    }
                }

                if(empty($perm['actions'])){
                    unset(self::$perms[$key]);
                }
            }
        }
    }

    private static function owner(){

        //create a function for owner check

    }

 }
