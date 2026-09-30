<?php

namespace App\Domain\User;

use App\Domain\AbstractTypeModel;

/**
 * Class TokenUsed
 * @package App\Domain\User
 */
class TokenUsed extends AbstractTypeModel{

  /**
   * @var array
   */
  protected $columns = [
    'account_id',
    'user_id',
    'project_id',
    'token_type',
    'created_at',
  ];

  /**
   * @param array|string[] $cols
   * @return string
   * @throws \ReflectionException
   */
  public function getSelect (array $cols = ["*"]): string
  {
    $columns = ['used.*'];
    $sql = sprintf("SELECT %s FROM %s",
      implode(",", $columns), $this->getName() . " used"
    );
    return $sql;
  }

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
      $clauses[] = "CAST(created_at AS Date) >= '".$filters['start_date']."'";
    }

    /*
     * Filter by end date
     */
    if(isset($filters['end_date'])){
      $clauses[] = "CAST(created_at AS Date) <= '".$filters['end_date']."'";
    }

    if($clauses){
      $sql .= $this->sql_filters ? ' AND ' : ' WHERE ';
      $sql .= implode(" AND ", $clauses);
    }

    return $sql;
  }

  /**
   * @param array $filters
   * @param int $limit
   * @param int $offset
   * @param bool $assoc_array
   * @return array
   * @throws \Exception
   */
  public function findAll(array $filters = [], int $limit = 0, int $offset = 0, bool $assoc_array = false): array
  {
     $result = parent::all($filters);
     /*
      * Allow filter by user_id
      */
     if(isset($filters['user_id'])){
        $result = array_filter($result, function($i) use ($filters){
           if($i['user_id'] === $filters['user_id']) {
             return $i;
           }
        });
     }
     if(isset($filters['account_id'])) {
         $result = array_filter($result, function ($i) use ($filters) {
             if ( $i['account_id'] === $filters['account_id'] ) {
                 return $i;
             }
         });
     }

     return $result;
  }

}
