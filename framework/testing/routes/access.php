<?php

$subtype = $argv[3] ?? false;

if(!$subtype) {
    /** By Default List all sub test and routes */
    $subtests = glob(__DIR__ . "/routes/*.php");

    var_dump($subtests);
    die();

    foreach($subtests as $subtest) {
        echo $subtest . "\n";
    }


    $routes = Router::getRoutes();
    var_dump($routes);
}
else {
    $subtest = __DIR__ . "/$subtype.php";
    if(!is_file($subtest)) {
        exit("No subtype test found in `$subtest`\n");
    }
    require_once($subtest);
}



die();
