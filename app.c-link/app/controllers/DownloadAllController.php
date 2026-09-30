<?php

namespace App\controllers;

use App\Api\Aws\Sns;
use App\core\Config;
use App\core\Environment;
use App\core\Request;
use App\core\Session;

class DownloadAllController extends DownloadController
{
    /**
     * @return bool
     */
    public function isAuthorized(): bool
    {
        return true;
    }

    /**
     * @throws \Exception
     */
    public function beforeAction(): void
    {
        parent::beforeAction();

        $this->removeComponent('Auth');
    }

    /**
     * @return \App\core\Response|void
     */
    public function startupProcess()
    {
    }

    /**
     * @return void
     */
    public function notify_admin(string $token)
    {
        try{
            $success = true;
            $referer = $_SERVER['HTTP_REFERER'] ?? null;
            $env     = Environment::getValue("ENVIRONMENT");
            if($referer && Session::getCsrfToken() === $token && !Environment::isDevelopment()) {
                Sns::send("download_timeout", "Timeout error on $env environment: Download all files from the url $referer");
            }
            else{
                $success = false;
            }
        }catch (\Exception $e){
            $success = false;
            $error   = $e->getMessage();
        }

        echo json_encode(array("success" => $success, 'message' => $error ?? ''));
    }

    /**
     * @param string $type
     * @param int $id
     * @param bool $validate_owner
     * @return void
     * @throws \Exception
     */
    public function tender(string $type, int $id, bool $validate_owner = false)
    {
        try{
            if(Request::getArg("email")) {
                $this->download_all_queue($id, (string)Request::getArg("email"));
            }
        }catch (\Exception $e){
            if(Environment::getValue("ENVIRONMENT") === "development"){
                Sns::send("download_all_add_queue", "Environment: " . Environment::getValue("ENVIRONMENT") . "\nError downloading all files for tender $id: " . $e->getMessage());
            }
            Config::setJsConfig('error_message', $e->getMessage());
        }

        $this->view->setContext(["react_app" => "clink"]);
        $this->view->setContext(["version" => 2]);
        renderLayouts('react');
    }

    /**
     * @param string $type
     * @param int $id
     * @param bool $validate_owner
     */
    public function instruction(string $type, int $id, bool $validate_owner = false)
    {
        parent::instruction("instruction", $id, $validate_owner);
    }

    /**
     * @param string $type
     * @param int $id
     * @param bool $validate_owner
     * @throws \App\Api\Exception
     */
    public function ncr(string $type, int $id, bool $validate_owner = false)
    {
        parent::instruction("ncr", $id, $validate_owner);
    }

    /**
     * @param int $id
     * @return void
     * @throws \Exception
     */
    public function download(int $id)
    {
        parent::document($id);
    }
}
