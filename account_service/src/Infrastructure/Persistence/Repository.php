<?php

namespace App\Infrastructure\Persistance;

interface Repository {


  public function findAll(): array;


    /**
     * @param int $id
     */
  public function findById(int $id): void;

  /**
   * @param int $id
   * @return bool
   */
  public function deleteById(int $id): bool;

  /**
   * @param array $args
   * @return bool
   */
  public function create(array $args): bool;

  /**
   * @param int $id
   * @param array $args
   * @return bool
   */

  public function updateById(int $id, array $args): bool;
}
