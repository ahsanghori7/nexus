<?php

namespace CL\Pdf\Html;


class Table extends Abstraction {

    /**
     * @var bool
     */
    protected bool $renderChildren = false;

    /**
     * @var int[]
     */
    protected array $props = [
        'autosize' => 1
    ];

    /**
     * @return string
     */
    public function getTag(): string
    {
        return "table";
    }

    /**
     * Here we override the default getNamespace method as we only want children to be
     * child classes of Table
     * @return string === CL\Pdf\Html\Table
     */
    public function getNs() : string {
        return get_class($this);
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function getContent() : string {
        return $this->getSnippet("table")->getContent();
    }

    /**
     * @param string $childType
     * @param array $data
     * @return false|mixed
     * @throws \Exception
     */
    public function loadChildClass(string $childType, array $data) {
        try {
            return parent::loadChildClass($childType, $data);
        }
        catch(\Exception $e) {
            //We want to ignore and filter out all children that are not of type table, but do not
            //want to neglect or miss legitimate exceptions
            $cls = $this->getNs() . "\\" . ucwords($childType);

            if($e->getMessage() === "Unknown Element Class $cls") {
                return false;
            }
            throw new \Exception($e->getMessage());
        }
    }
}
