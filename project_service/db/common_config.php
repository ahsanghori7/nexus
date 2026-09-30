<?php

function getComonConfig() {
    return [
        "generic_table_config" => [
            'engine' => 'InnoDB',
            'collation' => 'latin1_general_ci',
            'id' => false,
            'primary_key' => ['id']
        ]
    ];
}
