<?php
namespace App\core;

class Response {

    public $headers;
    private $content;
    private $version;
    private $statusCode;
    private $statusText;
    private $charset;
    private $file = null;
    private $csv = null;

    private $statusTexts = [
        200 => 'OK',
        302 => 'Found',
        400 => 'Bad Request',
        401 => 'Unauthorized',
        403 => 'Forbidden',
        404 => 'Not Found',
        500 => 'Internal Server Error'
    ];

    private $mimeTypes = [
        'csv'  => ['text/csv', 'application/vnd.ms-excel'],
        'doc'  => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'pdf'  => 'application/pdf',
        'zip'  => 'application/zip',
        'ppt'  => 'application/vnd.ms-powerpoint'
    ];

    public function __construct($content = '', $status = 200, $headers = array()){

        $this->content = $content;
        $this->statusCode = $status;
        $this->headers = $headers;
        $this->statusText = $this->statusTexts[$status];
        $this->version = '1.0';
        $this->charset = 'UTF-8';

    }

    public function send(){

        $this->sendHeaders();

        if ($this->file) {
            $this->readFile();
        } else if ($this->csv) {
            $this->writeCSV();
        } else {
            $this->sendContent();
        }

        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        } elseif ('cli' !== PHP_SAPI) {
            $this->flushBuffer();
        }

        return $this;
    }

    private function flushBuffer(){
        flush();
    }

    /**
     *  Attempt to redirect a user back to wence they came,
     *  else fall back the home page
     *  @ToDo perhaps throw an exception if no referer, or at least log
     */
    public function redirectToReferrer() : void {
        $referer = $_SERVER["HTTP_REFERER"] ?? false;
        if(!$referer) {
            $referer = baseUrl();
        }

        $this->redirect($referer);
     }

    /**
     * @param string $location
     * @return false
     */
    public function redirect($location="")
    {
        if($location) {
            $this->headers["Location"] = $location;
        }

        if(isset($this->headers['Location']) && filter_var($this->headers['Location'], FILTER_VALIDATE_URL) !== FALSE){
            $this->type("text/html");
            $this->clearBuffer();
            $this->sendHeaders();
            echo '<meta http-equiv="refresh" content="0; url='.$this->headers['Location'].'">';
            exit;
        }
        //This should prob throw an error as its pretty sub optimal behaviour to fail from
        //@ToDo Check usage of this function and handle exceptions gracefully

        return false;
    }


    private function sendHeaders(){

        // check headers have already been sent by the developer
        if (headers_sent()) {
            return $this;
        }

        // status
        header(sprintf('HTTP/%s %s %s', $this->version, $this->statusCode, $this->statusText), true, $this->statusCode);

        // Content-Type
        // if Content-Type is already exists in headers, then don't send it
        if(!array_key_exists('Content-Type', $this->headers)){
            header('Content-Type: ' . 'text/html; charset=' . $this->charset);
        }

        // headers
        foreach ($this->headers as $name => $value) {
            header($name .': '. $value, true, $this->statusCode);
        }

        return $this;
    }


    private function sendContent(){
        echo $this->content;
        return $this;
    }

    public function setContent($content = ""){
        $this->content = $content;
        return $this;
    }

    public function type($contentType = null){

        if($contentType === null){
            unset($this->headers['Content-Type']);
        }else{
            $this->headers['Content-Type'] = $contentType;
        }

        return $this;
    }

    public function stop($status = 0){
        exit($status);
    }

    private function readFile(){
        readfile($this->file);
        return $this;
    }

    private function writeCSV(){

        $cols = $this->csv["cols"];
        $rows = $this->csv["rows"];

        $out = fopen("php://output", 'w');

        fputcsv($out, $cols, ',', '"');
        foreach($rows as $row) {
            fputcsv($out, array_values($row), ',', '"');
        }

        fclose($out);
        return $this;
    }

    public function setStatusCode($code){

        $this->statusCode = (int) $code;
        $this->statusText = isset($this->statusTexts[$code]) ? $this->statusTexts[$code] : '';

        return $this;
    }

    private function getMimeType($key){

        if (isset($this->mimeTypes[$key])) {
            $mime = $this->mimeTypes[$key];
            return  is_array($mime) ? current($mime) : $mime;
        }
        return false;
    }

    public function clearBuffer(){

		// check if output_buffering is active
		if(ob_get_level() > 0){
			return ob_clean();
		}
    }

    public function download($path, array $file, array $headers = []){

        $this->file = $path;
        $this->setStatusCode(200);

        if(empty($headers)){

            $mime = $this->getMimeType($file["extension"]);
            if(!$mime){
                $mime = "application/octet-stream";
            }

            $headers = [
                'Content-Description' => 'File Transfer',
                'Content-Type' => $mime,
                'Content-Disposition' => 'attachment; filename="'. $file["basename"].'"',
                'Expires' => '0',
                'Cache-Control' => 'must-revalidate',
                'Pragma' => 'public',
                'Content-Transfer-Encoding' => 'binary',
                'Content-Length' => filesize($path)
            ];
        }

        $this->headers = $headers;
        $this->clearBuffer();
        return $this;
    }

    public function csv(array $csvData, array $file){

        $this->csv = $csvData;
        $this->setStatusCode(200);

        $basename = $file["filename"] . ".csv";
        $headers  = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'. $basename.'"'
        ];

        $this->headers = $headers;
        $this->clearBuffer();
        return $this;
    }
}
