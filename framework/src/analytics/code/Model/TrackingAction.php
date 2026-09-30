<?php

namespace Analytics\Model;

use Analytics\Model\Abstraction as AbstractModel;
use Core\Data\Shape;
use DateTime;

class TrackingAction extends AbstractModel
{

    /**
     * @var string
     */
    protected string $action_type = '';

    /**
     * @var string
     */
    protected $item = Shape::class;

    /**
     * @var array
     */
    protected array $data = [];

    /**
     * @var string
     */
    protected $table = 'account_action';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'account_id',
        'account_user_id',
        'related_account_id',
        'related_account_user_id',
        'action_type'
    ];

    /**
     * @var string
     */
    protected $connection = "account_service";

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function type(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->HasOne(TrackingActionType::class, "id", "action_type");
    }

    /**
     * @param string $action_type
     */
    public function setTrackingActionType(string $action_type)
    {
        $this->action_type = $action_type;
    }

    /**
     * @return string
     */
    public function getTrackingActionType()
    {
        return $this->action_type;
    }

    /**
     * @param Shape $item
     */
    public function setTrackingCurrentItem(Shape $item)
    {
        $this->item = $item;
    }

    /**
     * @param string $key
     * @return mixed
     */
    public function getItemData(string $key): mixed
    {
        return $this->item->get($key);
    }

    /**
     * @param string|null $key
     * @return array|mixed
     */
    public function getData(string $key = null)
    {
        return $this->data[$key] ?? $this->data;
    }

    /**
     * @param string $key
     * @param $new_value
     * @return mixed
     */
    public function setDataKey(string $key, $new_value)
    {
        return $this->data[$key] = $new_value;
    }

    /**
     * @param array $data
     * @return array
     */
    public function setData(array $data)
    {
        return $this->data = $data;
    }

    /**
     * @param array $data
     */
    public function prepareActionData(array $data): void
    {
        $this->setData($data);
        $action_type = $this->getTrackingActionType();
        $this->setDataKey($action_type,[
            'average' => [],
            'info'    => [
                'account_id'              => $this->getItemData("account_id"),
                'account_user_id'         => $this->getItemData("account_user_id"),
                'related_account_id'      => $this->getItemData("related_account_id"),
                'related_account_user_id' => $this->getItemData("related_account_user_id"),
                'date'                    => $this->getItemData("action_date"),
            ]
        ]);

        $this->data[$this->getItemData("account_id")][$action_type] = $this->data[$this->getItemData("related_account_id")][$action_type] = $this->getItemData("action_date");
    }

    /**
     * @return array
     */
    public function parseTrackingConfig(): array
    {
        $dates = [];
        $action_type = $this->getTrackingActionType();
        $account_id  = $this->getItemData("account_id");
        $related_id  = $this->getItemData("related_account_id");
        foreach(self::getTrackingConfig() as $t_key => $t_value){
            if($t_key !== $action_type){
                continue;
            }
            if(is_array($relationship = $t_value['relationship'])){
                foreach($relationship as $rel_value){
                    $relationship_key = $rel_value['key'];
                    if(isset($this->data[$related_id][$relationship_key])) {
                        $dates[$t_key] = self::calculateDaysBetweenDates($this->data[$related_id][$relationship_key], $this->data[$account_id][$t_key]);
                        if(!is_null($dates[$t_key])){
                            $this->data[$t_key]['info'][$rel_value['label']]  = (int)$dates[$t_key];
                            $this->data[$t_key]['average'][$relationship_key] += (int)$dates[$t_key];
                        }
                    }
                }
            }
        }
        return $this->data;
    }

    /**
     * @param array $ref
     * @param string $part
     */
    public function getTrackingAverageResponseTime(array $ref, string $part): array
    {
        $data = $this->getData($this->getTrackingActionType());
        foreach ($data['average'] ?? [] as $avg_key => $avg_value) {
            $ref[$part]['average_response_time'] += $avg_value;
        }
        return $ref;
    }

    /**
     * @param array $data
     * @return array
     */
    public function setTrackingAverageDays(array $data): array
    {
        $total = 0;
        array_walk_recursive($data,
            function (&$value, $key) use (&$total) {
                if($key === 'total'){
                    $total = $value;
                }
                if($key === 'average_response_time' && $total){
                    $value = number_format($value / $total, 2). " days";
                }
            }
        );
        return $data;
    }


    /**
     * @param string $start_date
     * @param string $end_date
     * @param string $date_format
     * @return string
     */
    public static function calculateDaysBetweenDates(string $start_date, string $end_date, string $date_format = 'Y-m-d'): string
    {
        $start     = substr($start_date, 0, 10);
        $end       = substr($end_date, 0, 10);
        $date_from = DateTime::createFromFormat($date_format, $end);
        $date_to   = DateTime::createFromFormat($date_format, $start);
        return $date_from->diff($date_to)->format('%a');
    }

    /**
     * @return array
     */
    public static function getTrackingConfig(): array
    {
        return [
            'supply_chain.invite' => [],
            'supply_chain.activation' => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_after_supply_chain_invite'
                    ]
                ],
            ],
            'history.enquiry.sent' => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_after_supply_chain_invite',
                    ],
                    [
                        'key'   => 'supply_chain.activation',
                        'label' => 'days_after_supply_chain_activation'
                    ]
                ]
            ],
            'history.enquiry.accepted' => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_after_supply_chain_invite'
                    ],
                    [
                        'key'   => 'supply_chain.activation',
                        'label' => 'days_after_supply_chain_activation'
                    ],
                    [
                        'key'   => 'history.enquiry.sent',
                        'label' => 'days_after_enquiry'
                    ]
                ]
            ],
            'history.quote.sent' => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_after_supply_chain_invite'
                    ],
                    [
                        'key'   => 'supply_chain.activation',
                        'label' => 'days_after_supply_chain_activation'
                    ],
                    [
                        'key'   => 'history.enquiry.sent',
                        'label' => 'days_after_enquiry'
                    ]
                ]
            ],
            'history.quote.added' => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_after_supply_chain_invite'
                    ],
                    [
                        'key'   => 'supply_chain.activation',
                        'label' => 'days_after_supply_chain_activation'
                    ],
                    [
                        'key'   => 'history.enquiry.sent',
                        'label' => 'days_after_enquiry'
                    ]
                ]
            ],
            'history.quote.removed' => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_after_supply_chain_invite'
                    ],
                    [
                        'key'   => 'supply_chain.activation',
                        'label' => 'days_after_supply_chain_activation'
                    ],
                    [
                        'key'   => 'history.enquiry.sent',
                        'label' => 'days_after_enquiry'
                    ],
                    [
                        'key'   => 'history.quote.sent',
                        'label' => 'days_after_quote_sent'
                    ],
                    [
                        'key'   => 'history.quote.added',
                        'label' => 'days_after_quote_added'
                    ]
                ]
            ],
            'history.quote.awarded'   => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_after_supply_chain_invite'
                    ],
                    [
                        'key'   => 'supply_chain.activation',
                        'label' => 'days_after_supply_chain_activation'
                    ],
                    [
                        'key'   => 'history.enquiry.sent',
                        'label' => 'days_after_enquiry'
                    ],
                    [
                        'key'   => 'history.quote.sent',
                        'label' => 'days_after_quote_sent'
                    ]
                ]
            ],
            'history.quote.awarded_manually' => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_after_supply_chain_invite'
                    ],
                    [
                        'key'   => 'supply_chain.activation',
                        'label' => 'days_after_supply_chain_activation'
                    ],
                    [
                        'key'   => 'history.enquiry.sent',
                        'label' => 'days_after_enquiry'
                    ],
                    [
                        'key'   => 'history.quote.sent',
                        'label' => 'days_after_quote_sent'
                    ],
                    [
                        'key'   => 'history.quote.added',
                        'label' => 'days_after_quote_added'
                    ]
                ]
            ],
            'history.quote.awarded_removed' => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_after_supply_chain_invite'
                    ],
                    [
                        'key'   => 'supply_chain.activation',
                        'label' => 'days_after_supply_chain_activation'
                    ],
                    [
                        'key'   => 'history.enquiry.sent',
                        'label' => 'days_after_enquiry'
                    ],
                    [
                        'key'   => 'history.quote.sent',
                        'label' => 'days_after_quote_sent'
                    ],
                    [
                        'key'   => 'history.quote.added',
                        'label' => 'days_after_quote_added'
                    ]
                ]
            ],
            'history.interest.registered.paid' => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_interest_after_supply_chain_invite'
                    ],
                    [
                        'key'   => 'supply_chain.activation',
                        'label' => 'days_interest_after_supply_chain_activation'
                    ]
                ],
            ],
            'history.interest.registered.free' => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_interest_after_supply_chain_invite'
                    ],
                    [
                        'key'   => 'supply_chain.activation',
                        'label' => 'days_interest_after_supply_chain_activation'
                    ]
                ],
            ],
            'procurement_schedule.added' => [
                'relationship' => [
                    [
                        'key'   => 'supply_chain.invite',
                        'label' => 'days_after_supply_chain_invite',
                    ],
                    [
                        'key'   => 'supply_chain.activation',
                        'label' => 'days_after_supply_chain_activation'
                    ]
                ]
            ],
        ];
    }
}
