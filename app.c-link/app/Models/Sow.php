<?php
namespace App\Models;

use App\Api\Document;
use App\Models\Document as DocumentModel;

class Sow{

    public const ENTITY_TYPE = "sow_template";

    /**
     * @param array $data
     * @return string
     * @throws \App\Api\Exception
     */
    public static function getContent(array $data): string
    {
        /*
         * If the document is an instruction we need to get the sow of the parent order from the transaction id
         */
        $instruction = $data['instruction'] ?? null;
        if($instruction) {
            $transaction = $data['transaction'] ?? null;
            $transaction_meta = json_decode($transaction->getData("meta"), true);
            $order_template_id = $transaction_meta['order_template_id'] ?? null;
            $data['did'] = $order_template_id;
        }
        $exception = '';
        if(isset($data["did"])) {
            $doc = Document::get("document/" . (int)$data["did"] . "/children");
            if (isset($doc["parent"]) && $doc["parent"]) {
                $document = new DocumentModel($doc["parent"], $data["did"]);
                $children = $document->setChildren($doc["children"] ?? [])->getChildren();
                $type = Document::getSubType(self::ENTITY_TYPE);
                $sow = $children->filterByField("subtype", (int)$type->getId())->getFirst();
                if($sow) {
                    $response = json_decode($sow->getContent(), true);
                    if(!isset($response['content'])){
                        $exception = 'Sow content missing!';
                    }
                }else{
                    $exception = 'Document cannot be loaded!';
                }
            }else{
                $exception = 'Missing parent document!';
            }
        }else{
            $exception = 'Missing document!';
        }

        /*
         * If we are not in a preview we need to show errors
         */
        if(!isset($data['preview']) || !$data['preview']){
            if($exception) {
                throw new \Exception($exception);
            }
        }

        return $response['content'] ?? '';
    }

}
