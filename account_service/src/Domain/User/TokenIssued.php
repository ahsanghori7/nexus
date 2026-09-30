<?php

namespace App\Domain\User;

use App\Domain\AbstractTypeModel;
use DateTime;

/**
 * Class TokenIssued
 * @package App\Domain\User
 */
class TokenIssued extends AbstractTypeModel{

  /**
   * @var array
   */
  protected $columns = [
    'account_id',
    'token_amount',
    'cost',
  ];

  /**
   * @param array $filters
   * @throws \Exception
   */
  public function applyFilters(string $sql, array $filters) : string {

    $sql = parent::applyFilters($sql, $filters);

    $clauses = [];

    /*
     * Filter by start date
     */
    if(isset($filters['start_date'])){
      $clauses[] = "CAST(timestamp AS Date) >= '".$filters['start_date']."'";
    }

    /*
     * Filter by end date
     */
    if(isset($filters['end_date'])){
      $clauses[] = "CAST(timestamp AS Date) <= '".$filters['end_date']."'";
    }

    /*
     * Filter by token type
     * Type Free - cost = 0
     * Type Paid - cost > 0
     */
    if(isset($filters['token_type'])){
      $clauses[] = ($filters['token_type'] === 'free') ? 'cost = 0' : 'cost > 0';
    }

    if($clauses){
      $sql .= $this->sql_filters ? ' AND ' : ' WHERE ';
      $sql .= implode(" AND ", $clauses);
    }

    return $sql;
  }
}
