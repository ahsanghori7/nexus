<?php


namespace App\Domain\Traits;

/**
 * Trait LabelTrait
 * @package App\Domain\Traits
 */
trait LabelTrait
{

  use CacheTrait;

  /**
   * @param string $label
   * @return false|int|string
   */
  public function getLabelId(string $label) {
    $cache = $this->getCache();
    foreach($cache as $id => $data) {
      if(strcasecmp($label, $data["label"]) === 0) {
        return $id;
      }
    }
    return false;
  }

}
