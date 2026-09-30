<?php

namespace App\Domain\Supplychain;
use App\Domain\Account\SupplyChain;
use App\Domain\AbstractModel;

class Collection {

    /**
     * @var array
     */
    protected array $attributes;

    /**
     * @var SupplyChain
     */
    protected SupplyChain $model;

    /**
     * @var array
     */
    protected array $data;

    /**
     * @var array
     */
    protected array $supplyChainIds = [];

    /**
     * @var int
     */
    protected int $accountOwnerId;

    /**
     * @var int
     */
    protected int $limit;

    /**
     * @var int
     */
    protected int $offset;

    /**
     * @var string
     * Search term for the collection
     */
    protected string $term;

    /**
     * @var string
     */
    protected string $orderBy = 'company';

    /**
     * @var int
     */
    protected int $order = 0;

    /**
     * @var string
     */
    protected ?string $activationStatus;

    /**
     * @var string
     */
    protected ?string $pqqStatus;

    /**
     * @var AbstractModel
     */
    protected AbstractModel $userMappingModel;

    public function __construct(int $accountOwnerId, array $attributes, AbstractModel $userMappingModel, int $limit = 0, int $offset = 0, string $term = "", string $orderBy = "company", int $order = 0, ?string $activated = null, ?string $pqq_status = null) {
        $this->model = new SupplyChain();
        $this->attributes = $attributes;
        $this->accountOwnerId = $accountOwnerId;
        $this->userMappingModel = $userMappingModel;
        $this->limit = $limit;
        $this->offset = $offset;
        $this->term = $term;
        $this->order = $order;
        $this->orderBy = $orderBy;
        $this->activationStatus = $activated;
        $this->pqqStatus = $pqq_status;
    }

    /**
     * @return SupplyChain
     */
    public function getModel() : AbstractModel {
        return $this->model;
    }

    /**
     * @return array
     */
    public function getCollectionData(array $sids = [], bool $associate_array = false) {

        //Get a list of distinct supply chain ids first,
        //without attributes so that the limit offset can be applied correctly
        $ids   = ($sids) ? $sids : $this->getDistinctCollectionIds();
        //The get all the required data for the supply chain
        $data  = $this->model->getSupplyChainAccountsByParentId(
            $this->accountOwnerId, 0,0, $ids, $this->attributes, $this->term, $this->orderBy, $this->order, $this->activationStatus, $this->pqqStatus
        );

        $results = [];

        if(empty($data)) {
            return [];
        }

        foreach($data as $row) {

            if(!isset($results[$row['id']])) {
                $results[$row['id']] = $row;
                unset($results[$row['id']]['attribute']);
                unset($results[$row['id']]['attribute_type']);
            }

            $results[$row['id']][$row['attribute_type']][] = [
                'id' => $row['attribute_id'],
                'label' => $row['attribute']
            ];
        }

        //sort by name
        $order = $this->order;

        if($this->orderBy === 'company') {
            uasort($results, function ($a, $b) use ($order) {
                $cmp = strcasecmp($a['name'], $b['name']);
                return $order === 1 ? -$cmp : $cmp; // 1 = DESC, 0 = ASC
            });
        } else {
            uasort($results, function ($a, $b) use ($order) {
                $cmp = strcasecmp($a['created_at'], $b['created_at']);
                return $order === 1 ? -$cmp : $cmp;
            });
        }


        $supplyChainIds = array_keys($results);

        $users = $this->userMappingModel->getAccountUserMappings($this->accountOwnerId, 'supply_chain', $supplyChainIds);
        foreach($users as $aid => $user) {
            $results[$aid]['users'] = $user;
        }

        if($associate_array){
            return $results;
        }

        return array_values($results);
    }

    /**
     * @param array $supplyChainIds
     * @param array $users
     * @return array
     */
    public function mapUsersToSupplyChain(array $supplyChainIds, array $users) {
        foreach($users as $aid => $user) {
            $supplyChain[$aid]['users'] = $user;
        }
    }

    /**
     * @return int
     */
    public function getCollectionCount() {
        return $this->model->getCollectionCount($this->accountOwnerId, $this->attributes, $this->term, $this->activationStatus, $this->pqqStatus);
    }

    /**
     * @return array
     */
    public function getDistinctCollectionIds() {
        if(!$this->supplyChainIds) {
            $this->supplyChainIds = $this->model->getSupplyChainIds(
                $this->accountOwnerId, $this->attributes, $this->limit, $this->offset, $this->term,
                orderBy: $this->orderBy, order: $this->order, activationStatus: $this->activationStatus,
                pqqStatus: $this->pqqStatus
            );
        }
        return $this->supplyChainIds;
    }
}
