<?php

namespace App\Models;

class Shortcode extends Abstraction
{
    /**
     * @param string $version
     * @return array
     */
    public function getVersion(string $version) : array {

        $versions    = $this->getData("versions");
        $fields   = $versions[$version]["fields"] ?? [];
        if(!$fields) {
            throw new \Exception("Invalid Template version $version");
        }
        $codes   = $this->getCodes();
        $results = [];
        foreach ($fields as $i => $group) {
            foreach($group as $key) {
                $results[$i][$key] = $codes[$key] ?? null;
            }
        }
        return $results;
    }

    /**
     * @param string $version
     * @return array
     */
    public function getScripts(string $version) : array {
        $versions    = $this->getData("versions");
        $scripts = $versions[$version]["scripts"] ?? [];
        return $scripts;
    }

    /**
     * @return array
     */
    public function getCodes() : array {
        $mapper = $this->getData("codes");
        if(is_callable($mapper)) {
            $data = $mapper();
        }
        else {
            $data = $mapper;
        }

        return $data;
    }
}
