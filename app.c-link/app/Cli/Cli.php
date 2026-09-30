<?php

namespace App\Cli;

class Cli
{

  /**
   * @param string $type
   * @throws \Exception
   */
    public function handle(string $type = 'cron'): void
    {
        global $argv;

        $domain = $argv[1] ?? false;
        if(!$domain)
        {
            throw new \Exception('Missing argument domain');
        }

        $cls = sprintf('App\%s\%s', ucfirst($type), $domain);
        if(!class_exists($cls))
        {
            throw new \Exception('Invalid domain');
        }

        $method = $argv[2] ?? 'index';
        if(!method_exists($cls, $method)){
            throw new \Exception('Invalid method');
        }

        (new $cls())->$method();
    }
}
