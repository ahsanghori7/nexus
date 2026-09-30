<?php

namespace App\DocCreator\Shortcode;

use App\Api\Account;
use App\DocCreator\DocCreator;
use App\DocCreator\RelayLoader\RelayLoader;
use App\DocCreator\RelayLoader\RelayUserModel;
use App\Factory\Shortcodes;
use App\Models\Abstraction as AbstractModel;
use App\Models\Document;

class Shortcode
{

    const DEFAULT_SHORTCODES = "1.0";

    /**
     * @var DocCreator
     */
    public $doc_creator;

    /**
     * @var array
     */
    public $shortcodes = [];

    /**
     * @var array
     */
    public $mapping = [];

    public const TENDER_MODELS = [
        'Enquiry' => 'tender_template',
        'Order' => 'order_template',
    ];

    public function __construct (DocCreator $doc)
    {
        $this->doc_creator = $doc;
    }

    /**
     * @return DocCreator
     */
    public function getDocCreator(): DocCreator
    {
        return $this->doc_creator;
    }

    /**
     * @return Document
     */
    public function getDocument(): Document
    {
        return $this->getDocCreator()->doc;
    }

    /**
     * @return array
     */
    public function getModels(): array
    {
        $doc_models = $this->getDocCreator()->getDocument()->getDataModels();
        return array_merge($this->getDocCreator()->models, $doc_models);
    }

    /**
     * @return array
     */
    public function getShortcodes (): array
    {
        return $this->shortcodes;
    }

    /**
     * @param array $mapping
     */
    public function setMapping(array $mapping): void
    {
        $this->mapping = $mapping;
    }

    /**
     * @return \string[][]
     */
    public function getMapping(): array
    {
        return $this->mapping;
    }

    /**
     * @return array
     */
    public function getConfig(): array
    {
        $meta = $this->getDocCreator()->getMeta();

        list("slug" => $slug, "version" => $v) = $meta["config"] ?? [];
        $results = [];
        $shortcodes = Shortcodes::getBySlug($slug)->getVersion($v);

        foreach($shortcodes as $k => $item) {
            $item["value"] = $values[$k] ?? null;
            $results[$k] = $item;
        }

        return $results;
    }

    /**
     * @return mixed
     */
    public function getScripts()
    {
        $meta = $this->getDocCreator()->getMeta();
        list("slug" => $slug, "version" => $v) = $meta["config"] ?? [];
        return Shortcodes::getBySlug($slug)->getScripts($v);
    }

    /**
     * @param array $values
     */
    public function setValues(array $values): void
    {
        foreach($values as $key => $value){
            $this->shortcodes[$key] = $value;
        }
    }

    /**
     * @return array
     */
    public function parseShortcodes(): array
    {
        return self::shortcodesValues($this->getDocument(), $this->getMapping(), $this->getModels());
    }

    /**
     * @param string $content
     * @return array
     */
    public function replaceShortcodes(string $content): array
    {
        $shortcodes = $this->getShortcodes();

        $content = json_decode($content, true);

        if($content) {
            array_walk_recursive($content, static function (&$value) use ($shortcodes) {
                foreach ($shortcodes as $key => $shortcode) {
                    if ( is_scalar($shortcode) ) {
                        if($value) {
                            $value = str_replace($key, $shortcode, $value);
                        }
                    }
                }
            });
        }

        return $content ?? [];
    }

    /**
     * @param array $shortcodes
     * @param array $models
     * @param Document $document
     * @return array
     * @throws \App\Api\Exception
     */
    public static function shortcodesValues(Document $document, array $shortcodes, array $models): array
    {
        $values = [];
        $meta = $document->getMeta();

        foreach($shortcodes as $key => $value){
            if(isset($value['value'])){
                $values[$value['code']] = $value['value'];
            }
            else if(isset($value['dataref']) && $value['dataref'] && strpos($value['dataref'], ".") !== false){
                list($model,$dkey) = explode(".", $value['dataref']);
                if(isset($models[$model])) {
                    $args = $value['args'] ?? [];

                    if (is_array($models[$model]) &&  isset($models[$model]['class']) ) {
                        $args = $models[$model]['args'] ?? [];
                        $models[$model] = $models[$model]['class'];
                    }

                    if(is_scalar($models[$model])){
                        if (method_exists($models[$model], $dkey)) {
                            if($args) {
                                $values[$value['code']] = $models[$model]::$dkey($args);
                            }else{
                                $values[$value['code']] = $models[$model]::$dkey();
                            }
                        }
                    }else {
                        if(isset($args['models'])){
                            /*
                             * Add the default document model
                             */
                            $loaded_models = [
                                'document' => $document
                            ];
                            foreach($args['models'] as $arg_model) {
                                $loaded_models[$arg_model] = $models[$arg_model] ?? null;
                            }
                            $args['models'] = $loaded_models;
                        }
                        $values[$value['code']] = self::extractShortcode($dkey, $models[$model], $args);
                    }
                }
            }

            if(isset($value['source'])){
                $user = new RelayUserModel($models['user']->getId(), $models['user']->getData('account_id'),'');
                foreach(RelayLoader::load($value['source'], $user) as $option){
                    $idField = $option[$value['source']['idField']] ?? null;
                    if($idField){
                        if($idField == $value['value']){
                            $values[$value['code']] = $option[$value['source']['optionLabelKey']];
                        }
                    }
                }
            }


            $is_signatory = true;
            if(isset($meta['signatory_wet']) && $meta['signatory_wet']){
                if(isset($value['dependency']) && $value['dependency'] === 'signatory_wet') {
                    $values[$value['code']] = '';
                }
                $is_signatory = false;
            }

            if(isset($value['prefix'])){
                $val = isset($values[$value['code']]) ? $values[$value['code']] : '';
                $values[$value['code']] = $value['prefix'] . $val;
                $relationship = $value['relationship'] ?? null;
                if($relationship){
                    if(is_array($relationship)){
                        foreach($relationship as $v){
                            if(isset($v['key']) && $val) {
                                $values[$v['code']] = '';
                                if($is_signatory){
                                    $user = Account::getUser($val);
                                    $prefix = $v['prefix'] ?? '';
                                    $value = $user[$v['key']] ?? '';
                                    $values[$v['code']] = $value ? ($prefix . $value) : $value;
                                }
                            }
                        }
                    }
                }

            }
        }

        return $values;
    }

    /**
     * @param string $key
     * @param AbstractModel $model
     * @param array $args
     * @return array|mixed|null
     */
    public static function extractShortcode (string $key, AbstractModel $model, array $args)
    {
        if ( method_exists($model, $key) ) {
            if($args){
                $data = $model->$key($args);
            }else {
                $data = $model->$key();
            }
        }
        else {
            $data = $model->getData($key);
        }

        return $data;
    }

    /**
     * @return bool
     * @throws \Exception
     */
    public function hasSow(): bool
    {
        $content = $this->getDocument()->getContent();
        foreach($this->getMapping() as $key => $value){
            if(strpos($content, $value['code']) !== false){
                return true;
            }
        }
        return false;
    }
}
