<?php
namespace App\core;

use App\core\Config;

//Err, why do we set a header here!
header('Content-Type: text/html; charset=utf-8');

class Logger{

    protected static $default_logfolder = 'app/log';
    protected static $default_logfile = 'log.txt';

    private function __construct(){}

    public static function getLogFolder(){

        try{
            $logFolder = Config::get('debug.log.path');
        } catch(\Exception $e){
            $logFolder = realpath('../') . "/" . self::$default_logfolder;
        }

        return $logFolder;
    }

    public static function getLogFile(){

        $logFolder = self::getLogFolder();

        try{
            $logFile = Config::get('debug.log.file');
        } catch(\Exception $e){
            $logFile = self::$default_logfile;
        }

        return str_replace("//", "/", $logFolder . "/" . $logFile);
    }

    public static function log($header="", $message="", $filename="", $linenum=""){


        $logFolder = self::getLogFolder();
        $logPathFile = self::getLogFile();

        if(!is_dir($logFolder)){
            if(!mkdir($logFolder, 0777)){
                return false;
            }
        }

        if(!file_exists($logPathFile)){
            file_put_contents($logPathFile,"");
        }

        $date = date("d/m/Y G:i:s");
        $err = $date." | ".$filename." | ".$linenum." | ".$header. "\n";

        $message = is_array($message)? implode("\n", $message): $message;
        $err .= $message . "\n*******************************************************************\n\n";

        // log/write error to log file
        error_log($err, 3, $logPathFile);
        return true;
     }
 }
