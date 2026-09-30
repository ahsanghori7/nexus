<?php

namespace Core\Data\Shape;

use Core\Data\Shape;

class Validation
{
    /**
     * @var Shape
     */
    protected Shape $signature;

    /**
     * @param array<string, mixed> $signature
     */
    public function __construct(array $signature) {
        $this->signature = new Shape($signature);
    }

    public function validate(Shape $shape) : Shape {
        $report = ["missing" => [], "type_mismatch" => [], "failed_rules" => []];
        foreach($this->signature->toArray() as $key => $value) {
            $subject = $shape->get(strval($key));
            if(is_null($subject)) {
                if(!$this->isOptional($value)) {
                    $report["missing"][] = $key;
                }
            }
            else {
                if(is_array($value)) {
                    $type = $value["type"] ?? "";
                    if($type && !$this->isType($subject, $type)) {
                        $report["type_mismatch"][] = $key;
                    }
                    foreach($this->getRules($value["test"] ?? []) as $rid => $rule) {
                        if(!$rule($subject)) {
                            $report["failed_rules"][$rid][$key] = $subject;
                        }
                    }
                }
            }
        }
        $report["valid"] = empty($report["missing"]) && empty($report["type_mismatch"]) && empty($report["failed_rules"]);
        return new Shape($report);
    }

    /**
     * @param Shape $shape
     * @return bool
     */
    public function test(Shape $shape) : bool
    {
        $report = $this->validate($shape);
        if(!$report->get("valid")) {
            $report = json_encode($report);
            throw new \Exception(
                is_string($report) ? $report : "Failed to convert report to json"
            );
        }
        return true;
    }


    /**
     * @param mixed $value
     * @return bool
     */
    public function isOptional(mixed $value) : bool {
        if(is_array($value)) {
            return $value["optional"] ?? false;
        }
        return false;
    }

    /**
     * @param mixed $subject
     * @param string $test
     * @return bool
     */
    public function isType(mixed $subject, string $test) : bool {
        return (strcasecmp( gettype($subject), $test) === 0);
    }

    /**
     * @param array<string, Callable> $tests
     * @return array<string, Callable>
     */
    public function getRules(array $tests) : array {
        $rules = [];
        foreach($tests as $k => $rule) {
            if (is_string($k) && is_callable($rule)) {
                $rules[$k] = $rule;
            }
        }
        return $rules;
    }
}
