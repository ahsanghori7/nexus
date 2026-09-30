<?php
declare(strict_types=1);

use DI\Container;
use \RedBeanPHP\R;

use App\Infrastructure\Persistence\DB;
use App\Infrastructure\Environment as Env;

$dsn = sprintf("%s:host=%s;dbname=%s;",
    Env::getValue("DB_TYPE", "mysql"),
    Env::getValue("DB_HOST", "0.0.0.0"),
    Env::getValue("DB_NAME", "account_service")
);

$user = Env::getValue("DB_USER");
$pass = Env::getValue("DB_PASSWORD");

R::setup($dsn, $user, $pass);
DB::addConnection('r', R::class);

/*
 * Redbean fix for tables with the prefix "_"
 * https://www.redbeanphp.com/index.php?p=/prefixes
 */
R::ext('xdispense', function( $type ){
  return R::getRedBean()->dispense( $type );
});


$options = [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_PERSISTENT => false,
  PDO::ATTR_EMULATE_PREPARES => false,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8 COLLATE utf8_unicode_ci"
];

DB::addConnection('pdo', new \PDO($dsn. "charset=utf8;", $user, $pass, $options));
