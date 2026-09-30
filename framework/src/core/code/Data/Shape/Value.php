<?php

namespace Core\Data\Shape;

class Value
{
    /**
     * @var mixed
     */
    protected mixed $value;

    /**
     * @param mixed $value
     */
    public function __construct(mixed $value) {
        $this->value = $value;
    }

    /**
     * @param string $type
     * @return bool
     */
    public function isType(string $type) : bool {
        return (strcasecmp(gettype($this->value), $type) === 0);
    }

    /**
     * @param mixed $test
     * @return bool
     */
    public function isEqualTo(mixed $test) : bool {
        return $test === $this->value;
    }

    /**
     * @param mixed $test
     * @return bool
     */
    public function isNotEqualTo(mixed $test) : bool {
        return $test !== $this->value;
    }

    /**
     * @param int $test
     * @return bool
     */
    public function isEqualToInt(int $test) : bool {
        return $test === intval($this->value);
    }

    /**
     * @param array<mixed, mixed> $array
     * @param bool $strict
     * @return bool
     */
    public function isInArray(array $array, bool $strict = true): bool
    {
        return in_array($this->value, $array, $strict);
    }

    /**
     * @param string $type
     * @return mixed
     */
    public function cast(string $type) : mixed {
        $v = $this->value;
        if($v === null) {
            return null;
        }

        if($type === "int") {
            $v = intval($v);
        }
        elseif($type === "bool") {
            $v = boolval($v);
        }
        elseif($type === "float") {
            $v = floatval($v);
        }
        elseif($type === "string") {
            $v = strval($v);
        }
        else{
            throw new \Exception("Invalid type: " . $type);
        }
        return $v;
    }
}
