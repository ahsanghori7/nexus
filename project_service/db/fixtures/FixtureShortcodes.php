<?php


class FixtureShortcodes
{

    public const SHORTCODE_MAPPING_JSON = __DIR__ . "/shortcodes.json";

    /**
     * @var string
     */
    public string $last_shortcode = '';

    /**
     * @param string $text
     * @param string $shortcode
     * @param bool $full_search
     * @return bool
     */
    public function hasShortcode(string $text,string $shortcode, bool $full_search = false): bool
    {
        $search = str_contains($text, $shortcode);
        if($full_search) {
            if ( $search ) {
                $this->last_shortcode = $text;
            }
        }
        else{
            $this->last_shortcode = '{'.$shortcode.'}';
        }
        return $search;
    }

    /**
     * @return string
     */
    public function getLastShortcode(): string
    {
        return $this->last_shortcode;
    }

    /**
     * @param Fixture $fixture
     * @return int
     */
    public function getContractorId(Fixture $fixture): int
    {
        return $fixture->getContractorId();
    }

    /**
     * @param Fixture $fixture
     * @param string $value
     * @return string
     */
    public function generateUniqueName(Fixture $fixture, string $value): string
    {
        return $fixture->generateUniqueName($value);
    }

    /**
     * @param Fixture $fixture
     * @param string $value
     * @param string $project_name
     * @return string
     */
    public function generateSlugFromProjectName(Fixture $fixture, string $value, string $project_name = ''): string
    {
        return $fixture->generateSlugFromProjectName($project_name);
    }

    /**
     * @param Fixture $fixture
     * @param string $text
     * @param array $args
     * @return void
     */
    public function replaceShortcode(Fixture $fixture, string &$text, array $args = []): void
    {
        array_unshift($args, $text);
        array_unshift($args, $fixture);
        $last_shortcode = $this->getLastShortcode();
        $method = $this->getShortcodeMapping($last_shortcode);
        if(!isset($method)){
            die("Error: The shortcode ". $last_shortcode ." does not have a method mapped");
        }
        $text = trim(str_replace($last_shortcode, (string)($this->$method(...$args)), $text));
    }

    /**
     * @return array
     */
    public function getShortcodesList(): array
    {
        return array_map(function($item){
            return str_replace(["{","}"],"", $item);
        }, array_keys($this->getShortcodeMapping()));
    }

    /**
     * @param string $shortcode
     */
    public function getShortcodeMapping(string $shortcode = '')
    {
        if(file_exists(self::SHORTCODE_MAPPING_JSON)) {
            $mapping_json = file_get_contents(self::SHORTCODE_MAPPING_JSON);
            $mapping_json = (array)json_decode($mapping_json, true);
            if ($shortcode) {
                return $mapping_json[$shortcode] ?? null;
            }
            return $mapping_json;
        }
        return [];
    }

    /**
     * @param Fixture $fixture
     * @param string $text
     * @return string
     */
    public function replaceSubcontractorId(Fixture $fixture, string $text): string
    {
        $subcontractors_mapping = $fixture->getSubcontractorsMapping();
        $replace_shortcode_delimiter = str_replace(["{","}"], "", $this->getLastShortcode());
        $mapping = $subcontractors_mapping[$replace_shortcode_delimiter] ?? null;
        if(!$mapping){
            die("Error: ".$this->getLastShortcode()." does not have a mapping subcontractor id associated\n");
        }
        return (string)$mapping;
    }
}
