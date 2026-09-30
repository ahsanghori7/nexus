<?php

use Api\Model\Document\Provider\Provider;
use Core\Router\Route\Helper;
use Core\Middleware\Rest;
use Core\Middleware\Exception as MiddlewareException;

return Helper::getTemplate(
    actions: [
        [
            "id" => "asite_folders",
            "key" => "^provider\/asite\/workspace\/folders$",
            "method" => "GET",
            "response_keys" => ["data" => "folders"],
            "description" => "Get Asite folder list for dropdown",
            "middleware" => [
                function ($a) {
                    $a->set("aid", $a->getShape("account")->int("id"));
                },
                // Check feature flag (ASITE_FOLDERS)
                Rest::fetchDynamic(
                    "account",
                    "feature/accounts/{aid}",
                    [],
                    "account_features",
                    postProcessor: function ($res, $a) {
                        $features = $res->getShape("json")->get("data") ?: [];
                        $hasAsiteFolders = false;
                        foreach ($features as $feature) {
                            if (isset($feature['feature']) && strtoupper($feature['feature']) === 'ASITE_FOLDERS') {
                                $hasAsiteFolders = true;
                                break;
                            }
                        }
                        if (!$hasAsiteFolders) {
                            throw new MiddlewareException("forbidden", "ASITE_FOLDERS feature not enabled for this account");
                        }
                    }
                ),
                Rest::fetchDynamic(
                    "account",
                    "account/{aid}/provider/asite",
                    [],
                    "provider_data",
                    postProcessor: function ($res, $a) {
                        $a->set("provider_data", $res->getShape("json")->get("data") ?: []);
                    }
                ),
                function ($a) {
                    $providerData = $a->get("provider_data");
                    $providerId = (int)($providerData['provider_id'] ?? 0);
                    if (!$providerId) {
                        throw new MiddlewareException("serviceError", "Asite provider not configured");
                    }
                    $a->set("provider_id", $providerId);
                },
                function ($a) {
                    $provider = Provider::getProvider("asite", [
                        "key" => (string)$a->get("provider_data.credentials.key")
                    ]);

                    if ($provider) {
                        /** @var Api\Model\Document\Provider\Asite $provider */
                        $folders = $provider->getWorkspaceFolderList();

                        $a->set("folders", $folders);
                    } else {
                        throw new MiddlewareException("serviceError", "Failed to initialize Asite provider");
                    }
                },
            ]
        ],
        [
            "id" => "asite",
            "key" => "^provider\/asite\/(?<nd>[A-Za-z0-9_,-]+)\/project\/(?<project_id>[0-9]+)$",
            "method" => "GET",
            "response_keys" => ["data" => "download"],
            "description" => "Get asite configuration for account",
            "middleware" => [
                function ($a) {
                    $a->set("aid", $a->getShape("account")->int("id"));
                },
                Rest::fetchDynamic(
                    "account",
                    "account/{aid}/provider/asite",
                    [],
                    "collection",
                    postProcessor: function ($res, $a) {
                        $a->set("provider_data", $res->getShape("json")->get("data") ?: []);
                    }
                ),
                function ($a) {
                    $identifier  = $a->get("uriArgs.nd");
                    $providerId  = (int)($a->get("provider_data.provider_id") ?? 0);
                    $projectId   = (int)$a->get("uriArgs.project_id");
                    if (!$providerId) {
                        throw new MiddlewareException("serviceError", "Asite provider not configured");
                    }
                    $a->set("identifier", $identifier);
                    $a->set("provider_id", $providerId);
                    $a->set("project_id", $projectId);
                },
                // Check feature flag (ASITE_FOLDERS)
                Rest::fetchDynamic(
                    "account",
                    "feature/accounts/{aid}",
                    [],
                    "account_features",
                    postProcessor: function ($res) {
                        $features = $res->getShape("json")->get("data") ?: [];
                        $featureNames = array_map('strtoupper', array_filter(array_column($features, 'feature')));
                        if (!in_array('ASITE', $featureNames, true)) {
                            throw new MiddlewareException("forbidden", "ASITE feature not enabled for this account");
                        }
                    }
                ),
                function ($a) {
                    Rest::fetchDynamic(
                        "project",
                        "project/{project_id}/integration/provider/{provider_id}",
                        [],
                        "project_integration",
                        "",
                        function ($res, $a) {
                            $integration = $res->getShape("json")->get("data") ?: [];
                            if (!array_key_exists('integration_uri', $integration) || empty($integration['integration_uri'])) {
                                throw new MiddlewareException("serviceError", "Project Integration Not Found");
                            }
                            $a->set("project_integration", $integration);
                        }
                    )($a);
                },
                function ($a) {
                    Rest::fetchDynamic(
                        "document",
                        "document/folder/provider/{provider_id}/identifier/{identifier}",
                        [],
                        "asite_provider_folder",
                        "",
                        function ($res, $a) {
                            $a->set("asite_provider_folder_data",  $res->getShape("json")->get("data") ?: []);
                        }
                    )($a);
                },
                function ($a) {
                    $folderData = $a->get("asite_provider_folder_data", "");
                    $provider = Provider::getProvider("asite", [
                        "key" => (string)$a->get("provider_data.credentials.key")
                    ]);

                    if ($provider) {
                        $project_integration = $a->get("project_integration");
                        $ndParam = (string)$a->get("uriArgs.nd");
                        $numbers = array_filter(array_map('trim', explode(',', $ndParam)));
                        if (!$numbers) {
                            throw new MiddlewareException("serviceError", "No identifiers provided");
                        }
                        $folderMap = [];
                        if (is_array($folderData)) {
                            foreach ($folderData as $id => $row) {
                                if (is_array($row) && isset($row['identifier'])) {
                                    $folderMap[strtoupper((string)$row['identifier'])] = $row['folder_name'] ?? null;
                                } elseif (isset($folderData['identifier'])) {
                                    $folderMap[strtoupper((string)$folderData['identifier'])] = $folderData['folder_name'] ?? null;
                                    break;
                                }
                            }
                        }

                        $foldersToFetch = [];
                        foreach ($numbers as $nd) {
                            $key = strtoupper($nd);
                            $folderName = $folderMap[$key] ?? ($folderMap[$nd] ?? null);
                            if ($folderName) {
                                $foldersToFetch[$nd] = $folderName;
                            }
                        }

                        if (empty($foldersToFetch)) {
                            throw new MiddlewareException("serviceError", "Folder mapping not found for identifiers");
                        }

                        $file_structure = $a->get("request_args.file_structure");

                        /** @var Api\Model\Document\Provider\Asite $provider */
                        $downloaded = $provider->downloadFolderDocumentByName($foldersToFetch, $project_integration, file_structure: (bool) $file_structure);
                        $urls = array_filter($downloaded, fn($u) => !empty($u));
                        if(!empty($urls)) {
                            $a->set("download", [
                                "success" => true,
                                "url" => $urls,
                            ]);
                        } else {
                            throw new MiddlewareException("serviceError", "Failed to download Asite document");
                        }
                    }
                },
            ]
        ],
        [
            "id" => "asite_by_folder",
            "key" => "^provider\/asite\/project\/(?<project_id>[0-9]+)$",
            "method" => "GET",
            "response_keys" => ["data" => "download"],
            "description" => "Get Asite documents by folder for a project",
            "middleware" => [
                function ($a) {
                    $a->set("aid", $a->getShape("account")->int("id"));
                },
                Rest::fetchDynamic(
                    "account",
                    "account/{aid}/provider/asite",
                    [],
                    "provider_data",
                    postProcessor: function ($res, $a) {
                        $a->set("provider_data", $res->getShape("json")->get("data") ?: []);
                    }
                ),
                function ($a) {
                    $providerId  = (int)($a->get("provider_data.provider_id") ?? 0);
                    $projectId   = (int)$a->get("uriArgs.project_id");
                    if (!$providerId) {
                        throw new MiddlewareException("serviceError", "Asite provider not configured");
                    }
                    $a->set("provider_id", $providerId);
                    $a->set("project_id", $projectId);
                },
                // Check feature flag (ASITE)
                Rest::fetchDynamic(
                    "account",
                    "feature/accounts/{aid}",
                    [],
                    "account_features",
                    postProcessor: function ($res) {
                        $features = $res->getShape("json")->get("data") ?: [];
                        $featureNames = array_map('strtoupper', array_filter(array_column($features, 'feature')));
                        if (!in_array('ASITE', $featureNames, true)) {
                            throw new MiddlewareException("forbidden", "ASITE feature not enabled for this account");
                        }
                    }
                ),
                function ($a) {
                    Rest::fetchDynamic(
                        "project",
                        "project/{project_id}/integration/provider/{provider_id}",
                        [],
                        "project_integration",
                        "",
                        function ($res, $a) {
                            $integration = $res->getShape("json")->get("data") ?: [];
                            if (!array_key_exists('integration_uri', $integration) || empty($integration['integration_uri'])) {
                                throw new MiddlewareException("serviceError", "Project Integration Not Found");
                            }
                            $a->set("project_integration", $integration);
                        }
                    )($a);
                },
                function ($a) {
                    $folder = $a->get("request_args.folder");
                    if (!$folder) {
                        throw new MiddlewareException("badRequest", "Missing folder parameter");
                    }

                    $provider = Provider::getProvider("asite", [
                        "key" => (string)$a->get("provider_data.credentials.key")
                    ]);

                    if ($provider) {
                        $project_integration = $a->get("project_integration");
                        $file_structure = $a->get("request_args.file_structure");

                        /** @var Api\Model\Document\Provider\Asite $provider */
                        $downloaded = $provider->downloadFolderDocumentByName(['folder' => $folder], $project_integration, search_by_folder: true, file_structure: (bool) $file_structure);
                        if (!empty($downloaded)) {
                            $a->set("download", [
                                "success" => true,
                                "url" => $downloaded,
                            ]);
                        } else {
                            throw new MiddlewareException("serviceError", "Failed to download Asite documents from path");
                        }
                    }
                },
            ]
        ],
        [
            "id" => "asite_package_folders",
            "key" => "^provider\/asite\/project\/(?<project_id>[0-9]+)\/package\/folders$",
            "method" => "GET",
            "response_keys" => ["data" => "folders"],
            "description" => "Get Asite subfolders inside the configured root folder",
            "middleware" => [
                function ($a) {
                    $a->set("aid", $a->getShape("account")->int("id"));
                },
                // Check feature flag (ASITE)
                Rest::fetchDynamic(
                    "account",
                    "feature/accounts/{aid}",
                    [],
                    "account_features",
                    postProcessor: function ($res) {
                        $features = $res->getShape("json")->get("data") ?: [];
                        $featureNames = array_map('strtoupper', array_filter(array_column($features, 'feature')));
                        if (!in_array('ASITE', $featureNames, true)) {
                            throw new MiddlewareException("forbidden", "ASITE feature not enabled for this account");
                        }
                    }
                ),
                Rest::fetchDynamic(
                    "account",
                    "account/{aid}/provider/asite",
                    [],
                    "provider_data",
                    postProcessor: function ($res, $a) {
                        $a->set("provider_data", $res->getShape("json")->get("data") ?: []);
                    }
                ),
                function ($a) {
                    $providerId = (int)($a->get("provider_data.provider_id") ?? 0);
                    $projectId  = (int)$a->get("uriArgs.project_id");
                    if (!$providerId) {
                        throw new MiddlewareException("serviceError", "Asite provider not configured");
                    }
                    $a->set("provider_id", $providerId);
                    $a->set("project_id", $projectId);
                },
                Rest::fetchDynamic(
                    "project",
                    "project/{project_id}/integration/provider/{provider_id}",
                    [],
                    "project_integration",
                    "",
                    function ($res, $a) {
                        $integration = $res->getShape("json")->get("data") ?: [];
                        if (empty($integration['integration_uri'])) {
                            throw new MiddlewareException("serviceError", "Project Integration Not Found");
                        }
                        $a->set("project_integration", $integration);

                        $meta = $integration['meta'] ?? '';
                        if (is_string($meta)) {
                            $meta = json_decode($meta, true);
                        }
                        $rootFolderName = $meta['provider_package_root_folder'] ?? "Trade Packages";
                        $a->set("root_folder_name", $rootFolderName);
                    }
                ),
                function ($a) {
                    $provider = Provider::getProvider("asite", [
                        "key" => (string)$a->get("provider_data.credentials.key")
                    ]);
                    if (!$provider) {
                        throw new MiddlewareException("serviceError", "Failed to initialize Asite provider");
                    }

                    /** @var Api\Model\Document\Provider\Asite $provider */
                    $tree = $provider->getWorkspaceFolderList($a->get("project_integration"));
                    $rootFolderName = $a->get("root_folder_name");
                    $matches = $provider->findFoldersByName($tree, $rootFolderName, true);

                    if (empty($matches)) {
                        throw new MiddlewareException("serviceError", "Configured root folder '$rootFolderName' not found in Asite");
                    }

                    $rootFolder = array_shift($matches);
                    $a->set("folders", array_values($rootFolder['folders'] ?? []));
                },
            ]
        ],
    ]
);
