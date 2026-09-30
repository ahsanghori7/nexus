<?php


namespace App\Application\Actions\Account\SupplyChain;

use App\Infrastructure\Action\Paginator as CorePaginator;
use App\Domain\Supplychain\Collection;
use Psr\Http\Message\ServerRequestInterface as Request;

class Paginator extends CorePaginator
{
    /**
     * @var Collection
     */
    protected Collection $collection;

    /**
     * Paginator constructor.
     * @param Request $request
     * @param AbstractModel $model
     */
    public function __construct(Request $request, Collection $collection)
    {
        $this->collection = $collection;
        parent::__construct($request, $collection->getModel());
    }

    /**
     * @return int
     */
    public function getModelCount(): int
    {
        if (is_null($this->modelCount)) {
            $this->modelCount = $this->collection->getCollectionCount();
        }

        return $this->modelCount;
    }
}
