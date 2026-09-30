<?php

namespace CostPlanningTool\Eloquent;

use Core\Layer\OutgoingInterface;
use Core\Data\Shape;

class Outgoing implements OutgoingInterface
{
    /**
     * @var Shape
     */
    protected Shape $query;

    /**
     * @return Shape
     */
    public function getQuery() : Shape {
        if(!isset($this->query)) {
            $this->query = new Shape();
        }
        return $this->query;
    }

    /**
     * @var string
     */
    protected string $type = "database";

    /**
     * @return string
     */
    public function getType(): string
    {
        return $this->type;
    }

    /**
     * @param string $type
     * @return bool
     */
    public function isType(string $type): bool
    {
        return (strcasecmp($this->type, $type) === 0);
    }

    public function getDirection(): string
    {
        return "out";
    }

    public function isDirection(string $direction): bool
    {
        return ($direction === "out");
    }

    public function setArgs(\Core\Data\Shape $args): OutgoingInterface
    {
        return $this;
    }

    public function setData(\Core\Data\Shape $data): OutgoingInterface
    {
        $this->getQuery()->set("data", $data);
        return $this;
    }

    public function setPath(string $path): OutgoingInterface
    {
        $this->getQuery()->set("path", $path);
        return $this;
    }

    public function getResponse(): \Core\Data\Shape
    {
        //ToDo: Align or refactor OutgoingInterface to fit usage
        return new Shape();
    }

    public function setOptions(array $options): OutgoingInterface
    {
        $this->getQuery()->set("path", $options);
        return $this;
    }

    public function setHeaders(array $headers): OutgoingInterface
    {
        $this->getQuery()->set("headers", $headers);
        return $this;
    }
}
