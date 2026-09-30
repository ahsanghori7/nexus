<?php
require 'vendor/autoload.php';

use Phinx\Config\Config;
use Phinx\Migration\Manager;
use Symfony\Component\Console\Input\StringInput;
use Symfony\Component\Console\Output\NullOutput;
use Phinx\Util\Util;


global $argv;
if ( count($argv) < 2 ) {
    exit("Missing Arguments\n");
}

$env = $argv[1];
$phinx_file = $argv[2] ?? null;
if ( !$env ) {
    exit("No environment supplied\n");
}

class Fixtures{

    /**
     * @var Manager
     */
    public Manager $manager;

    /**
     * @var Config
     */
    public Config $config;

    /**
     * @var string
     */
    public string $phinx_migrations_path = '';

    /**
     * @param string $environment
     * @return void
     */
    public function phinx(string $environment): void
    {
        $configArray = require('phinx.php');
        $this->phinx_migrations_path = $configArray['fixtures']."/migrations/".$environment;
        $configArray['paths']['migrations'] = $this->phinx_migrations_path;
        $this->config  = new Config($configArray);
        $this->manager = new Manager($this->config, new StringInput(' '), new NullOutput());
    }

    /**
     * @return Config
     */
    public function getPhinxConfig(): Config
    {
        return $this->config;
    }

    /**
     * @return string
     */
    public function getPhinxMigrationsPath(): string
    {
        return $this->phinx_migrations_path;
    }

    /**
     * @param string $path
     * @param string $file
     * @return int
     * @TODO unittest this
     */
    public function getVersionFromFile(string $path, string $file): int
    {
        foreach(Util::getFiles($path) as $files){
            $parts = explode("_", str_replace($path,"", $files));
            $parts[0] = trim($parts[0],"/");
            $version_id = (int)$parts[0];
            unset($parts[0]);
            $file_phinx = implode("_", $parts);
            if($file_phinx === $file . ".php"){
                return $version_id;
            }
        }
        return 0;
    }

    /**
     * @param string $file
     * @return string
     */
    public function getMigrationNameFromFile(string $file): string
    {
        return str_replace(' ', '', ucwords(str_replace('_', ' ', $file)));
    }

    /*
     * This is remove the entry from the phinxlog
     * so the migration can run infinitely
     */
    public function resetMigrationByFile(PDO $pdo, string $file, string $version): void
    {
        $name = $this->getMigrationNameFromFile($file);
        $stmt = $pdo->prepare("DELETE FROM phinxlog WHERE version = :version and migration_name = :migration_name");
        $stmt->bindParam(':version', $version);
        $stmt->bindParam(':migration_name', $name);
        $stmt->execute();
    }

    /**
     * @param string $environment
     * @param string $file
     * @return void
     */
    public function migrate (string $environment, string $file = ''): void
    {
        $this->phinx($environment);
        $config = $this->getPhinxConfig();
        $pdo_config = $config['environments']['main'];
        $db = $pdo_config['name'];
        $host = $pdo_config['host'];
        $charset = $pdo_config['charset'];
        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        $pdo = new \PDO($dsn, $pdo_config['user'], $pdo_config['pass']);
        $version = $this->getVersionFromFile($this->getPhinxMigrationsPath(), $file);
        if($file) {
            $this->resetMigrationByFile($pdo, $file, $version);
            $this->manager->migrate('main', $version);
        }else{
            $this->manager->migrate('main');
        }
    }

}

(new Fixtures())->migrate($env, $phinx_file ?? '');
