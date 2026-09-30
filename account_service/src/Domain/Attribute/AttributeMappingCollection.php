<?php

namespace App\Domain\Attribute;
use App\Domain\Account\Attribute\Attribute;
use App\Domain\AbstractModel;

class AttributeMappingCollection
{

    /**
     * @var int
     */
    protected int $parentId;

    /**
     * @var int
     */
    protected int $groupId;

    /**
     * @var Attribute
     */
    protected Attribute $model;

    /**
     * @var array
     */
    protected array $data;

    /**
     * @var string|null
     */
    public ?string $filterType = null;

    /**
     * @var AbstractModel
     */
    protected AbstractModel $attributeModel;

    /**
     * @param int $parentId
     * @param int $groupId
     * @param AbstractModel $attributeModel
     * @param string|null $filterType
     */
    public function __construct(int $parentId, int $groupId, AbstractModel $attributeModel, ?string $filterType = null) {
        $this->model          = new Attribute();
        $this->parentId       = $parentId;
        $this->groupId        = $groupId;
        $this->attributeModel = $attributeModel;
        $this->filterType     = $filterType;
    }

    /**
     * @return Attribute
     */
    public function getModel() : AbstractModel {
        return $this->model;
    }

    /**
     * @param bool $associate_array
     * @return array
     */
    public function getCollectionData(bool $associate_array = false): array
    {
        $results = $this->attributeModel->getAccountAttributeMappings($this->parentId, [$this->groupId], $this->filterType);
        if($associate_array){
            return $results;
        }
        return array_values($results);
    }

    /**
     * @param int $groupdId
     * @param AttributeMappingCollection $collection
     * @return mixed
     */
    public function getAttributeIds(int $groupdId, AttributeMappingCollection $collection): mixed
    {
        return array_reduce($collection->getCollectionData(true)[$groupdId] ?? [], function($carry, $items) {
            return array_merge($carry, array_column($items, 'id'));
        }, []);
    }
}
