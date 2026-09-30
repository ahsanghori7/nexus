<?php

namespace App\Utility;

class Download {

    /**
     * @var string
     */
    protected string $root;

    /**
     * @var array
     */
    protected array $folders = [];

    /**
     * @param string $root
     * @param bool $mkroot
     * @throws \Exception
     */
    public function __construct(string $root, $mkroot = true) {
        $this->root = $root;
        if($mkroot && !Dir::exists($root)) {
            Dir::create($root);
        }
    }

    /**
     * @param string $folder
     * @return string
     * @throws \Exception
     */
    public function addFolder(string $folder) : string {
        if(!in_array($folder, $this->folders)) {
            $this->folders[] = $folder;
        }

        $path = $this->root . "/" . $folder;
        Dir::create($path, false);
        return $path;
    }

    /**
     * @param string $suffix
     * @param string $folder
     * @return string
     */
    public function getPath($folder="", $suffix="") : string {
        $path = $this->root;
        if($folder) {
            $path = $this->addFolder($folder);
        }
        if($suffix) {
            $path .= "/" . $suffix;
        }

        return $path;
    }

    /**
     * @param string $to
     * @param string $zipname
     * @return string
     * @throws \Exception
     */
    public function zip(string $to = "", ?string $zipname=null) {
        $path = ($to) ? $to : $this->root;
        $zip = new Zip($this->root);
        $zipName = $zipname ?? uniqid() . ".zip";
        $zip->create($path, $zipName);

        return $path . "/" . $zipName;
    }

    /**
     * @return array
     */
    public function clean() : array {
        $res = [];
        foreach($this->folders as $folder) {
            $res[] = Dir::delete($this->root . "/" . $folder);
        }
        $res[] = Dir::delete($this->root);

        return $res;
    }
}
