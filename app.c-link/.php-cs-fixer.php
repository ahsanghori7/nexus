<?php

$finder = PhpCsFixer\Finder::create()
    ->in('./app')
;

$config = new PhpCsFixer\Config();
return $config->setFinder($finder);
