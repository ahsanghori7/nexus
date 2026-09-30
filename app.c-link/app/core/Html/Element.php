<?php


    namespace App\core\Html;


    class Element {

        /**
         * @var string
         */
        protected $name = "";

        /**
         * @var array
         */
        protected $attibutes = [];

        /**
         * @var string
         */
        protected $content = "";

        /**
         * @var array
         */
        protected $children = [];

        public function __construct(string $tag, array $attributes=[], string $content="") {
            $this->name = $tag;
            $this->attibutes = $attributes;
            $this->content = $content;
        }

        /**
         * @param array $children
         * @return $this
         */
        public function setChildren(array $children) {
            foreach ($children as $child) {
                $this->setChild($child);
            }
            return $this;
        }

        /**
         * @param Element $child
         */
        public function setChild(Element $child) {
            $this->children[] = $child;
        }

        /**
         * @return string
         */
        public function getAttributesToString() : string {
            $attributes = "";
            foreach ($this->attibutes as $name => $attr) {
                $attributes .= sprintf("%s='%s' ", $name, $attr);
            }
            return trim($attributes);
        }

        /**
         * @return string
         */
        public function getTag() : string {
            $el = trim(sprintf("<%s %s", $this->name, $this->getAttributesToString()));
            if($this->content) {
                $el .= sprintf(">%s</%s>", $this->content, $this->name);
            }
            else {
                $el .= " />";
            }
            return $el;
        }

        public function __toString() {
            $tag = $this->getTag();
            if(!is_string($tag)) {
                return "";
            }
            return $tag;
         }
    }
