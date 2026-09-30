<?php

namespace App\Infrastructure\Persistence;

use Psr\Container\ContainerInterface;

/**
 * Class DB
 * @package App\Infrastructure\Persistence
 */
class DB
{
    /**
     * @var array
     */
  protected static $connections = [];

    /**
     * @var int
     */
  protected static $findAllLimit = 100;

  /**
   * @param string $key
   * @TODO if the key exist dont override it
   * @TODO $connection should be generic interface
   */
  public static function addConnection(string $key, $connection): void
  {
    self::$connections[$key] = $connection;
  }

  /**
   * @return int
   */
  public static function getFindAllLimit(): int
  {
    return self::$findAllLimit;
  }

  /**
   * @param string $connection
   * @TODO validate connection exists
   * @return mixed
   */
  public static function getConnection(string $connection)
  {
    return self::$connections[$connection];
  }

  /**
   * @param string $data the data to compare the column with
   * @param string $column the column from the table to match against
   * @param string $where_condition  the condition for where e.g. AND $column = $data
   * @param string $implode_condition  the condition for joining multiple conditions e.g. ($column = 1 OR $column = 2)
   * @return string
   */
  public static function createSqlWhere(string $data, string $column, string $where_condition = 'AND', string $implode_condition = 'AND'): string
  {
    $sqlWhere = '';
    if(strpos($data,',') !== false){
      $data = explode(",",$data);
      $sqlWhere .= ' '.$where_condition.' (';
      foreach($data as $value){
          //@TODO check for what kind of sanitize we need to do based on the column type
          $value = (int)$value;
          $sqlWhere .= ' `'.$column.'` = '.$value.' '.$implode_condition.' ';
      }
      $sqlWhere = rtrim($sqlWhere,$implode_condition.' ');
      $sqlWhere .= ' )';
    }else{
      $data = (int)$data;
      $sqlWhere .= ' '.$where_condition.' `'.$column.'` = '.$data.' ';
    }
    return $sqlWhere;
  }

}
