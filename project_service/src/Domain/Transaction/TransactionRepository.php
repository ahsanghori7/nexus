<?php

declare(strict_types=1);

namespace App\Domain\Transaction;

use App\Domain\AbstractRepository;

/**
 * Class ProjectRepository
 * @package App\Domain\Project
 */
class TransactionRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "transaction";

    /**
     * @var string[]
     */
    protected $models = [
        "transaction" => Transaction::class,
        "transactionType" => TransactionType::class,
        "transactionDocument" => TransactionDocument::class,
    ];

}
