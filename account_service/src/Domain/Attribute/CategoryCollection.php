<?php

namespace App\Domain\Attribute;
use App\Domain\Account\Attribute\Category;
use App\Domain\AbstractModel;

class CategoryCollection
{

    /**
     * @var AbstractModel
     */
    protected AbstractModel $model;
    /**
     *
     */
    public function __construct() {
        $this->model = new Category();
    }

    /**
     * @return Category
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
