<?php

namespace App\Utility;

class Zip {

    /**
     * @var string
     */
    protected string $src;

    /**
     * @param string $src
     */
    public function __construct(string $src)
    {
        $this->src = $src;
    }

    /**
     * @return string[]
     * @throws \Exception
     */
    public function getSrcFiles() : array {
        if(is_dir($this->src)) {
            $files = $this->getFilesFromSource();
        }
        else {
            if(!is_file($this->src)) {
                throw new \Exception("Invalid zip source ($this->src), no folder or file found");
            }
            $files = [new \SplFileInfo($this->src)];
        }

        return $files;
    }

    /**
     * @return array
     * @throws \Exception
     */
    public function getFilesFromSource() : array {
        if(is_dir($this->src)) {
            $files = [];
            $ite = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($this->src));
            foreach($ite as $k => $file) {
                if(!$file->isDir()) {
                    $files[] = $file;
                }
            }

            if(empty($files)) {
                throw new \Exception("Zip Folder Empty");
            }

            return $files;
        }
        throw new \Exception("Zip source provided not directory, cannot load files");
    }

    /**
     * @param string $path
     * @return string
     * @throws \Exception
     */
    public function rewriteSrcAsRoot(string $path) : string {
        $root = dirname($this->src);
        return substr($path, strlen($root));
    }

    public function create(string $dest, string $zipname, $setSrcAsRoot=true) {
        $zip = new \ZipArchive();
        if(!is_writable($dest)) {
            throw new \Exception("Zip Dest $dest not writable");
        }

        $destPath = $dest . DIRECTORY_SEPARATOR . $zipname;
        if($zip->open($destPath, \ZipArchive::CREATE) === true) {
            $files = $this->getSrcFiles();
            foreach($files as $file) {
                $filepath = "";
                if ($file instanceof \SplFileInfo) {
                    $filepath =  $file->getPathname();
                }
                $localpath = ($setSrcAsRoot) ? $this->rewriteSrcAsRoot($filepath) : null;
                $zip->addFile(
                    $filepath,
                    trim($localpath,"/")
                );
            }
            $zip->close();
            return $zip;
        }

        throw new \Exception("Failed to create Zip Dest $dest");
    }
}
