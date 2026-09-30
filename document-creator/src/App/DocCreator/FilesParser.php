<?php

namespace App\DocCreator;

use App\DocCreator\Files;
use App\Models\FileManager;

class FilesParser
{
    /**
     * @return string[]
     */
    public static function getFilesContentModels(): array
    {
        return [
            'fileManager' => FileManager::class . '::getTenderFiles',
            'tenderAddendum' => FileManager::class . '::getTenderAddendumFiles',
            'instruction' => FileManager::class . '::getInstructionFiles',
        ];
    }

    /**
     * @param array $content
     * @param array $files
     * @param string|null $type
     */
    public static function parseContent(array &$content, array $files, string $type = null): void
    {
        $occurrence = substr_count(json_encode($content), "download_all_files");

        foreach($content as &$value) {
            if(is_array($value)) {
                if($occurrence > 1){
                    $children = $value['children'][1] ?? [];
                    $children_download_all = [];
                    if(is_array($children)) {
                        $children = new Files($children);
                        if ($children->isFileManager()) {
                            $value['children'][1] = $children->getFiles($files);
                            $type = $children->getFileTypeSource();
                            $children_download_all = [
                                [
                                    'key'  => 0,
                                    'file' => new Files($value['children'][0]['children'][0] ?? [])
                                ],
                                [
                                    'key'  => 2,
                                    'file' => new Files($value['children'][2]['children'][0] ?? []),
                                ]
                            ];
                        }
                        foreach($children_download_all as $children_download){
                            if ($children_download['file']->isFileManagerDownloadAll()) {
                                if($type) {
                                    $download_url = $children_download['file']->getDownloadAllUrl($files[$type]);
                                    if ( $download_url ) {
                                        $value['children'][$children_download['key']] = $download_url;
                                    }
                                }
                            }
                        }
                    }
                }
                else{
                    $children = $value['children'][0] ?? [];
                    if(is_array($children)) {
                        $children = new Files($children);
                        if ($children->isFileManager()) {
                            $value['children'][0] = $children->getFiles($files);
                            $type = $children->getFileTypeSource();
                        }
                        if ($children->isFileManagerDownloadAll()) {
                            if($type) {
                                $download_url = $children->getDownloadAllUrl($files[$type]);
                                if ( $download_url ) {
                                    $value['children'][0] = $download_url;
                                }
                            }
                        }
                    }
                }

                self::parseContent($value, $files, $type);
            }
        }
    }

    /**
     * @param array $models
     * @return array
     */
    public static function getFiles(array $models): array
    {
        $files = [];
        foreach(self::getFilesContentModels() as $c_key => $callback){
            if(is_callable($callback)){
                $files[$c_key] = $callback($models);
            }
        }
        return $files;
    }

    /**
     * @param array $content
     * @param array $models
     * @return array
     */
    public static function parseFiles(array $content, array $models): array
    {
        self::parseContent($content, self::getFiles($models));
        return $content ?? [];
    }

}
