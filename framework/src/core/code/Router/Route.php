<?php

namespace Core\Router;

use Core\Data\Shape;
use Core\Data\Collection;
use Core\Data\Rule;
use Core\Layer\IncomingAbstract;
use Core\Layer\IncomingInterface;
use Core\Router\Route\Action;
use Core\System\Control;

class Route extends Shape
{
    /**
     * @var IncomingAbstract
     */
    protected IncomingAbstract $request;

    /**
     * @param string $key
     * @param array<array<string, mixed>|Shape> $data
     * @throws \Exception
     */
    public function __construct(string $key, array $data = [])
    {
        $data["id"] = $key;
        $data["actions"] = $data["actions"] ?? [];
        parent::__construct($data);
    }

    /**
     * @param IncomingAbstract $request
     * @return $this
     */
    public function setRequest(IncomingAbstract $request) : Route {
        $this->request = $request;
        return $this;
    }

    /**
     * @return IncomingAbstract
     */
    public function getRequest() : IncomingAbstract {
        return $this->request;
    }

    public function getRequestData(string $key = "") {
        $data = $this->getRequest()->getData();
        if($key) {
            return $data->get($key);
        }
        return $data;

    }

    /**
     * @param IncomingInterface $req
     * @return bool
     */
    public function match(IncomingInterface $req) : bool {
        $patten = $this->get("key", $this->get("id"));
        $uri    = $req->getPathByIndex(0);
        if(empty($uri)) {
            $uri = "index";
        }

        Control::callHandler("PreMatchUrl", (new Shape([
            'uri' => $uri,
            'request' => $req->getPath(),
            'pattern' => $patten
        ])));

        if(is_string($patten) && preg_match("/$patten/", $uri)) {
            $matched = true;
            $rules = $this->getShape("rules");
            if($rules->hasData()) {
                foreach($rules->toArray() as $rule) {
                    if($matched && is_callable($rule)) {
                        $matched = $rule($req, $this);
                    }
                }
            }
            return ($matched === true);
        }


        return false;
    }

    /**
     * @return Action
     */
    public function getDefaultAction() : Action {
        $default = $this->get("default_action", []);
        return new Action(
          is_array($default) ? $default : []
        );
    }

    /**
     * @return Action
     * @throws \Exception
     */
    public function matchAction() : Action {
        $match = null;
        $req   = $this->getRequest();
        if(!is_object($req) || !is_a($req, IncomingAbstract::class)) {
            throw new \Exception("Route has no request set");
        }

        $actions = $this->getCollection("actions", Action::class);
        foreach($actions as $action) {
            if(Rule::eqString($req->get("method"), $action->get("method", "GET"))) {
                $key = $action->string("key");
                if($key === "index" && $req->getPathLength() === 1) {
                    $match = $action;
                }
                elseif (preg_match("/$key/", $req->getPathByIndex(1, -1), $matches)) {
                    $args = [];
                    foreach($matches as $k => $v) {
                        if(is_string($k)) {$args[$k] = $v;}
                    }
                    $action->set("uriArgs", new Shape($args));
                    $match = $action;
                }
            }
        }
        if(!$match) { $match = $this->getDefaultAction(); }
        $match->set("route", $this);
        $match->set("request_args", $this->getRequest()->getArgs());
        if(!is_a($match, Action::class)) {
            throw new \Exception("Invalid action object type");
        }

        return $match;
    }
}
