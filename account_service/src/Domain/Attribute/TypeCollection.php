<?php

namespace App\Domain\Attribute;
use App\Domain\Account\Attribute\Type;
use App\Domain\AbstractModel;

class TypeCollection
{

    /**
     * @var AbstractModel
     */
    protected AbstractModel $model;
    /**
     *
     */
    public function __construct() {
        $this->model = new Type();
    }

    /**
     * @return Type
     */
    public function getModel() : AbstractModel {
        return $this->model;
    }

    /**
     * @return array
     * @throws \ReflectionException
     */
    public function getCollectionData(): array
    {
        return $this->model->all();
    }

}
