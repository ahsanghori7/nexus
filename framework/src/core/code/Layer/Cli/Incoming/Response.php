<?php
namespace Core\Layer\Cli\Incoming;

use Core\Layer\ResponseAbstract;

class Response extends ResponseAbstract
{
    /**
     * @return string
     * @throws \Exception
     */
    public function getContent() : string
    {
        $output  = $this->transport->get("output");
        $action  = $this->transport->get("key");
        if(is_null($output)) {
            if($this->transport->get("is_default")) {
                $output = "No command found \n";
            }
            else {
                $output = "No output from $action command \n";
            }
        }

        if(!is_string($output)) {
            throw new \Exception("Invalid cli response");
        }
        return $output;
    }
}
