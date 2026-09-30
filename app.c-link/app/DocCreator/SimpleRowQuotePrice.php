<?php
namespace App\DocCreator;

class SimpleRowQuotePrice extends Table{

    /**
     * @var int
     */
    public CONST VAT = 20;

    /**
     * @var string[]
     */
    public array $column = [
        'description',
        'total'
    ];

}
