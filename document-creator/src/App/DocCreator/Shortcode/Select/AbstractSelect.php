<?php

namespace App\DocCreator\Shortcode\Select;

abstract class AbstractSelect
{

    /**
     * @var array
     */
    protected $options = [];

    /**
     * @var string
     */
    protected $optionKey = '';

    /**
     * AbstractSelect constructor.
     * @param array $data
     */
    public function __construct(array $data)
    {
        $this->setOptions($data);
    }

    /**
     * @param array $data
     */
    public function setOptions(array $data): void
    {
        $this->options = $data;
    }

    /**
     * @return array
     */
    public function getOptions(): array
    {
       return $this->options;
    }

    /**
     * @return string
     */
    public function getOptionKey(): string
    {
        return $this->optionKey;
    }

    /**
     * @param $option
     * @param null $default
     * @return string|null
     */
    public function getSelectedValue($option, $default = null): ?string
    {
        if($this->optionKey){
            return $this->getOptions()[$option][$this->getOptionKey()] ?? $default;
        }

        if(!is_int($option)){
            return $option;
        }

        return $this->getOptions()[$option] ?? $default;
    }
}
