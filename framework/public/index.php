<?php

$appName = $_SERVER["APP"] ?? false;
define("APP", $appName);
require_once("../init.php");
require_once(sprintf("%s%sindex.php", APP_ROOT, DS));
