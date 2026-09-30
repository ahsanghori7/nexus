<?php

return [
    "handlers" => [
        "RouteException" => [function($shape) {
            var_dump($shape->get("routeException")); die();
        }],
        "CriticalSystemException" => [
            function($exception)
            {
                var_dump($exception); die;
            }
        ]
    ]
];
