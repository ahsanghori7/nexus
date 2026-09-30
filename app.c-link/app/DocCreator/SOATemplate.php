<?php

namespace App\DocCreator;

class SOATemplate extends TableTemplate
{
    /**
     * @var string
     */
    public const TABLE_TEMPLATE = 'soa';

    /**
     * @var array|string[]
     */
    public static array $shortcodes = [
        'ScheduleAttendancesTemplate'
    ];
}
