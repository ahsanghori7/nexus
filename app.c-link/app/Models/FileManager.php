<?php
namespace App\Models;

use App\Api\Document;
use App\Api\ProjectManagement;
use App\Api\S3;
use App\core\Environment as Env;

class FileManager{


    public const TENDER_ADDENDUM_LABEL = 'Tender Addendum';

    public const BOQ_CATEGORY_NAME = 'Pricing';

    public const BOQ_CATEGORY_FILE_NAME = 'See %s Digital Price Breakdown in Prosper';

    /**
     * @param int $tid
     * @param array $cats
     * @return string
     */
    public static function getDownloadAllUrl(int $tid, array $cats): string
    {
        $url = '';
        if($cats) {
            $cat_ids = implode(",", array_unique($cats));
            $url = SITE_URL . "/download-all/tender/categories/$tid?ids=[$cat_ids]";
        }
        return $url;
    }

    /**
     * @param int $tid
     * @param array $cats
     * @param int $instruction
     * @param string $type
     * @param int $instruction_nr
     * @return string
     */
    public static function getDownloadAllInstructionUrl(int $tid, array $cats, int $instruction = 0, string $type = 'instruction', int $instruction_nr = 0): string
    {
        $url = '';
        if($cats) {
            $cat_ids = implode(",", $cats);
            $url = SITE_URL . "/download-all/$type/categories/$tid?ids=[$cat_ids]&instruction_id=$instruction&instruction_nr=$instruction_nr";
        }
        return $url;
    }

    /**
     * @param array $models
     * @return array
     * @throws \App\Api\Exception
     */
    public static function getTenderFiles(array $models): array
    {
        $entity_id = $models['tender']->getData("id");
        $categories = Document::get("category", [
            "entity_id" => $entity_id,
            "entity_type" => 'tender'
        ]);

        $cat_ids = [];
        $files = [];
        foreach($categories as $category) {
            foreach ($category['documents'] as $key => $document) {
                if(
                    isset($document['s3_key']) &&
                    $document['type'] == Document::DOCUMENT_STRUCTURAL_TYPE &&
                    strpos($category['label'], self::TENDER_ADDENDUM_LABEL) === false
                ) {
                    $files['files'][] = [
                        'name' => $document['name'],
                        'category' => $category['label'],
                        'src'      => sprintf("%s/%s", Env::getValue("AWS_S3_ASSET_URL"), $document['s3_key'])
                    ];
                    $cat_ids[] = $category['id'];
                }
            }
        }
        $files['download'] = self::getDownloadAllUrl($entity_id, $cat_ids);

        //Append boq category to file manager
        if($models['document']->getData("boq_enabled")) {
            $files['files'][] = [
                'name'     => sprintf(self::BOQ_CATEGORY_FILE_NAME, $models['tender']->getData("label")),
                'category' => self::BOQ_CATEGORY_NAME,
                'type'     => 'text',
                'src'      => '',
            ];
        }

        return $files;
    }

    /**
     * @param array $models
     * @return array
     * @throws \App\Api\Exception
     */
    public static function getTenderAddendumFiles(array $models): array
    {
        $entity_id = $models['tender']->getData("id");
        $categories = Document::get("category", [
            "entity_id" => $entity_id,
            "entity_type" => 'tender'
        ]);

        $files = [];
        $cat_ids = [];
        foreach($categories as $category) {
            foreach ($category['documents'] as $key => $document) {
                if(
                    isset($document['s3_key']) &&
                    $document['type'] == Document::DOCUMENT_STRUCTURAL_TYPE &&
                    strpos($category['label'], self::TENDER_ADDENDUM_LABEL) !== false
                ) {
                    $files['files'][] = [
                        'name' => $document['name'],
                        'category' => $category['label'],
                        'src' => S3::getURI(S3::getBucket($document['s3_bucket']), $document['s3_key'])
                    ];
                    $cat_ids[] = $category['id'];
                }
            }
        }
        $files['download'] = self::getDownloadAllUrl($entity_id, $cat_ids);

        return $files;
    }

    /**
     * @param array $models
     * @return array
     * @throws \App\Api\Exception
     */
    public static function getInstructionFiles(array $models): array
    {
        $entity_id = $models['tender']->getData("id");
        $categories = Document::get("category", [
            "entity_id" => $entity_id,
            "entity_type" => 'instruction'
        ]);
        if(!isset($models['instruction'])) {
            return [];
        }
        $instruction_id = $models['instruction']->getData("id");
        $type_id = $models['instruction']->getData("type_id");
        $nr = $models['instruction']->getData("nr");

        $types = array_filter(ProjectManagement::getType()->getData(), function ($item) use ($type_id) {
            return ($item['id'] == $type_id);
        });
        $type_last = end($types);

        $files = [];
        $cat_ids = [];
        foreach($categories as $category) {
            foreach ($category['documents'] as $key => $document) {
                if(
                    isset($document['s3_key']) &&
                    $document['type'] == Document::DOCUMENT_STRUCTURAL_TYPE
                ) {
                    $meta = json_decode($document['meta'], true);
                    if(isset($meta['instruction_id']) && $meta['instruction_id'] == $instruction_id) {
                        $files['files'][] = [
                            'name' => $document['name'],
                            'category' => '',
                            'src' => S3::getURI(S3::getBucket($document['s3_bucket']), $document['s3_key'])
                        ];
                        $cat_ids[] = $category['id'];
                    }
                }
            }
        }

        $files['download'] = self::getDownloadAllInstructionUrl($entity_id, array_unique($cat_ids), $instruction_id, $type_last['uid'], $nr);

        return $files;
    }

}
