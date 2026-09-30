<?php

namespace SupplyChain\Model;

use SupplyChain\Model\Abstraction as AbstractModel;
use SupplyChain\Model\Contractor;

class ContractorType extends AbstractModel
{
    /**
     * @var string
     */
    protected $table = 'account_type';

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
        'label'
    ];

    /**
     * @param \SupplyChain\Model\Contractor $contractor
     * @param string $typeLabel
     * @return bool
     */
    public function isType(Contractor $contractor, string $typeLabel) : bool {
        $data = $contractor->toArray();
        if($data["type_id"]) {
            /** PHP stan fails to understand that where is a magic method of the EloquentModel */
            /** @phpstan-ignore-next-line */
            $label = $this->where("id", (int) $data["type_id"])
                ->first()
                ->toArray()["label"];
            return (strcasecmp($label, $typeLabel) === 0);
        }
        return false;
    }
}
