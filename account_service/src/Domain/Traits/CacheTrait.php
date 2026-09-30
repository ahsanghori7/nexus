<?php

namespace App\Domain\Traits;

/**
 * Trait CacheTrait
 * @package App\Domain\Traits
 */
trait CacheTrait
{
  protected $cache;

  /**
   * @return mixed
   */
  public function getCache()
  {
    if(!$this->cache)
    {
      $data = $this->all();
      foreach($data as $k => $v)
      {
        $this->cache[$v['id']] = $v;
      }
    }
    return $this->cache;
  }
}
