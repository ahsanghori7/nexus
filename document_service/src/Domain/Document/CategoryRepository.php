<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractRepository;

/**
 * Class CategoryRepository
 * @package App\Domain\Document
 */
class CategoryRepository extends AbstractRepository
{
  /**
   * Allow a default model to be set for get model function
   */
  const DEFAULT_MODEL = "category";

  const ALL_FILES_LABEL = "All Project Files";

  const ALL_FILES_TYPE = "all_project_files";

  /**
   * @var string[]
   */
  protected $models = [
    "document" => Document::class,
    "category" => Category::class,
    "categoryMapping" => CategoryMapping::class,
    "tender" => Tender::class,
  ];

    /**
     * @param ?string $type
     * @return false|mixed|string[]|\string[][]
     */
  public function constants(?string $type = null)
  {
    $constants = [
      'default_cats' => [
          'Architectural',
          'Structural',
          'M&E',
          'Pricing document'
      ]
    ];

    if($type) {
        return $constants[$type] ?? false;
    }
    return $constants;
  }

  /**
   * @param string $label
   * @return string
   */
  public function hash(string $label): string
  {
    return md5($label);
  }

    /**
     * @param array $data
     * @return \App\Domain\AbstractModel
     * @throws \App\Domain\DomainException
     */
    public function addCategory(array $data): \App\Domain\AbstractModel
    {
        $category = $this->getModel();
        $category->store($data);
        return $category;
    }

    /**
     * @return array
     */
    public function addCategoriesByLabel(array $labels, $entity, $type, $parent = 0): array
    {
        $cats = [];
        foreach ($labels as $label) {
            if(method_exists($this, 'addCategories')) {
                $cats[] = $this->addCategories([
                    'entity_id' => $entity,
                    'label' => $label,
                    'entity_type' => $type,
                    'parent_id' => $parent
                ]);
            }
        }
        return $cats;
    }

    /**
     * @param int|null $id
     * @return mixed
     */
    public function getMappingQuery(int|null $id = null) {

        $query = $this->getModel()
            ->newQuery()
            ->select(['*','document_categories.id as cid'])
            ->leftJoin('document_category_mapping', 'document_category_mapping.category_id', '=', 'document_categories.id')
            ->leftJoin('document', 'document.id', '=', 'document_category_mapping.document_id');

        if($id) {
            $query->where(function ($query) use ($id) {
                $query->where('entity_id', '=', $id)
                    ->orWhere('document_categories.parent_id', '=', $id);
            });
        }
        return $query;
    }
}
