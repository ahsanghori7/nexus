<?php
namespace Core\Layer\Http\Incoming;

use Core\Layer\ResponseAbstract;
use Core\System\Control;
use Core\Data\Shape;

class Response extends ResponseAbstract
{
    /**
     * @return string
     * @throws \Exception
     */
    public function getContent() : string
    {
        $headers = $this->transport->getShape("headers")->toArray();
        $output  = "";
        foreach(["html" => "text/html", "json" => "application/json"] as $id => $type) {
            if($data = $this->transport->get($id)) {
                $headers["Content-Type"] = $type;
                $output = strval($data);
            }
        }

        Control::callHandler("PreHTTPResponseMiddleware", new Shape(["output" => $output, "response" => $this]));
        foreach ($headers as $header => $value) {
            header(sprintf("%s: %s", strval($header), strval($value)));
        }
        return $output;
    }
}
