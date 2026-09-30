<?php

namespace App\DocCreator;

use App\DocCreator\Files;
use App\Models\FileManager;
use App\Models\PackageFolderDocuments;
use App\Models\TenderAddendumDocumentChanges;

class FilesParser
{
    /**
     * @return string[]
     */
    public static function getFilesContentModels(): array
    {
        return [
            // 'asite' =>
            'fileManager' => FileManager::class . '::getTenderFiles',
            'tenderAddendum' => FileManager::class . '::getTenderAddendumFiles',
            'instruction' => FileManager::class . '::getInstructionFiles',
            'packageFolderDocuments' => PackageFolderDocuments::class . '::getFiles',
            'tenderAddendumDocumentChanges' => TenderAddendumDocumentChanges::class . '::getFiles',
        ];
    }

    /**
     * @param array $content
     * @param array $files
     * @param string|null $type
     */
    public static function parseContent(array &$content, array $files, ?string $type = null): void
    {
        $occurrence = substr_count(json_encode($content), "download_all_files");
        $isList = array_is_list($content);

        foreach ($content as $key => &$value) {
            if (is_array($value)) {
                if ($occurrence > 1) {
                    $children = $value['children'][1] ?? [];
                    $children_download_all = [];
                    if (is_array($children)) {
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
                        foreach ($children_download_all as $children_download) {
                            if ($children_download['file']->isFileManagerDownloadAll()) {
                                if ($type) {
                                    $download_url = $children_download['file']->getDownloadAllUrl($files[$type]);
                                    if ($download_url) {
                                        $value['children'][$children_download['key']] = $download_url;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    $children = $value['children'][0] ?? [];
                    if (is_array($children)) {
                        $children = new Files($children);
                        if ($children->isFileManager()) {
                            $value['children'][0] = $children->getFiles($files);
                            $type = $children->getFileTypeSource();
                        } elseif ($children->isFileManagerDownloadAll()) {
                            if ($type) {
                                $download_url = $children->getDownloadAllUrl($files[$type]);
                                if ($download_url) {
                                    $value['children'][0] = $download_url;
                                }
                            }
                        }
                    }
                }

                self::parseContent($value, $files, $type);
            }
        }
        unset($value);
        if ($isList) {
            $content = array_values($content);
        }
    }

    /**
     * @param array $content
     * @return array
     */
    public static function getFileManagerSources(array $content): array
    {
        $sources = [];
        self::collectFileManagerSources($content, $sources);
        return array_values(array_unique($sources));
    }

    /**
     * @param array $content
     * @param array $sources
     */
    private static function collectFileManagerSources(array $content, array &$sources): void
    {
        foreach ($content as $value) {
            if (!is_array($value)) {
                continue;
            }

            foreach ([0, 1] as $childIndex) {
                $children = $value['children'][$childIndex] ?? [];
                if (is_array($children)) {
                    $file = new Files($children);
                    if ($file->isFileManager()) {
                        $source = $file->getFileTypeSource();
                        if ($source) {
                            $sources[] = $source;
                        }
                    }
                }
            }

            self::collectFileManagerSources($value, $sources);
        }
    }

    /**
     * @param array $value
     * @param array $skipFileManagerSources
     * @return bool
     */
    private static function containsSkippedFileManager(array $value, array $skipFileManagerSources): bool
    {
        $file = new Files($value);
        if ($file->isFileManager() && in_array($file->getFileTypeSource(), $skipFileManagerSources, true)) {
            return true;
        }

        foreach ($value['children'] ?? [] as $child) {
            if (is_array($child) && self::containsSkippedFileManager($child, $skipFileManagerSources)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array $content
     * @param array $skipFileManagerSources
     * @return bool
     */
    private static function removeLastSkippedFileManagerPage(array &$content, array $skipFileManagerSources): bool
    {
        $isList = array_is_list($content);
        foreach (array_reverse(array_keys($content)) as $key) {
            if (!is_array($content[$key])) {
                continue;
            }

            if (self::removeLastSkippedFileManagerPage($content[$key], $skipFileManagerSources)) {
                return true;
            }

            if (self::isPageElement($content[$key]) && self::containsSkippedFileManager($content[$key], $skipFileManagerSources)) {
                unset($content[$key]);
                if ($isList) {
                    $content = array_values($content);
                }
                return true;
            }
        }

        return false;
    }

    /**
     * @param array $value
     * @return bool
     */
    private static function isPageElement(array $value): bool
    {
        $elementType = $value['type'] ?? ($value['name'] ?? null);
        return $elementType === 'page';
    }

    /**
     * @param array $content
     */
    private static function removeTrailingEmptyPages(array &$content): void
    {
        $isList = array_is_list($content);
        $keys = array_reverse(array_keys($content));

        foreach ($keys as $key) {
            if (!is_array($content[$key])) {
                break;
            }

            self::removeTrailingEmptyPages($content[$key]);

            if (!self::isEmptyPageElement($content[$key])) {
                break;
            }

            unset($content[$key]);
        }

        if ($isList) {
            $content = array_values($content);
        }
    }

    /**
     * @param array $value
     * @return bool
     */
    private static function isEmptyPageElement(array $value): bool
    {
        return self::isPageElement($value) && !self::hasRenderableContent($value);
    }

    /**
     * @param mixed $value
     * @return bool
     */
    private static function hasRenderableContent(mixed $value): bool
    {
        if (is_string($value)) {
            return trim($value) !== '';
        }

        if (!is_array($value)) {
            return false;
        }

        $elementType = $value['type'] ?? ($value['name'] ?? null);
        if (in_array($elementType, ['text', 'shorttext', 'image', 'link', 'reference'], true)) {
            return true;
        }

        $layoutTypes = ['page', 'row', 'table', 'thead', 'column', 'data', 'document'];
        $props = $value['props'] ?? [];
        if (!in_array($elementType, $layoutTypes, true) && is_array($props) && array_filter($props)) {
            return true;
        }

        foreach ($value['children'] ?? [] as $child) {
            if (self::hasRenderableContent($child)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array $models
     * @return array
     */
    public static function getFiles(array $models): array
    {
        $files = [];
        foreach (self::getFilesContentModels() as $c_key => $callback) {
            if (is_callable($callback)) {
                $files[$c_key] = $callback($models);
            }
        }
        return $files;
    }

    /**
     * Appended documents can contain the same file manager as the main document.
     * When a file manager source is skipped, remove the last matching file manager
     * page from the appended document before rendering files. Only trailing empty
     * pages are pruned afterward so unrelated middle content stays untouched.
     *
     * @param array $content
     * @param array $models
     * @param array $skipFileManagerSources
     * @return array
     */
    public static function parseFiles(array $content, array $models, array $skipFileManagerSources = []): array
    {
        if ($skipFileManagerSources) {
            self::removeLastSkippedFileManagerPage($content, $skipFileManagerSources);
            self::removeTrailingEmptyPages($content);
        }
        self::parseContent($content, self::getFiles($models));
        return $content ?? [];
    }
}
