<?php

namespace Core\Layer;

use JetBrains\PhpStorm\Pure;

abstract class IoAbstract
{

   const PATH_DELIMITER = "/";


    /**
     * @return string
     */
    public function getDirection() : string {
        $parts =  explode("\\", $this::class);
        return strtolower(end($parts));
    }

    /**
     * @param string $direction
     * @return bool
     */
    public function isDirection(string $direction) : bool {
        return (strcasecmp($this->getDirection(), $direction) === 0);
    }

    /**
     * @return string
     */
    public function getType() : string {
        return strtolower(array_slice(explode("\\", $this::class), -2, 1)[0]);
    }


    /**
     * @param string $type
     * @return bool
     */
    #[Pure] public function isType(string $type) : bool {
        return (strcasecmp($this->getType(), $type) === 0);
    }

    /**
     * @return string
     */
    abstract public function getPath() : string;

    /**
     * @return int
     */
    public function getPathLength() : int {
        return count($this->getPathParts($this->getPath()));
    }

    /**
     * @param int $i
     * @param int|null $end
     * @return string
     */
    public function getPathByIndex(int $i, int $end = null) : string {
        $parts = $this->getPathParts($this->getPath());
        $path  = $parts[$i] ?? "";

        if($end) {
            if($end < 0) {
                $end = count($parts) + $end;
            }
            while($i < $end) {
                if(isset($parts[$i + 1])) {
                    $path .= $this->getPathDelimiter() . $parts[$i + 1];
                    $i ++;
                }
                else {
                    $i = $end;
                }
            }
        }

        return $path;
    }

    /**
     * @param string $path
     * @return array<string>
     */
    public function getPathParts(string $path) : array {
        $delimiter = $this->getPathDelimiter();
        if( $delimiter !== '' ) {
            return array_values(
                array_filter(
                    explode($delimiter, $path)
                )
            );
        }
        throw new \Exception("Path delimiter is empty");
    }

    public function getPathDelimiter() : string{
       return $this::PATH_DELIMITER;
    }
 }
