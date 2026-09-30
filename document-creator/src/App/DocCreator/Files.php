<?php
namespace App\DocCreator;

class Files{

    /**
     * @var array
     */
    protected $data = [];

    /**
     * @var
     */
    protected $childrens;

    /**
     * @var string[]
     */
    protected $files_column = [
        'name',
        'category'
    ];

    protected $files_content_types = [
        'fileManager',
        'tenderAddendum',
        'instruction',
    ];

    protected $file_manager_download_all_code = 'download_all_files';

    public const FILE_APPEND_INDEX = 1;
    public const FILE_TABLE_HEADER_CLASS = 'table-header';

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * @param string $key
     * @param array $value
     */
    public function saveData(string $key, array $value): void
    {
        $this->data[$key] = $value;
    }

    public function getData(string $key = null): array
    {
        return $this->data[$key] ?? $this->data;
    }

    /**
     * @param array $columns
     */
    public function setFilesColumns(array $columns): void
    {
        $this->files_column = $columns;
    }

    /**
     * @return string[]
     */
    public function getFilesColumns(): array
    {
        return $this->files_column;
    }

    /**
     * @return string
     */
    public function getFileManagerDownloadAllCode(): string
    {
        return $this->file_manager_download_all_code;
    }

    /**
     * @return mixed|null
     */
    public function getType()
    {
        $data = $this->getData();
        if(isset($data['type']) && $data['type']){
            return $data['type'];
        }
        return null;
    }

    /**
     * @return mixed|null
     */
    public function getFileTypeSource()
    {
        if($this->isFileManager()){
            $data = $this->getData();
            return $data['source'] ?? $data['type'];
        }
        return null;
    }

    /**
     * @return mixed|null
     */
    public function getCode()
    {
        $data = $this->getData();
        if(isset($data['code']) && $data['code']){
            return $data['code'];
        }
        return null;
    }

    /**
     * @return bool
     */
    public function isFileManager(): bool
    {
        return (in_array($this->getType(), $this->getFileManagerTypes(), true));
    }

    /**
     * @return mixed|string|null
     */
    public function fileManagerType(): ?string
    {
        $index = array_search($this->getType(), $this->getFileManagerTypes(), true);
        return $this->getFileManagerTypes()[$index] ?? null;
    }

    /**
     * @return bool
     */
    public function isFileManagerDownloadAll(): bool
    {
        return ($this->getCode() == $this->getFileManagerDownloadAllCode());
    }

    /**
     * @return array
     */
    public function getFileManagerTypes(): array
    {
        return $this->files_content_types;
    }

    /**
     * @param array $children
     * @return array
     */
    public function cloneFileHeaderChildren(array $children): array
    {
        $class_name = $children['children'][0]['props']['className'] ?? null;
        if($class_name) {
            $children['type'] = 'row';
            $class_name = str_replace(self::FILE_TABLE_HEADER_CLASS, "", $class_name);
            self::childrenSetProps($children, 0, 'className', $class_name);
        }
        return $children;
    }

    /**
     * @return array
     */
    public function getFilesChildren(): array
    {
        $children = [];
        foreach($this->getData()['children'] as $key => $value){
            /*
             * If the table filemanager contains only the table header
             */
            if(count($this->getData()['children']) <= self::FILE_APPEND_INDEX){
                $children[self::FILE_APPEND_INDEX] = $this->cloneFileHeaderChildren($value);
            }
            elseif($key >= self::FILE_APPEND_INDEX){
                $children[$key] = $value;
                break;
            }
        }
        return $children;
    }

    /**
     * @return mixed
     */
    public function getFirstChildren()
    {
        $childrens = $this->getFilesChildren();
        return array_shift($childrens);
    }

    /**
     * @param int $index
     * @param array $children
     */
    public function appendChildren(int $index, array $children): void
    {
        $this->data['children'][$index] = $children;
    }

    /**
     * @param array $children
     * @param int $child
     * @param string $value
     */
    public static function childrenSetValue(array &$children, int $child, string $value): void
    {
        $children['children'][$child]['children'] = [$value];
    }

    /**
     * @param array $children
     * @param int $child
     * @param string $key
     * @param string $value
     */
    public static function childrenSetProps(array &$children, int $child, string $key, string $value): void
    {
        $children['children'][$child]['props'][$key] = $value;
    }

    /**
     * @param array $children
     * @param int $child
     * @param string $value
     */
    public static function childrenSetType(array &$children, int $child, string $value): void
    {
        $children['children'][$child]['type'] = $value;
    }

    /**
     * @param array $files
     * @param string $type
     * @return array
     */
    public static function getFilesByType(array $files, string $type): array
    {
        return $files[$type] ?? [];
    }

    /**
     * @param array $files
     * @return array
     */
    public function getFiles(array $files): array
    {
        $index = self::FILE_APPEND_INDEX;
        $files = self::getFilesByType($files, $this->getFileTypeSource());

        //remove all hardcoded table files rows except the header
        $this->saveData("children", [$this->getData('children')[0]]);

        if(isset($files['files']) && is_array($files['files'])) {
            foreach ($files['files'] as $file) {
                $children = $this->getFirstChildren();
                if(isset($children['columns'])){
                    $this->setFilesColumns($children['columns']);
                }
                foreach ($this->getFilesColumns() as $key => $file_key) {
                    self::childrenSetValue($children, $key, $file[$file_key]);
                }
                self::childrenSetType($children, 0, 'link');
                self::childrenSetProps($children, 0, 'href', $file['src']);
                self::childrenSetProps($children, 0, 'type', 'link');
                $this->appendChildren($index, $children);
                $index++;
            }
        }

        return $this->getData();
    }

    /**
     * @param array $files
     * @return array
     */
    public function getDownloadAllUrl(array $files): array
    {
        $children = $this->getData();
        if($files['download']) {
            $children['props']['href'] = $files['download'];
        }
        return $children;
    }

}
