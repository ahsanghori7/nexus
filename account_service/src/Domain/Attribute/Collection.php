<?php

namespace App\Domain\Attribute;
use App\Domain\Account\Attribute\Attribute;
use App\Domain\AbstractModel;

class Collection
{

    /**
     * @var AbstractModel
     */
    protected AbstractModel $model;
    /**
     *
     */
    public function __construct() {
        $this->model = new Attribute();
    }

    /**
     * @return Attribute
     */
    public function getModel() : AbstractModel {
        return $this->model;
    }

    /**
     * @param array $filters
     * @return array
     * @throws \ReflectionException
     */
    public function getCollectionData(array $filters = []): array
    {
        return $this->model->all($filters);
    }

}
