<?php

namespace App\DocCreator\Shortcode;

use App\Api\Account;
use App\DocCreator\DocCreator;
use App\DocCreator\RelayLoader\RelayLoader;
use App\DocCreator\RelayLoader\RelayUserModel;
use App\Factory\Shortcodes;
use App\Models\Abstraction as AbstractModel;
use App\Models\Document;
use App\Models\UserModel;

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

    public const NUMBER_DOCUMENT_CONTENT_KEY = 'conditionalContent';

    public const NUMBER_DOCUMENTS_VISIBILITY = [
        'Yes' => 'Show',
        'No' => 'Hide',
    ];

    public function __construct(DocCreator $doc)
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
    public function getShortcodes(): array
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
     * @return array
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
        $values = $meta["values"] ?? [];

        foreach ($shortcodes as $k => $item) {
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
        foreach ($values as $key => $value) {
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
     * @param array $content
     * @return void
     */
    public function hideNumberDocumentPages(array &$content): void
    {
        $key = self::NUMBER_DOCUMENT_CONTENT_KEY;
        foreach ($content as &$value) {
            if (isset($value['children']) && is_array($value['children'])) {
                foreach ($value['children'] as $k => $v) {
                    if (isset($v[$key]) && $v[$key] !== self::NUMBER_DOCUMENTS_VISIBILITY['Yes']) {
                        unset($value['children'][$k]);
                    }
                }
                self::hideNumberDocumentPages($value);
            }
        }
    }

    /**
     * @param string $content
     * @return array
     */
    public function replaceShortcodes(string $content): array
    {
        $shortcodes = $this->getShortcodes();

        $content = json_decode($content, true);

        if ($content) {
            $hide_number_document_pages = false;
            array_walk_recursive($content, static function (&$value, $propKey) use ($shortcodes, &$hide_number_document_pages) {
                foreach ($shortcodes as $key => $shortcode) {
                    if ($propKey === "conditionalContent" && $key === $value) {
                        if (isset(self::NUMBER_DOCUMENTS_VISIBILITY[$shortcode])) {
                            $value = self::NUMBER_DOCUMENTS_VISIBILITY[$shortcode];
                            if ($shortcode !== 'Yes') {
                                $hide_number_document_pages = true;
                            }
                            break;
                        } else {
                            $value = $shortcode ? self::NUMBER_DOCUMENTS_VISIBILITY['Yes'] : self::NUMBER_DOCUMENTS_VISIBILITY['No'];
                            if (!$shortcode) {
                                $hide_number_document_pages = true;
                            }
                            break;
                        }
                    }
                    if (is_scalar($shortcode)) {
                        if ($value) {
                            $value = str_replace($key, $shortcode, $value);
                        }
                    } else if (is_array($shortcode)) {     //handle multiple values
                        $shortcode = implode("<br>", $shortcode);
                        $value = str_replace($key, $shortcode, $value);
                    }
                }
            });
            if ($hide_number_document_pages) {
                $this->hideNumberDocumentPages($content);
            }
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

        foreach ($shortcodes as $key => $value) {
            if (isset($value['value'])) {
                $values[$value['code']] = $value['value'];
            } else if (isset($value['dataref']) && $value['dataref'] && strpos($value['dataref'], ".") !== false) {
                list($model, $dkey) = explode(".", $value['dataref']);
                if (isset($models[$model])) {
                    $args = $value['args'] ?? [];

                    $model_loaded = $models[$model];
                    if (is_array($models[$model]) &&  isset($models[$model]['class'])) {
                        $args = $models[$model]['args'] ?? [];
                        $model_loaded = $models[$model]['class'];
                    }

                    if (is_scalar($model_loaded)) {
                        if (method_exists($model_loaded, $dkey)) {
                            if ($args) {
                                $values[$value['code']] = $model_loaded::$dkey($args);
                            } else {
                                $values[$value['code']] = $model_loaded::$dkey();
                            }
                        }
                    } else {
                        if (isset($args['models'])) {
                            /*
                             * Add the default document model
                             */
                            $loaded_models = [
                                'document' => $document
                            ];
                            foreach ($args['models'] as $arg_model) {
                                $loaded_models[$arg_model] = $models[$arg_model] ?? null;
                            }
                            $args['models'] = $loaded_models;
                        }
                        $values[$value['code']] = self::extractShortcode($dkey, $model_loaded, $args);
                    }
                }
            } else if (key_exists("numbered_document", $value) && is_null($value["value"])) {
                $values[$value['code']] = "No";
            }

            if (isset($value['source'])) {
                $user = new RelayUserModel($models['user']->getId(), $models['user']->getData('account_id'), '');
                foreach (RelayLoader::load($value['source'], $user) as $option) {
                    $idField = $option[$value['source']['idField']] ?? null;
                    if ($idField) {
                        if ($idField == $value['value']) {
                            $values[$value['code']] = $option[$value['source']['optionLabelKey']];
                        }
                    }
                }
            }

            if (isset($value['dataref']) && $value['dataref'] === "sum") {
                $existing_shortcodes = $document->getAllShortcodes();
                $args = $value['args']['shortcode_keys'] ?? [];
                $total = 0;
                foreach ($args as $shortcode_key) {
                    $shortcode_selected = $meta['values'][$shortcode_key] ?? null;
                    if (isset($existing_shortcodes[$shortcode_key]['options'][$shortcode_selected])) {
                        if (preg_match('/^\d+/', $existing_shortcodes[$shortcode_key]['options'][$shortcode_selected], $match)) {
                            $total += (int)$match[0];
                        }
                    }
                }
                $values[$value['code']] = $total;
            }

            if (isset($value['dataref']) && $value['dataref'] === "sum_numbers") {
                $existing_shortcodes = $document->getAllShortcodes();
                $args = $value['args']['shortcode_keys'] ?? [];
                $total = 0;
                foreach ($args as $shortcode_key) {
                    $total += $meta['values'][$shortcode_key] ?? 0;
                }
                $values[$value['code']] = $total;
            }

            $is_signatory = true;
            if (isset($meta['signatory_wet']) && $meta['signatory_wet']) {
                if (isset($value['dependency']) && $value['dependency'] === 'signatory_wet') {
                    $values[$value['code']] = '';
                }
                $is_signatory = false;
            }

            if (isset($value['prefix'])) {
                $val = isset($values[$value['code']]) ? $values[$value['code']] : '';
                $values[$value['code']] = $value['prefix'] . $val;
                $relationship = $value['relationship'] ?? null;
                if ($relationship && is_array($relationship)) {
                    if ($val) {
                        $user    = Account::getUser($val);
                        $main_contractor_aid = $models['account']->getData("id");
                        $userModel = new UserModel($user, $val);
                        $userModel->setSupplyChainDataFromMainContractor($main_contractor_aid);

                        foreach ($relationship as $v) {
                            if (isset($v['key'])) {
                                $values[$v['code']] = '';
                                if ($is_signatory) {
                                    if ($user_value = $userModel->getData($v['key'])) {
                                        $user[$v['key']] = $user_value;
                                    }
                                    $prefix = $v['prefix'] ?? '';
                                    $value = $user[$v['key']] ?? '';
                                    $values[$v['code']] = $value ? ($prefix . $value) : $value;
                                }
                            }
                        }
                    }
                }
            }

            if (!is_scalar($value) && isset($value['type']) && $value['type'] === 'editor' && !array_key_exists("sourceOptions", $value)) {
                $editorValue = $meta['values'][$key] ?? "";
                $values[$value['code']] = $editorValue;
            }

            if (is_array($value) && isset($value['type']) && $value['type'] === 'pdf') {
                $val = $value["value"];
                $validValue = is_numeric($val) && $val != 0;
                if (isset($value['text_code'])) {
                    $values[$value['text_code']] = $validValue ? "Yes" : "No";
                }

                if (isset($value['text_description_code'])) {
                    $values[$value['text_description_code']] = $validValue ? "Included In Document" : "Not Included";
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
    public static function extractShortcode(string $key, AbstractModel $model, array $args)
    {
        if (method_exists($model, $key)) {
            if ($args) {
                $data = $model->$key($args);
            } else {
                $data = $model->$key();
            }
        } else {
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
        foreach ($this->getMapping() as $value) {
            $code = $value['code'] ?? "";
            if (strpos($content, $code) !== false) {
                return true;
            }
        }
        return false;
    }
}
