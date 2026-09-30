<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Autoload
|--------------------------------------------------------------------------
*/

require(dirname(__DIR__) . "/vendor/autoload.php");
require(dirname(__DIR__) . "/vendor/autoload.php");

define('BASE_DIR', str_replace("\\", "/", dirname(__DIR__)));
define('APP',  BASE_DIR . "/app/");

define('SITE_NAME',  'App C-Link');



try {
    \App\core\Environment::loadEnvFile(BASE_DIR);
} catch (Exception $e) {
    echo $e->getMessage();
    die;
}


define('SITE_URL', \App\core\Environment::getValue("APP_CLINK_URL", 'http://app.c-link.local'));
//We should move all of these to a routes file or config
define("DASHBOARD_URL", SITE_URL . "/main-contractor");
define('NAVBAR_ICON', \App\core\Environment::getValue("NAVBAR_ICON", false));
define('COMMS_URL', \App\core\Environment::getValue("COMMS_URL", 'http://app.c-link.local:3000'));

if (!file_exists(APP . 'config/config.php')) {
    die('No config file');
}
//Load language control class
require_once(APP . 'config/language.php');
/*
|--------------------------------------------------------------------------
| Register Error & Exception handlers
|--------------------------------------------------------------------------
|
| Here we will register the methods that will fire whenever there is an error
| or an exception has been thrown.
|
*/

App\core\Handler::register();

/*
|--------------------------------------------------------------------------
| Start Session
|--------------------------------------------------------------------------
|
*/

App\core\Session::init();

/*
|--------------------------------------------------------------------------
| Create The Application
|--------------------------------------------------------------------------
|
| Here we will create the application instance which will take care of routing
| the incoming request to the corresponding controller and action method if valid
|
*/
try {
    $app = new App\core\App();
} catch (\Exception $e) {
    print_r($e);
    die("Exception");
} catch (\Throwable $t) {
    print_r($t);

    die("Error");
}


define('PUBLIC_ROOT', $app->request->root());
define('FILES_PATH',  PUBLIC_ROOT . "/");

//**
// Allow a user to be auto logged in for development mode
// **/
$config = config();
if ($config["debug"]["auto_login"]) {
    $debug = require_once("../app/config/debug.php");
    $user = $debug["user"];
    App\Factory\UserFactory::setAutoUser(
        $user["id"],
        $user["aid"],
        $user["token"],
        $user["data"]
    );
}

/*
|--------------------------------------------------------------------------
| Run The Application
|--------------------------------------------------------------------------
|
| Once we have the application instance, we can handle the incoming request
| and send a response back to the client's browser.
|
*/


$app->run();
