<?php
declare(strict_types=1);

namespace App\Domain\Trade;

use App\Domain\AbstractRepository;

use App\Domain\Trade\Category;
/**
 * Class CategoryRepository
 * @package App\Domain\Trade
 */
class CategoryRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "category";

    /**
     * @var string[]
     */
    protected $models = [
        "category" => Category::class
    ];

    /**
     * @param array $filters
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function findAll (array $filters = [], int $limit = 0, int $offset=0): array
    {
        $data =  $this->getModel()->findAll($filters, $limit, $offset);
        $cats = [];
        foreach($data as $row) {
            $cid = $row["cat_id"];
            $tid = $row["trade_id"];
            if(!isset($cats[$cid])) {
                $cats[$cid] = [
                    "trades" => [],
                    "label"  => $row["cat"],
                    "icon" => $row['icon'],
                    "rules" => $row['rules'],
                    "category_id" => $cid
                ];
            }
            $cats[$cid]["trades"][$tid] = trim($row["trade"]);
        }
        return $cats;
    }
}
