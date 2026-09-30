<?php

namespace SupplyChain\Model\v2;

use Core\Data\Collection;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Core\Data\Validator;
use SupplyChain\Model\v2\MappingEntities;


use SupplyChain\Model\Abstraction as AbstractModel;

class SupplyChain extends AbstractModel
{
    /**
     * @var array<string, array<string, mixed>>
     */
    protected static array $validationShape = [
        "name"   => ["type" => "string"],
        "email"  => ["type" => "string"],
        "number" => ["type" => "string"],
        "contractor"  => [
            "company"  => ["type" => "string"],
            "name"     => ["type" => "string"],
            "address"  => ["type" => "string"],
            "reg_number"  => ["reg_number" => "string"],
        ],
        "users"  => [
            "isArray" => [Validator::class, "isArrayWithItems"],
            "hasUser" => [
                "name"  => ["type" => "string"],
                "email" => ["type" => "string"]
            ]
        ],
        "trades"  =>  [
            "test" => [
                "areValidTradeIds" => [
                    MappingEntities::class, "isListOfValidIdsByTradeIds"
                ]
            ]
        ],
        "regions" =>  [
            "test" => [
                "areValidRegionIds" => [
                    MappingEntities::class, "isListOfValidIdsByRegionsIds"
                ]
            ]
        ]
    ];

    /**
     * @var string
     */
    protected $table = 'supply_chain';
    // protected $table = 'supply_chain_v2'; // TODO: rename this according to PHINX changes

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        "id",
        'parent_id',
        'child_id',
    ];

    /**
     * @return HasOne
     */
    public function subcontractor(): HasOne
    {
        return $this->hasOne('SupplyChain\Model\Contractor', "id", "child_id");
    }


    /**
     * @return HasMany
     */
    public function history(): HasMany
    {
        return $this->hasMany('SupplyChain\Model\v2\SupplyChainHistory', "supply_chain_id", "id");
    }

    /**
     * @return HasOne
     */
    public function status(): HasOne
    {
        return $this->hasOne('SupplyChain\Model\v2\SupplyChainStatusType', "id", "status_id");
    }

    /**
     * @returnHasMany
     */
    public function user(): HasMany
    {
        return $this->hasMany('SupplyChain\Model\User', "account_id", "child_id");
    }

    /**
     * @param Collection $mapping_types
     * @param int $entity_id
     * @param array $account
     * @param array $entities
     * @return array
     * @throws \Exception
     */
    public static function mapEntitiesTypeByAccount(Collection $mapping_types, int $entity_id, array $account, array &$entities): array
    {
        foreach ($mapping_types->values("label") as $label) {
            if (isset($account['entity']['mapping_type']) && $account['entity']['mapping_type'] === $mapping_types->filterByStringField("label", $label)->getFirst()->get("id")) {
                $entities[$label][$account['group_id']][] = $entity_id;
            }
        }
        return $entities;
    }

    /**
     * @param array $results
     * @param Collection $category_parent
     * @param array $subcontractors
     * @param int $type_id
     * @param string $label
     * @throws \Exception
     */
    public static function mapChainEntitiesSubcontractors(array &$results, Collection $category_parent, array $subcontractors, int $type_id, string $label): void
    {
        if ($category_parent->count()) {
            $category_id = $category_parent->getFirst()->get("category_id");
            if ($category_id) {
                $subcontractors = array_values($subcontractors);
                $results[$category_id][$type_id]['label'] = $label;
                $results[$category_id][$type_id]['chain'] = $subcontractors;
            }
        }
    }

    /**
     * @param array $results
     * @param array $entities
     */
    public static function mapChainEntitiesToCollection(array $entities, array &$results): void
    {
        foreach ($results as &$result) {
            foreach ($result as $sid => &$data) {
                if (isset($data['chain'])) {
                    foreach ($data['chain'] as &$value) {
                        $value['region'] = $entities['regions'][$value['id']] ?? [];
                        $value['trades'] = $entities['trades'][$value['id']]  ?? [];
                    }
                }
            }
        }
    }
}
