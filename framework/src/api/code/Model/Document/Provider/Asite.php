<?php

namespace Api\Model\Document\Provider;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\System\Environment;
use Core\Middleware\Exception as MiddlewareException;

class Asite extends Provider
{

    CONST PROVIDER_NAME = 'asite';

    /**
     * @var string
     */
    protected static string $apiUrl = 'https://dmsak.asite.com/';

    /**
     * @var string
     */
    protected string $apiDownloadUrl = 'https://downloadak.asite.com/download/public';

    /**
     * @var string|null
     */
    protected ?string $sessionId = null;

    /**
     * @var string|null
     */
    protected ?string $workspaceId = null;

    /**
     * @return mixed
     */
    public function getCertificate()
    {
        $storage = $this->getCredentialStorage();
        $storage::setProvider($this->getProviderName());
        return $storage::getData("certificate");
    }

    /**
     * @return string|null
     */
    public function getSessionId()
    {
        return $this->sessionId;
    }

    /**
     * @return string|null
     */
    public function getWorkspaceId()
    {
        return $this->workspaceId;
    }

    /**
     * @return void
     * @throws \Exception
     */
    public function authenticate(): void
    {
        try {
            $credentials = new Shape($this->getCredentials());
            $this->getStorageService()->set("url", $this->getApiUrl());
            $res = $this->getStorageService()->write("apilogin/", new Shape(
                [
                    'data' => [
                        'emailId'  => $credentials->get("email"),
                        'password' => $credentials->get("password"),
                    ],
                    'headers' => [
                        'Content-Type' => 'application/x-www-form-urlencoded',
                        'Accept'       => 'application/json',
                    ],
                    'options' => [
                        CURLOPT_CAINFO => $credentials->get("certificate")
                    ]
                ]
            ));
            if ( $res->get("info.http_code") === 200 ) {
                $json = $res->json("content");
                $this->sessionId = $json["UserProfile"]["Sessionid"];
            } else {
                $httpCode = $res->get("info.http_code");
                throw new \Exception("Authentication failed with HTTP code: " . $httpCode, $httpCode);
            }
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage(), $e->getCode());
        }
    }

    /**
     * @return void
     * @throws \Exception
     */
    public function getWorkspaceList(): array
    {
        try {
            $this->authenticate();
            $credentials = new Shape($this->getCredentials());
            $res = $this->getStorageService()->fetch("api/workspace/workspacelist", [],
                [CURLOPT_CAINFO => $credentials->get("certificate")],
                ['Accept' => 'application/json',"Cookie" => "ASessionID=".$this->getSessionId()]
            );

            if ( $res->get("info.http_code") !== 200 ) {
                $httpCode = $res->get("info.http_code");
                throw new \Exception("Failed to get workspace list with HTTP code: " . $httpCode, $httpCode);
            }

            $json = $res->json("content");
            $workspacesRaw = $json['asiteDataList'] ?? [];

            $workspaces = $this->normalizeWorkspaceList($workspacesRaw);

            $workspaceData = [];
            foreach($workspaces as $w) {
                $workspaceData[] = [
                    'id'   => $w["Workspace_Id"] ?? null,
                    'name' => $w["Workspace_Name"] ?? '',
                    'uri'  => $w["URI"][0] ?? null,
                ];
            }
            return $workspaceData;

        } catch (\Exception $e) {
            throw new \Exception($e->getMessage(), $e->getCode());
        }
    }

    /**
     * Flatten the workspace payload into a uniform list.
     *
     * @param array $workspacesRaw
     * @return array
     */
    private function normalizeWorkspaceList(array $workspacesRaw): array
    {
        if (isset($workspacesRaw['workspaceVO'])) {
            $workspacesRaw = $workspacesRaw['workspaceVO'];
        }

        $workspaces = [];
        if (isset($workspacesRaw['Workspace_Name']) || isset($workspacesRaw['URI'])) {
            $workspaces[] = $workspacesRaw;
        } elseif (is_array($workspacesRaw)) {
            foreach ($workspacesRaw as $workspace) {
                if (isset($workspace['workspaceVO'])) {
                    $workspace = $workspace['workspaceVO'];
                }
                if (isset($workspace['Workspace_Name']) || isset($workspace['URI'])) {
                    $workspaces[] = $workspace;
                }
            }
        }

        return $workspaces;
    }

    /**
     * Locate a workspace by id.
     *
     * @param array       $workspaceData
     * @param string|null $integrationId
     * @return array|null
     */
    private function findWorkspaceById(array $workspaceData, ?string $integrationId): ?array
    {
        if ($integrationId === null) {
            return null;
        }

        foreach ($workspaceData as $ws) {
            if ((string)($ws['id'] ?? '') === (string)$integrationId) {
                return $ws;
            }
        }

        return null;
    }

    /**
     * Locate a workspace by name (case-insensitive).
     *
     * @param array       $workspaceData
     * @param string|null $integrationName
     * @return array|null
     */
    private function findWorkspaceByName(array $workspaceData, ?string $integrationName): ?array
    {
        if (!$integrationName) {
            return null;
        }

        foreach ($workspaceData as $ws) {
            if (isset($ws['name']) && strcasecmp($ws['name'], $integrationName) === 0) {
                return $ws;
            }
        }

        return null;
    }

    /**
     * Resolve and fetch the workspace folder list for the given integration (live workspace match).
     *
     * @param array|string|null $project_integration
     * @return array
     * @throws \Exception
     */
    public function getWorkspaceFolderList($project_integration = null): array
    {
        try {
            $credentials = new Shape($this->getCredentials());
            $this->authenticate();

            $path = null;

            if (is_array($project_integration)) {
                $workspaceData = $this->getWorkspaceList();
                $integrationId = $project_integration['integration_id'] ?? null;
                $integrationName = $project_integration['integration_name'] ?? null;

                $match = $this->findWorkspaceById($workspaceData, $integrationId)
                    ?? $this->findWorkspaceByName($workspaceData, $integrationName);
                $uri = $match['uri'] ?? ($integrationUri ?? null);
                if (!$uri) {
                    throw new \Exception("Workspace URI not found for integration", 404);
                }

                $parsed = parse_url($uri);
                $path = ltrim($parsed['path'] ?? '', '/');
                $this->workspaceId = $uri;
            } else {
                return $this->getWorkspaceList();
            }

            $res = $this->getStorageService()->fetch($path, [],
                [CURLOPT_CAINFO => $credentials->get("certificate")],
                ["Cookie" => "ASessionID=".$this->getSessionId()]
            );

            if ( $res->get("info.http_code") === 200 ) {
                $content = $res->get("content");
                if($content) {
                    return $this->buildFolderTree("folderVO", $this->xmlToArray($content));
                }
            } else {
                $httpCode = $res->get("info.http_code");
                throw new \Exception("Failed to get workspace folder list with HTTP code: " . $httpCode, $httpCode);
            }
            return [];
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage(), $e->getCode());
        }
    }

    /**
     * @param string|array $folder
     * @param array $project_integration
     * @param bool $exact_match
     * @return array
     * @throws \Exception
     */
    public function getFolderDocuments(array $folder, array $project_integration, bool $exact_match = true, bool $search_by_folder = false): array
    {
        try {
            $credentials = new Shape($this->getCredentials());
            $folders = is_array($folder) ? $folder : [$folder];
            $folders = array_filter($folders, fn($f) => $f !== '');
            if (!$folders) {
                throw new \Exception("Folder not specified", 400);
            }

            $matches = $this->findFoldersByName($this->getWorkspaceFolderList($project_integration), $folders, $exact_match);
            if (!$matches) {
                throw new \Exception("Folder '" . implode(',', $folders) . "' not found in workspace", 404);
            }

            $allDocs = [];
            foreach ($folders as $fk => $folderName) {
                $key = $search_by_folder ? 'folder' : strtoupper((string)$fk);
                $lookup = $matches[$key] ?? null;

                if (!$lookup) {
                    continue;
                }
                $uri = $lookup['uri'] ?? null;
                if(!$uri){
                    continue;
                }
                $parsed = parse_url($uri);
                $path = ltrim($parsed['path']."?openAndView=false&generateShareLink=true&showLatestRevision=true", '/');
                $res = $this->getStorageService()->fetch($path, [],
                    [CURLOPT_CAINFO => $credentials->get("certificate")],
                    ["Cookie" => "ASessionID=".$this->getSessionId()]
                );

                if ( $res->get("info.http_code") === 200 ) {
                    $xml = $this->xmlToArray($res->get("content"));
                    $documents = json_encode($xml, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
                    $allDocs[$fk] = json_decode($documents, true);
                } else {
                    $httpCode = $res->get("info.http_code");
                    throw new \Exception("Failed to get folder documents with HTTP code: " . $httpCode, $httpCode);
                }
            }
            return $allDocs;
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage(), $e->getCode());
        }
    }

    /**
     * @param string|array $folder
     * @param array $project_integration
     * @param bool $exact_match
     * @param bool $search_by_folder
     * @param bool $file_structure
     * @return array|string
     * @throws \Exception
     */
    public function downloadFolderDocumentByName(array $folder, array $project_integration, bool $exact_match = true, bool $search_by_folder = false, bool $file_structure = false): array|string
    {
        try {
            $documents = $this->getFolderDocuments($folder, $project_integration, $exact_match, $search_by_folder);
            $uploadedUrls = [];

            // Normalize documents keyed by folder name to preserve mapping
            $docSets = [];

            foreach ($documents as $folderName => $docSet) {
                if (isset($docSet['documentVO'])) {
                    $docSets[$folderName] = $docSet;
                }
            }

            foreach ($docSets as $folderName => $docSet) {
                $docs = $docSet['documentVO'] ?? [];
                $docs = isset($docs['URI']) ? [$docs] : $docs;
                foreach ($docs as $doc) {
                    $uriField = $doc['URI'] ?? [];
                    $uriList  = is_array($uriField) ? $uriField : [ $uriField ];
                    $doc_uri  = $uriList[5] ?? $uriList[0] ?? '';
                    if ($doc_uri === '') {
                        continue;
                    }
                    if ($file_structure) {
                        $fileType   = $doc['FileType'] ?? 'pdf';
                        $extension  = "." . $fileType;
                        $fileName   = $doc['FileName'] ?? (isset($doc['DocTitle']) ? ($doc['DocTitle'] . $extension) : ($folderName . $extension));
                        $docTitle   = isset($doc['DocTitle']) ? ($doc['DocTitle'] . $extension) : $fileName;
                        $docRef     = isset($doc['DocRef']) ? ($doc['DocRef'] . $extension) : $docTitle;

                        $uploadedUrls[$folderName][] = [
                            'id'            => $doc['DocumentId'],
                            'uri'           => $doc_uri,
                            'file_name'     => $fileName,
                            'doc_title'     => $docTitle,
                            'doc_ref'       => $docRef,
                            'file_type'     => $fileType,
                            'rev_no'        => $doc['RevNo'] ?? '-',
                            'publisher_org' => $doc['PublisherOrg'] ?? '-'
                        ];
                    } else {
                        $uploadedUrls[$folderName][] = $doc_uri;
                    }
                }
            }

            return $uploadedUrls;
        } catch (\Exception $e) {
            // Clean error message to avoid header issues
            $cleanMessage = preg_replace('/[\r\n]+/', ' ', $e->getMessage());
            $cleanMessage = trim($cleanMessage);
            //Put this message to SNS or logging system
            Manager::getService('sns')->sendException('failed-provider-action', 'Asite Download Document Failed', new Shape([
                "error" => $cleanMessage,
                "code"  => $e->getCode() ?: 500
            ]));
            throw new MiddlewareException("serviceError", $e->getMessage(), $e->getCode());

        }
    }

    /**
     * @param string $folderKey
     * @param array $nodes
     * @param bool $skipInactive
     * @return array
     */
    function buildFolderTree(string $folderKey, array $nodes, bool $skipInactive = true): array
    {
        $tree = [];

        foreach ($nodes as $node) {
            if (!is_array($node)) continue;
            if ($skipInactive && isset($node['IsActive']) && !$node['IsActive']) {
                continue;
            }
            $id   = $node['FolderID']   ?? null;
            $name = $node['FolderName'] ?? null;
            if ($id === null || $name === null) continue;
            $entry = [
                'name' => $name,
                'id'   => $id,
                'uri'  => $node['URI'][0] ?? null
            ];
            if (!empty($node[$folderKey]) && is_array($node[$folderKey])) {
                $children = $node[$folderKey];

                // Normalize: if it's a single folder (associative), wrap it in an array
                if (isset($children['FolderID'])) {
                    $children = [$children];
                }
                $entry['folders'] = $this->buildFolderTree($folderKey, $children, $skipInactive);
            }
            $tree[$id] = $entry;
        }
        return $tree;
    }

    /**
     * Recursively search the folder tree by name.
     *
     * @param array        $tree
     * @param string|array $needle
     * @param bool         $exact
     * @return array
     */
    public function findFoldersByName(array $tree, string|array $needle, bool $exact = true): array
    {
        $needles = array_map('strval', is_array($needle) ? $needle : [$needle]);
        $matches = [];
        $walk = function(array $nodes) use (&$walk, &$matches, $needles, $exact)
        {
            foreach ($nodes as $id => $node) {
                if (!is_array($node)) continue;
                $name = $node['name'] ?? null;
                if ($name !== null) {
                    foreach ($needles as $ni => $needleVal) {
                        $isMatch = $exact ? ($name === $needleVal) : (stripos($name, $needleVal) !== false);
                        if ($isMatch) {
                            $matches[$ni] = $node;
                            break;
                        }
                    }
                }
                if (!empty($node['folders']) && is_array($node['folders'])) {
                    $walk($node['folders']);
                }
            }
        };
        if (!empty($tree['folders']) && is_array($tree['folders'])) {
            $walk($tree['folders']);
        } else {
            $walk($tree);
        }
        return $matches;
    }

    /**
     * @param string $xmlString
     * @return array
     * @throws \Exception
     */
    public function xmlToArray(string $xmlString): array
    {
        try {
            $xml = simplexml_load_string($xmlString, 'SimpleXMLElement', LIBXML_NOCDATA);
            if ($xml === false) {
                $errors = libxml_get_errors();
                $errorMessages = array_map(function($error) {
                    return $error->message;
                }, $errors);
                throw new \Exception("Failed to parse XML: " . implode(', ', $errorMessages), 400);
            }
            $json = json_encode($xml, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            return json_decode($json, true);
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage(), $e->getCode());
        }
    }

    /**
     * @param string $uri
     * @return array
     * @throws \Exception
     */
    public function downloadDocumentByUri(string $uri): array
    {
        try {
            $this->authenticate();

            $baseUrl = $this->apiDownloadUrl;
            $parts   = explode('/lnk/', $uri);
            $result  = $parts[1] ?? '';
            $path    = "/document?uuid=" . $result;

            $storage = $this->getStorageService();

            $storage->set("url", $baseUrl);

            $credentials = new Shape($this->getCredentials());
            $res = $storage->fetch(
                $path,
                [],
                [
                    CURLOPT_CAINFO => $credentials->get("certificate"),
                    CURLOPT_HEADER => true
                ],
                ["Cookie" => "ASessionID=" . $this->getSessionId()]
            );
            $rawResponse = $res->get('content');
            $headerSize  = (int) $res->get('info.header_size');

            // Extract filename from the response headers before stripping them
            $fileName = "downloaded_file";
            $headerSection = substr($rawResponse, 0, $headerSize);
            if (preg_match('/Content-Disposition:.*filename="([^"]+)"/i', $headerSection, $matches)) {
                $fileName = urldecode($matches[1]);
            }

            // Strip the HTTP headers — only keep the raw binary body
            $content = substr($rawResponse, $headerSize);

            return [
                'filename' => $fileName,
                'content'  => $content,
                'type'     => $res->get('info.content_type')
            ];
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage(), $e->getCode());
        }
    }
}
