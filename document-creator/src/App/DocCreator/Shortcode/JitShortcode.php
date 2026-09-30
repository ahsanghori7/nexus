<?php

namespace App\DocCreator\Shortcode;

use App\Models\Util;
use App\Factory\Shortcodes;
use App\Models\FileManager;

class JitShortcode extends Shortcode
{
    /**
     * @return array
     */
    public function getMapping(): array
    {
        $document = $this->getDocCreator();
        $meta = $this->getDocCreator()->getMeta();
        $v = $meta["config"]["shortcode_version"] ?? self::DEFAULT_SHORTCODES;
        return array_filter(Shortcodes::getCodes($v), static function($value) use ($document) {
            //check to see if the jit shortcode is for the correct document type
            //as we can have a jit shortcode for the enquiries template but not for order template
            if(
                !isset($value['args']['type']) ||
                (
                    isset($value['args']['type'])
                    &&
                    self::TENDER_MODELS[$value['args']['type']] == $document->getSubType()
                )
            ){
                return $value['type'] == 'jit';
            }
        });
    }

    /**
     * @return array
     */
    public function getModels(): array
    {
        try{
            $instruction = [
                "instruction" => $this->getDocCreator()->getModel("instruction"),
                'transaction' => $this->getDocCreator()->getModel('transaction'),
                'signatory'   => $this->getDocCreator()->getModel('signatory'),
            ];
        }catch (\Exception $e){
            $instruction = [];
        }

        return [
            'project' => $this->getDocCreator()->getModel('project'),
            'tender'  => $this->getDocCreator()->getModel('tender'),
            'account' => $this->getDocCreator()->getModel('account'),
            'user' => $this->getDocCreator()->getModel('user'),
            'transaction' => $this->getDocCreator()->getModel('transaction'),
            'subcontractor' => $this->getDocCreator()->getModel('subcontractor'),
            'util' => Util::class,
            'filemanager' => FileManager::class
        ] + $instruction;
    }
}
