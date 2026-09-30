<?php

namespace App\DocCreator\Shortcode;

use App\DocCreator\RelayLoader\RelayLoader;
use App\DocCreator\RelayLoader\RelayUserModel;
use App\DocCreator\Shortcode\Select\Select;
use App\DocCreator\Shortcode\Select\SelectEdit;
use App\DocCreator\Shortcode\Select\SelectInput;
use App\DocCreator\Shortcode\Select\SelectMultiLabel;
use App\Models\Util;

class DocumentShortcode extends Shortcode
{

    public const CUSTOM_TYPES = [
        'select' => Select::class,
        'select_edit' => SelectEdit::class,
        'select_multilabel' => SelectMultiLabel::class,
        'select_input' => SelectInput::class,
        'money' => Util::class . '::getTextPennyValue',
    ];

    public const SHORTCODE_WRAPPER = '{}';

    /**
     * @return array
     */
    public function getMapping(): array
    {
        $meta = $this->getDocCreator()->getMeta();
        $config = $this->getConfig();

        $models = $this->getDocCreator()->getShortcode()->getModels();

        $mapping = [];
        foreach ($config as $value) {
            foreach ($value as $k => $v) {

                $code = trim($k, self::SHORTCODE_WRAPPER);

                $value = $v['default'] ?? null;

                if (isset($v['dataref']) && $v['dataref']) {
                    list($source, $key) = explode(".", $v['dataref']);
                    $model = $models[$source] ?? false;
                    if (isset($v['args']['models']) && is_array($v['args']['models'])) {
                        foreach ($v['args']['models'] as $arg_model) {
                            $v['args'][$arg_model] = $models[$arg_model] ?? null;
                        }
                    }
                    if ($model) {
                        if (method_exists($model, $key)) {
                            $value = $model->$key($v['args'] ?? []);
                        } else {
                            $value = $model->getData($key);
                        }
                    }
                }
                /*
                 * Get the changed value if is the case
                 */
                if (isset($meta['values'][$code]) && !isset($v['sync'])) {
                    $value = $meta['values'][$code];
                }

                /*
                 * Get the label value for select elements as the value will actually be the index key
                 */
                $type = $v['type'] ?? null;

                if ($type && isset(self::CUSTOM_TYPES[$v['type']])) {
                    $cls = self::CUSTOM_TYPES[$v['type']];
                    if (class_exists($cls) && method_exists($cls, 'getSelectedValue')) {
                        $value = (new $cls($v['options']))->getSelectedValue($value);
                    } else {
                        $value = $v['type'] === 'money' && key_exists("just_number", $v) && $v["just_number"] ? $value : $cls($value);
                    }
                }

                if (isset($v['source'])) {
                    if (isset($meta['values'][$code])) {
                        $value = $meta['values'][$code];
                    }
                }

                $v['value'] = $value;

                $mapping[$k] = $v;
            }
        }
        return $mapping;
    }
}
