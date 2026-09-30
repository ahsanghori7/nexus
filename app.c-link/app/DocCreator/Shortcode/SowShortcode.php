<?php

namespace App\DocCreator\Shortcode;

use App\Factory\Shortcodes;
use App\Models\Sow;

class SowShortcode extends Shortcode
{
    /**
     * @return array
     */
    public function getMapping(): array
    {
        $doc_creator = $this->getDocCreator();
        $meta = $this->getDocCreator()->getMeta();
        $v = $meta["config"]["shortcode_version"] ?? self::DEFAULT_SHORTCODES;

        return array_filter(Shortcodes::getCodes($v), static function($value, $key) use ($doc_creator, $meta) {
            if($valid = ($value['type'] == 'editor')){
                unset($meta['values'][$key]);
                $doc_creator->setMeta($meta);
            }
            return $valid;
        }, ARRAY_FILTER_USE_BOTH);
    }

    /**
     * @return array
     */
    public function getModels(): array
    {
        if(!$this->hasSow()){
            return [];
        }

        try{
            $instruction = [
                "instruction" => $this->getDocCreator()->getModel("instruction"),
                "transaction" => $this->getDocCreator()->getModel("transaction")
            ];
        }catch (\Exception $e){
            $instruction = [];
        }

        return [
            'sow' => [
                'class' => Sow::class,
                'args' => [
                        'did' => $this->getDocument()->getId(),
                        'preview' => $this->getDocCreator()->getOption('preview'),
                    ] + $instruction
            ],
        ];
    }
}
