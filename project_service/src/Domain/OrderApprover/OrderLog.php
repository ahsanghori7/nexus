<?php


declare(strict_types=1);

namespace App\Domain\OrderApprover;

use App\Domain\AbstractModel;

class OrderLog extends AbstractModel
{
  /**
   * Indicates if the model should be timestamped.
   *
   * @var bool
   */
  public $timestamps = false;

  /**
   * The table associated with the model.
   *
   * @var string
   */
  protected $table = 'order_logs';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
    protected $fillable = [
        'user_id',
        'transaction_id',
        'type',
        'meta',
    ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'user_id' => [
      'type' => 'int',
      'required' => true
    ],
    'transaction_id' => [
      'type' => 'int',
      'required' => true
    ],
    'type' => [
      'type' => 'string',
      'required' => false,
    ],
    'meta' => [
      'type' => 'string',
      'required' => false,
    ]
  ];

  /**
   * Format a UTC datetime value into Europe/London timezone.
   *
   * @param string|null $value
   * @return string|null Returns original value if empty, formatted string otherwise
   */
  private function formatUtcToLondon(?string $value): ?string
  {
    if (!$value) {
      return $value;
    }
    $dt = \DateTime::createFromFormat('Y-m-d H:i:s', (string)$value, new \DateTimeZone('UTC')) ?: new \DateTime((string)$value, new \DateTimeZone('UTC'));
    $dt->setTimezone(new \DateTimeZone('Europe/London'));
    return $dt->format('Y-m-d H:i:s');
  }

  /**
   * Convert UTC timestamps from DB to Europe/London on read.
   */
  public function getCreatedAtAttribute(?string $value): ?string
  {
    return $this->formatUtcToLondon($value);
  }

  public function getUpdatedAtAttribute(?string $value): ?string
  {
    return $this->formatUtcToLondon($value);
  }
}
