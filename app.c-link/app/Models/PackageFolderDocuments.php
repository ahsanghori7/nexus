<?php

namespace App\Models;

use App\Api\Api;

class PackageFolderDocuments
{
    /**
     * @param array $models
     * @return array
     */
    public static function getFiles(array $models): array
    {
        try {
            $meta  = $models['document']->getMeta();
            $files = self::getFilesFromSnapshot($meta);

            if ($files !== null) {
                return ['files' => $files, 'download' => ''];
            }

            return self::getFilesFromApi($models);
        } catch (\Exception $e) {
            error_log("PackageFolderDocuments::getFiles failed: " . $e->getMessage());
            return ['files' => [], 'download' => ''];
        }
    }

    /**
     * Returns mapped files from temp_snapshot, or null if snapshot data is absent/empty.
     */
    private static function getFilesFromSnapshot(array $meta): ?array
    {
        $items = $meta['temp_snapshot']['categories']['tender_package_documents']['children']['package_documents']['children'] ?? null;

        if (empty($items)) {
            return null;
        }

        return array_values(array_map(static function (array $item): array {
            return [
                'rev'                    => $item['rev_no'] ?? '',
                'doc_ref'                => $item['doc_ref'] ?? '',
                'doc_title'              => $item['doc_title'] ?? '',
                'publisher_organisation' => $item['publisher_org'] ?? '',
                'src'                    => $item['download_uri'] ?? '',
                'type'                   => 'text',
            ];
        }, $items));
    }

    /**
     * Fetches files from the Asite API endpoint.
     */
    private static function getFilesFromApi(array $models): array
    {
        $pid            = $models['project']->getData('id') ?? 0;
        $providerFolder = $models['tender']->getData('provider_folder') ?? '';
        $uid            = $models['user']->getId() ?? 0;

        if (!$pid || !$providerFolder || !$uid) {
            return ['files' => [], 'download' => ''];
        }

        $token = self::resolveToken($uid);

        $data  = Api::get(
            "document/provider/asite/project/{$pid}",
            ['folder' => $providerFolder, 'file_structure' => 1],
            ['Authorization' => "Bearer {$token}"]
        );
        $items = $data['url']['folder'] ?? [];

        $files = array_map(static function (array $item): array {
            return [
                'rev'                    => $item['rev_no'] ?? '',
                'doc_ref'                => $item['doc_ref'] ?? '',
                'doc_title'              => $item['doc_title'] ?? '',
                'publisher_organisation' => $item['publisher_org'] ?? '',
                'src'                    => $item['uri'] ?? '',
                'type'                   => 'text',
            ];
        }, $items);

        return ['files' => $files, 'download' => ''];
    }

    private static function resolveToken(int $uid): string
    {
        $user = new UserModel([], $uid);
        $json = $user->createTokenByLabel($uid, 'temp_1h')->json()['data'] ?? [];
        if (empty($json['token'])) {
            throw new \Exception('PackageFolderDocuments: failed to create auth token');
        }
        return $json['token'];
    }
}
