<?php

use Core\Router;
$subtype = $argv[3] ?? false;

if(!$subtype) {
    /** By Default List all sub test and routes */
    $subtests = glob(__DIR__ . "/routes/*.php");

    echo "Tests:\n";
    foreach($subtests as $subtest) {
        $subtest = str_replace([__DIR__ . "/routes/", ".php"], "", $subtest);
        echo " - " . $subtest . "\n";
    }

    $routes = Router::getRoutes();

    echo "Routes:\n";

    foreach($routes as $route => $routeData) {

        print_r($routeData);
        die();
        echo " - " . $route . "\n";
    }


}
else {
    $subtest = __DIR__ . "/$subtype.php";
    if(!is_file($subtest)) {
        exit("No subtype test found in `$subtest`\n");
    }
    require_once($subtest);
}



die();
