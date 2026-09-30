<?php

namespace App\Infrastructure\Action;

use Psr\Http\Message\ServerRequestInterface as Request;
use App\Domain\AbstractModel;

class SqlPaginator extends Paginator
{

    protected string $sql = "";

    protected int $countCache;

    /**
     * Paginator constructor.
     * @param Request $request
     * @param AbstractModel $model
     */
    public function __construct(Request $request, AbstractModel $model, string $sql)
    {
        parent::__construct($request, $model);
        $this->sql = $sql;
    }

    /**
     * @return int
     * @throws \Exception
     */
    public function getCount(): int
    {
        if(!isset($this->countCache)) {
            if(method_exists($this->model->getDB(),'getRow')) {
                $count = $this->model->getDB()::getRow($this->sql);
                $this->countCache = $count["c"] ?? 0;
            }
        }
        return  $this->countCache;
    }

    /**
     * @return array
     */
    public function getLinks()
    {
        return [
            "next" => $this->getLink("next"),
            "prev" => $this->getLink("prev"),
            "page" => $this->getCurrentPage(),
            "per_page" => $this->getLimit(),
            "pages" => $this->getTotalPages(),
            "total" => $this->getCount()
        ];
    }

    /**
     * @return false|float|int|mixed|\Services_JSON_Error|string|void
     */
    public function jsonSerialize() : mixed
    {
        return $this->getLinks();
    }

}
