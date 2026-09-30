<?php

declare(strict_types=1);

use App\Cli\Cli;

require_once("bootstrap.php");

$app = new App\core\App();
$cli = new Cli;
$cli->handle('script');
