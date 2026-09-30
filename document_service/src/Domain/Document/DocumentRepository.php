<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractRepository;
use App\Domain\Document\DocumentOwnerMapping;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Class DocumentRepository
 * @package App\Domain\Document
 */
class DocumentRepository extends AbstractRepository
{
  /**
   * Allow a default model to be set for get model function
   */
  const DEFAULT_MODEL = "document";

    /**
     * @var string[]
     */
    protected $models = [
        "document" => Document::class,
        "documentType" => DocumentType::class,
        "documentSubType" => DocumentSubType::class,
        "documentOwnerMapping" => DocumentOwnerMapping::class,
        "category" => Category::class,
        "categoryMapping" => CategoryMapping::class,
        "tender" => Tender::class,
        "documentDefaultCertificates" => DocumentDefaultCertificates::class,
        "documentInstruction" => Instruction::class,
        "documentRequest" => DocumentRequest::class,
        "documentRequestType" => DocumentRequestType::class,
        "documentRequestMapping" => DocumentRequestMapping::class,
        "documentSignatory" => DocumentSignatory::class,
        "documentSignatorySigner" => DocumentSignatorySigner::class,
        "documentSignatoryStatus" => DocumentSignatoryStatus::class,
        "documentProviderFolder" => DocumentProviderFolder::class,
    ];

    /**
     * @return array
     */
  public function constants(): array
  {

    return [
      'status' => [
         1 => 'published',
         2 => 'draft',
      ]
    ];
  }

  /**
   * @param array $data
   */
  public function createCategoryMapping(array $data): void
  {
    $model = $this->getModel('categoryMapping')->newQuery();
    $model->create($data);
  }

  /**
   * @param array $data
   * @throws \Exception
   */
  public function createDocumentOwnerMapping(array $data): void
  {
    $model = $this->getModel('documentOwnerMapping')->newQuery();
    $model->create($data);
  }

  /**
   * @param array $data
   * @return \App\Domain\AbstractModel
   * @throws \App\Domain\DomainException
   */
  public function addDocumentTender(array $data): \App\Domain\AbstractModel
  {
    $tender = $this->getModel('tender');
    $tender->store($data);
    return $tender;
  }

  /**
   * @param array $data
   * @return \App\Domain\AbstractModel
   * @throws \App\Domain\DomainException
   */
  public function addDocumentCategory(array $data): \App\Domain\AbstractModel
  {
    $tender = $this->getModel('category');
    $tender->store($data);
    return $tender;
  }

    /**
     * @param int $id
     * @param int $owner_id
     * @return bool
     */
    public function documentHasOwner(int $id, int $owner_id) {
        $data = $this->getModel()->newQuery()->where(["id" => $id])->with("owner");
        if($data->exists()) {
            $owners = array_map(function($i){ return (int) $i["owner_id"]; }, $data->get()->toArray()[0]["owner"]);
            if($owners && !in_array($owner_id, $owners)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @param Builder $model
     * @param ?string $entity
     * @param ?string $parent
     * @return array
     */
    public function filterByCategory(Builder $model, ?string $entity=null, ?string $parent=null) {
        $data = $model->with("categories")->get()->toArray();
        if($entity || $parent) {
            $results = [];
            foreach ($data as $row) {
                $catTest = ["e"=>[], "p" => []];
                $match = true;
                foreach ($row["categories"] as $cat) {
                    $catTest["e"][] = $cat["entity_id"];
                    $catTest["p"][] = $cat["parent_id"];
                }
                if($entity) {
                    $match = in_array((int)$entity, $catTest["e"]);
                }
                if($match && $parent) {
                    $match = in_array((int) $parent, $catTest["p"]);
                }

                if($match) {
                    $results[] = $row;
                }
            }
            return $results;
        }
        else {
            return $data;
        }
    }
}
