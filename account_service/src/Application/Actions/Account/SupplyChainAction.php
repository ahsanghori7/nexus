<?php


namespace App\Application\Actions\Account;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Account\AccountRepository;
use App\Domain\Trade\CategoryRepository;
use App\Domain\Trade\TradeRepository;
use App\Domain\Region\RegionRepository;
use App\Domain\Account\Account;


class SupplyChainAction extends Action
{
    /**
     * Default content type for account action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * AccountAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new AccountRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function subContractorData(Request $request, Response $response, array $args) {
        $account = $this->repository->getModel()->load($args["id"]);
        $sid     = (int)$args["sid"];
        if($account->isLoaded()) {
            $supplyChain = $this->repository
                ->getModel("supply_chain")
                ->findAll(['parent_id' => $account->getId(), 'child_id' => $sid]);
            $trades = array_column($supplyChain, 'trade_id');
            $exist = !empty($supplyChain);

            $regions = $this->repository
                ->getModel("offering_region_mapping")
                ->findAll(['group_id' => $account->getId(), 'account_id' => $sid]);
            $regions = array_column($regions, 'region_id');
        }
        return $this->respond(
            $response,
            new ActionPayload(200, ['exist' => $exist ?? false, 'trades' => $trades ?? [], 'regions' => $regions ?? []])
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getAll(Request $request, Response $response, array $args) {

        $account = $this->repository->getModel()->load($args["id"]);
        if($account->isLoaded()) {
            $data = [];
            $trades = [];
            if(isset($args["trade"])) {
                $trades = explode(",", $args["trade"]);
            }
            $supplyChain = $this->repository
                ->getModel("supply_chain")
                ->loadByAccount($account, $trades)
                ->mapRegions(new RegionRepository());

            $categories  =  (new CategoryRepository())->findAll();
            $params = $request->getQueryParams();
            $filterEmpty = $params["filter_empty"] ?? false;
            foreach($categories as $catId => $category) {
                $data[$catId] = [
                    "label" => $category["label"],
                    "icon"  => $category["icon"]
                ];
                foreach ($category["trades"] as $trade_id => $trade) {
                    $data[$catId][$trade_id] = [ "label" => $trade, "chain" => [] ];
                    if($chain = $supplyChain->getChainByTrade($trade_id)) {
                        $data[$catId][$trade_id]["chain"] = $chain;
                    }
                    elseif ($filterEmpty) {
                        unset($data[$catId][$trade_id]);
                    }
                }
                if(count($data[$catId]) == 2 && $filterEmpty) {
                    unset($data[$catId]);
                }
            }

            return $this->respond(
                $response,
                new ActionPayload(200, $data)
            );
        }
        return $this->notFound($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getSupplyChainByAccountId(Request $request, Response $response, array $args) {

        $account = $this->repository->getModel()->load($args["id"]);
        if($account->isLoaded()) {
            $supplyChain = $this->repository->getModel("supply_chain")->getSupplyChainByAccountId($args["id"]);
            return $this->respond(
                $response,
                new ActionPayload(200, $supplyChain)
            );
        }
        return $this->notFound($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getAllSupplyChain(Request $request, Response $response, array $args)
    {

        $sp = $this->repository->getModel("supply_chain");
        $sql = "SELECT * FROM " . $sp->getName();
        $data = [];
        if (method_exists($sp->getDB(), 'getAll')) {
            $data = $sp->getDB()::getAll($sql);
        }

        return $this->respond(
            $response,
            new ActionPayload(200, $data)
        );
    }

    /**
     * @return mixed
     * @throws \Exception
     */
    public function getMappedRegions(array $ids) {
        return (new RegionRepository())->getMappings($ids, "supply_chain");
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * Possibly redundant as mapTrades is more efficient and versatile
     */
    public function addSub(Request $request, Response $response, array $args)
    {
        $account = $this->repository->getModel()->load($args["id"]);
        if($account->isLoaded()) {
            $data = $this->getData();
            if(!$data) {
                $this->badRequest($response);
            }
            $child = $this->repository->getModel()->load($data["child"] ?? 0);
            $trade = (new TradeRepository())->getModel()->load($data["trade"] ?? 0);
            if(!$child->isLoaded() || !$trade->isLoaded()) {
                return $this->notFound($response);
            }

            $this->repository->getModel("supply_chain")->save([
                "parent_id" => $account->getId(),
                "child_id"  => $child->getId(),
                "trade_id"  => $trade->getId()
            ]);

            return $this->noContent($response);
        }

        return $this->notFound($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @throws \Exception
     */
    public function addExternal(Request $request, Response $response, array $args) {
        $account = $this->repository->getModel()->load($args["id"]);
        if($account->isLoaded()) {
            $data = $this->getData();
            if (!$data) {
                return $this->invalidJson($response);
            }
            $name = $data["name"] ?? "";
            if(!$name) {
                return $this->invalidJson($response);
            }

            $existing = $this->repository->getModel()->load($name, "name");
            if(!$existing->isLoaded()) {
                $data["type_id"] = $this->repository->getModel()->getTypeModel()->getLabelId("external_subcontractor");
                $sub = $this->repository->getModel()->save($data);
                $userId = null;
                if (isset($data["user"])) {
                    $userId = $sub->createUser($data["user"])->getId();
                }
            }
            else{
                $sub    = $existing;
                $userId = $existing->loadUsers()->getAccountHolder()->getId();
            }

            $this->updateExternalMeta($sub, $account->getId(), $data);
            return $this->respond(
                $response,
                new ActionPayload(200,
                    ["id" => $sub->getId(), 'user_id' => $userId]
                )
            );
        }
        return $this->notFound($response);
    }

    /**
     * @param Account $external
     * @param int $ownerId
     * @param array $data
     */
    public function updateExternalMeta(Account $external, int $ownerId, array $data) {
        $json = $external->getData("meta");
        if(!$json) {
            $meta = [];
        }
        else {
            $meta = json_decode($json, true);
        }
        $meta[$ownerId] = $data;
        $external->save(["meta" => json_encode($meta)]);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function updateExternal(Request $request, Response $response, array $args) {
        $sub = $this->repository->getModel()->load($args["child"]);
        if($sub->isOfType("external_subcontractor")) {
            if($this->repository->getModel("supply_chain")->exists($args["id"], $sub->getId())) {
                $data = $this->getData();
                if($data) {
                    $this->updateExternalMeta($sub, (int)$args["id"], $data);
                    return $this->noContent($response);
                }
                else {
                    return $this->invalidJson($response);
                }
            }
        }
        return $this->notFound($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     */
    public function deleteSub(Request $request, Response $response, array $args) {
        $account = $this->repository->getModel()->load($args["id"]);
        if($account->isLoaded()) {
            $supply = $this->repository->getModel("supply_chain");
            $child = (int) $args["child"];

            $supply->deleteWhere([
                "parent_id" => $account->getId(),
                "child_id"  => $child
            ]);

            return $this->noContent($response);
        }
        return $this->notFound($response);
    }

    /**
     * Takes a lise of region ids and attempts to create a mapping between them and a supply chain
     * relationship of a main contractor and a subcontractor
     * Request data examples:
     * PATCH JSON { "regions" : [1,2,3,4] }
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function mapRegion(Request $request, Response $response, array $args) {

        $account = $this->repository->getModel()->load($args["id"]);
        if($account->isLoaded()) {
            $child = $this->repository->getModel()->load($args["child"]);
            if($child->isLoaded()) {
                $data = $this->getData();
                if(!$data || !isset($data["regions"]) || !is_array($data["regions"])) {
                    return $this->invalidJson($response);
                }
                $params = $request->getQueryParams();
                (new RegionRepository())->map(
                    $child->getId(),
                    $data["regions"],
                    "supply_chain",
                    $account->getId(),
                    isset($params["add_only"])
                );
                return $this->noContent($response);
            }
        }
        return $this->notFound($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function mapTrades(Request $request, Response $response, array $args) {
        $account = $this->repository->getModel()->load($args["id"]);
        if($account->isLoaded()) {
            $sub = $this->repository->getModel()->load($args["child"]);
            if($sub->isLoaded()) {
                $data = $this->getData();
                if(!$data || !isset($data["trades"])) {
                    return $this->badRequest($response);
                }

                $failed = [];
                $params = $request->getQueryParams();
                $model = $this->repository->getModel("supply_chain");
                if(!isset($params["add_only"])){
                    $model->clean($account->getId(), $sub->getId());
                }
                $model->mapTrades($account->getId(), $sub->getId(), $data["trades"], $failed);
                //Failed it set by the mapTrades method by reference in an exception try catch, php stan does not understand this
                // @phpstan-ignore-next-line
                if(!empty($failed)) {
                    $message = sprintf("Invalid Trade Ids (%s)", implode(",", $failed));
                    return $this->respond(
                        $response,
                        new ActionPayload(500, ["error" => ["message" => $message]])
                    );
                }
                return $this->noContent($response);
            }
        }
        return $this->notFound($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     */
    public function getAddedToContractors(Request $request, Response $response, array $args) {
        $sub = $this->repository->getModel("supply_chain")->all(['child_id' => $args["id"]]);
        $contractors = [];
        array_map(function($item) use (&$contractors){
            $contractors[$item['parent_id']] = [
                'contractor' => $item['parent_id'],
                'created_at' => $item['added_to_date']
            ];
        }, $sub);
        return $this->respond(
            $response,
            new ActionPayload(200,
                ["contractors" => $contractors]
            )
        );

    }

}
