<?php
declare(strict_types=1);

namespace App\Domain\User;

use App\Domain\AbstractRepository;

class RoleMappingRepository extends AbstractRepository
{
    protected $models = [
        'roleMapping' => RoleMappings::class
    ];

    public function getModel(string $model = 'roleMapping')
    {
        $cls = $this->models[$model] ?? false;
        if (!$cls) {
            throw new \Exception("Invalid model $model");
        }
        return new $cls();
    }
}
