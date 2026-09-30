<?php
declare(strict_types=1);

use DI\ContainerBuilder;

use App\Domain\Account\AccountRepository;

return function (ContainerBuilder $containerBuilder) {
    $containerBuilder->addDefinitions([
        AccountRepository::class => \DI\autowire(DB::class)
    ]);
};
