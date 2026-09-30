<?php
namespace App\Models;

abstract class Abstraction {

    /**
     * @var array
     */
    protected array $data = [];

    /**
     * @var string
     */
    protected string $id;

    /**
     * @param array $data
     * @param string $id
     */
    public function __construct(array $data = [], $id = "") {
        $this->data = $data;
        $this->id = $id;
    }

    /**
     * @param array $args
     * @return string
     */
    public function getDate(array $args) : string {
        $format = $args["format"] ?? "d/m/Y";
        return Util::formatDate($this->getData($args['key']), $format);
    }

    /**
     * @return string
     */
    public function getId() {
        return $this->id;
    }

    /**
     * @param $id
     * @return mixed
     */
    public function setId($id) {
        $this->id = $id;
        return $this;
    }

    /**
     * Check if a data object has data, i.e is loaded
     * @return bool
     */
    public function hasData() : bool {
        return (count($this->data) > 0);
    }

    /**
     * @param mixed|null $k
     * @return array|mixed|null
     */
    public function getData($k=null, $def=null) {
        if($k) {
            if(is_array($k)) {
                return array_intersect_key($this->data, array_flip($k));
            }
            else {
                return $this->data[$k] ?? $def;
            }
        }
        return $this->data;
    }

    /**
     * @param string $k
     * @param $data
     * @return $this
     */
    public function setData(string $k, $data) : Abstraction {
        $this->data[$k] = $data;
        return $this;
    }
}
