<?php
declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractTypeModel;
use App\Domain\Website\Website;

/**
 * Class Account
 * @package App\Domain\Account
 */
class Subscription extends AbstractTypeModel
{
    const FREE_TRIAL = "Free Trial";

    /**
     * @var array
     */
    protected $columns = [
        'label' => [
            'type' => 'string',
            'required' => true
        ],
        "website_id" => [
            "type" => 'int',
            "required" => true
        ],
        "uid" => [
            "type" => 'string',
            "required" => true
        ],
        'price' => [
            'type' => 'int',
            'required' => true
        ],
        "price_label" => [
            "type" => 'string',
            "required" => true
        ],
        "interval_type" => [
            "type" => 'string',
            "required" => true
        ],
        "interval_unit" => [
            "type" => 'string',
            "required" => true
        ],
        "interval_amount" => [
            "type" => 'string',
            "required" => true
        ],
        "expires" => [
          "type" => 'int',
          "required" => false
        ]
    ];

    /**
     * Short cut for getting Free trial id
     * @return false|int|string
     */
    public function getFreeTrialId() {
        return $this->getLabelId(self::FREE_TRIAL);
    }

  /**
   * @return array|int|mixed
   */
    public function getExpiryDays()
    {
      return $this->getData('expires') ?? 0;
    }

  /**
   * @param int $days
   * @return false|string
   */
    public function getExpirationDateByDays(int $days)
    {
      return date('Y-m-d H:i:s', strtotime(date("Y-m-d H:i:s"). ' + '.$days.' days'));
    }

    /**
     * After a successful load, allow a model to perform an action
     */
    public function afterLoad($id) {
        $this->children["website"] = (new Website())->load($this->data["website_id"]);
    }
}
