<?php
namespace App\DocCreator;

use App\core\Config;

class SOAMC extends Table{

    /**
     * @var string[]
     */
    public array $column = [
        'item',
        'mlc_provide',
        'subcontractor_provide',
        'comments'
    ];

    /**
     * @return string
     */
    public function getCheckedImage(): string
    {
        $image = Config::get("assets.schedule_of_attendances.checked");
        return "<img alt='checked' src='".$image."' />";
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
            $checked_image = $this->getCheckedImage();
            foreach($json as $k => $value){
                $children = $this->getFirstChildren();
                if(isset($children['columns'])){
                    $this->setColumns($children['columns']);
                }
                foreach ($this->getColumns() as $key => $column_key) {
                    if(!isset($value[$column_key]) || !$value[$column_key]){
                        $value[$column_key] = '';
                    }
                    else{
                        if((int)$value[$column_key] === 1) {
                            $value[$column_key] = $checked_image;
                        }
                    }
                    if(isset($json[$k]['title'])){
                        $value[$column_key] = sprintf("<b>%s</b>", $value[$column_key]);
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
