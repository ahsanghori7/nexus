<?php

namespace App\Utility;

/**
 * Utitliy Class to Handle File Uploads
 */

class Upload
{
    protected $mimes = [
        "application" => [
            "pdf", "doc", "xlsx", "docx", "odt", "dotx"
        ],
        "image" => [
            "png", "jpg", "gif",
        ],
        "text/plain" => [
            "txt"
        ],
        "application/acad" => ["dwg"],
        "application/excel" => ["xlm","xls"]
    ];


    /**
     * @var array
     */
    protected $file = [];

    public function __construct($upload) {
        $this->file = $upload;
    }

    /**
     * @return array
     */
    public function getFile() : array {
        return $this->file;
    }

    /**
     * @return string
     */
    public function getName() : string {
        return $this->file["name"];
    }

    /**
     * @return string
     */
    public function getExt() : string {
        $parts = explode(".", $this->file["name"]);
        return array_pop($parts);
    }

    /**
     * @return string
     */
    public function getType() : string {
        $type = $this->file["type"];
        if($type === "*/*") {
            $replacement = null;
            $ext = $this->getExt();
            foreach($this->mimes as $type => $exts) {
                if(in_array($ext, $exts)) {
                    $replacement = (strpos($type, "/")) ? $type : $type."/".$ext;
                }
            }
            if(!$replacement) {
                $replacement = "application/$ext";
            }
            $type = $replacement;
        }

        return $type;
    }

    /**
     * @return string
     */
    public function getPath() : string {
        return $this->file["tmp_name"];
    }

    /**
     * @return mixed
     */
    public function getError() {
        return $this->file["error"];
    }

    /**
     * @return int
     */
    public function getSize() : int {
        return $this->file["size"];
    }

    /**
     * @return array
     */
    public function getData() : array {
        return $this->file;
    }
}
