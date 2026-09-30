<?php

namespace Core\Router\Route;

use Core\Router\Route\Template\Http;
use Core\Router\Route\Template\Base;
use Core\Data\Shape;

class Helper
{
    protected static $templates = [
        "http" => Http::class
    ];

    /**
     * @param string $templateName
     * @param array $actions
     * @param array $errors
     * @param array $middleware
     * @param array $default_action
     * @return array
     */
    public static function getTemplate(string $templateName = 'http', array $actions=[], array $errors=[], array $middleware=[], array $default_action=[]) {

        $template = self::getTemplateByName($templateName);
        $template["onError"]        = array_merge($errors, $template["onError"]);
        $template["middleware"]     = array_merge($middleware, $template["middleware"]);
        $template["actions"]        = array_merge($actions, $template["actions"]);
        $template["default_action"] = array_merge($default_action, $template["default_action"]);

        return $template;
    }

    /**
     * @param string $templateName
     * @param string $templateClass
     * @return void
     */
    public static function registerTemplate($templateName, $templateClass) {

        if (!class_exists($templateClass)) {
            throw new \Exception("Template class $templateClass does not exist");
        }
        if(!is_subclass_of($templateClass, Base::class)) {
            throw new \Exception("Template $templateName class $templateClass must extend Base class");
        }
        if(isset(self::$templates[$templateName])) {
            throw new \Exception("Template $templateName already registered");
        }
        self::$templates[$templateName] = $templateClass;
    }

    /**
     * @param string $templateName
     * @return array
     */
    public static function getTemplateByName($templateName) {
        if(!isset(self::$templates[$templateName])) {
            throw new \Exception("Template $templateName not found");
        }
        return self::$templates[$templateName]::getTemplate();
    }

    /**
     * @param array $keys
     * @return array
     */
    public static function getQueryParamsArray(array $keys, $source = "request_args") {
        $params = [];
        foreach($keys as $key => $value) {

            if(is_array($value)) {
                $params[$source . "." . $key] = new Shape(array_merge($value, ["key" => $key]));
                continue;
            }

            $paramKey = $value;
            $type = "string";
            if(is_string($key)) {
                $type = $value;
                $paramKey = $key;
            }
            $params[$source . "." . $paramKey] = [ "type" => $type, "key" => $paramKey];
        }
        return $params;
    }

    /**
     * @param array $routes
     * @return mixed
     */
    public static function groupedRoutes(array $routes = []): mixed
    {
        $base           = $routes[0];
        $allActions     = [];
        $unique         = [];
        $dedupedActions = [];
        $allErrors      = [];
        foreach ($routes as $entry) {
            if (isset($entry['actions'])) {
                $allActions[] = $entry['actions'];
            }
            if (isset($entry['onError'])) {
                $allErrors[] = $entry['onError'];
            }
        }
        $allActions = array_merge(...$allActions);
        $allErrors = array_merge(...array_reverse($allErrors));
        foreach ($allActions as $action) {
            $key = ($action['id'] ?? '') . '|' . ($action['method'] ?? '');
            if (!isset($unique[$key])) {
                $unique[$key] = true;
                $dedupedActions[] = $action;
            }
        }
        $base['actions'] = $dedupedActions;
        $base['onError'] = $allErrors;
        return $base;
    }
}
