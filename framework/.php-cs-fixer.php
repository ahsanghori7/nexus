<?php

$finder = PhpCsFixer\Finder::create()
    ->in('./src')
;

$config = new PhpCsFixer\Config();
return $config->setFinder($finder);
