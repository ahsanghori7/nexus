<?php

namespace Api\Middleware\Relay;

use Core\Data\Collection;
use Core\Data\Shape;
use Core\Middleware\ServiceMiddleware;
use Core\Service\Manager;
use Core\Config;
use Api\Middleware\ApiSession;
use Core\Middleware\Service\AccountMiddleware;

class PrequalificationMiddleware extends ServiceMiddleware
{

    public const SERVICE = 'account';

    /**
     * @param string $aidKey
     * @param string $saveKey
     * @return callable
     */
    public static function loadPrequalificationSections(string $aidKey = "uriArgs.aid", string $saveKey = "preq"): callable
    {
        return function ($action) use ($aidKey, $saveKey) {
            $sessionHandler = Config::get("session.handler", ApiSession::class);
                try {
                    $sessionHandler::init()($action);
                } catch (\Throwable $e) {
                    // ignore session init issues, continue with other sources
                }

            $aid = (int)(
                $action->get($aidKey)
                ?? $action->get("account.id")
            );

            if (!$aid) {
                $action->set($saveKey, []);
                return;
            }

            // Load the contractor supply chain to identify subcontractor account IDs
            $action->set("account", ["id" => $aid]);
            AccountMiddleware::fetchSupplyChain()($action);

            $subcontractorIds = $action->getCollection("collection")->getIds(true);
            if (!$subcontractorIds) {
                $action->set($saveKey, []);
                return;
            }

            $sections = [];
            foreach ($subcontractorIds as $subcontractorId) {
                try {
                    $subSections = Manager::getService('account')
                        ->fetch("prequalification/{$subcontractorId}/sections")
                        ->getCollection('data');

                    foreach ($subSections as $section) {
                        //Only the top level sections (finance, documents, references) carry the status
                        //The document sub sections are expiry-only.
                        if ($section->int("parent_id") !== 0) {
                            continue;
                        }

                        $sections[] = $section->toArray();
                    }
                } catch (\Throwable $e) {
                    continue;
                }
            }

            if ($sections) {
                $action->set($saveKey, new Collection($sections, Shape::class));
            }
        };
    }
}
