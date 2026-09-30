<?php
namespace App\DocCreator;

class Table{

    /**
     * @var int
     */
    public const APPEND_INDEX = 1;

    /**
     * @var string
     */
    public const TABLE_HEADER_CLASS = 'table-header';

    /**
     * @var string
     */
    public const CLONE_HEADER_REMOVE_CLASS = '';

    /**
     * @var array
     */
    protected array $data = [];

    /**
     * @var string
     */
    protected string $content = '';

    /**
     * @var array
     */
    public array $childrens;

    /**
     * @var array|string[]
     */
    public array $column = [];

    public function __construct(array $data, string $content)
    {
        $this->data = $data;
        $this->content = $content;
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
    public function setColumns(array $columns): void
    {
        $this->column = $columns;
    }

    /**
     * @return string[]
     */
    public function getColumns(): array
    {
        return $this->column;
    }

    /**
     * @return mixed|null
     */
    public function getProps()
    {
        $data = $this->getData();
        if(isset($data['props']) && $data['props']){
            return $data['props'];
        }
        return null;
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
    public function getSubType()
    {
        $data = $this->getData();
        if(isset($data['subtype']) && $data['subtype']){
            return $data['subtype'];
        }
        return null;
    }

    /**
     * @return mixed|null
     */
    public function getCode(): mixed
    {
        $data = $this->getData();
        if(isset($data['code']) && $data['code']){
            return $data['code'];
        }
        return null;
    }

    /**
     * @param array $children
     * @return array
     */
    public function cloneHeaderChildren(array $children): array
    {
        $class_name = $children['children'][0]['props']['className'] ?? null;
        if(static::CLONE_HEADER_REMOVE_CLASS) {
            $children['props']['className'] = str_replace(static::CLONE_HEADER_REMOVE_CLASS, "", $children['props']['className']);
        }

        if($class_name) {
            $children['type'] = 'row';
            $class_name = str_replace(self::TABLE_HEADER_CLASS, "", $class_name);
            self::childrenSetProps($children, 0, 'className', $class_name);
        }
        return $children;
    }

    /**
     * @return array
     */
    public function getChildren(): array
    {
        $children = [];
        foreach($this->getData()['children'] as $key => $value){
            /*
             * If the table contains only the table header
             */
            if(count($this->getData()['children']) <= self::APPEND_INDEX){
                $children[self::APPEND_INDEX] = $this->cloneHeaderChildren($value);
            }
            elseif($key >= self::APPEND_INDEX){
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
        $childrens = $this->getChildren();
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
     * @return string
     */
    public function getContent(): string
    {
        return $this->content;
    }

    /**
     * @return array
     */
    public function getRows(): array
    {
        $index = self::APPEND_INDEX;
        $json = json_decode($this->getContent(), true);
        if($json){
            $this->saveData("children", [$this->getData('children')[0]]);
            foreach($json as $value){
                $children = $this->getFirstChildren();
                if(isset($children['columns'])){
                    $this->setColumns($children['columns']);
                }
                foreach ($this->getColumns() as $key => $column_key) {
                    if(!isset($value[$column_key]) || !$value[$column_key]){
                        $value[$column_key] = '';
                    }
                    self::childrenSetValue($children, $key, $value[$column_key]);
                }
                $this->appendChildren($index, $children);
                $index++;
            }
            return $this->getData();
        }
        return [];
    }
}
