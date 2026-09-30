<?php

namespace Api\Middleware\Transactions;

use Api\Data\Boq\Entity as BoqEntity;
use Api\Middleware\Pdf\boq\BoqPdfMiddleware;
use Api\Middleware\Relay\BoqMiddleware;
use Core\Config;
use Core\Data\Collection;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\ServiceMiddleware;
use Api\Data\Transaction\QuoteCollection;
use Api\Data\Transaction\Quote;
use Core\Service\Document\DocumentCollection;
use Core\Service\Manager;
use Api\Model\BoQ\Entity;
use Api\Model\BoQ\Item;
use Api\Model\BoQ\Quote as QuoteModel;

class QuoteMiddleware extends ServiceMiddleware
{
    public const SERVICE = 'project_v2';

    public const QUOTE_COLLECTION_KEY = 'quoteCollection';

    public const QUOTE_HISTORY_KEY = 'quotes_history';

    public const QUOTE_STATUS_SENT_ID = 1;

    public const BOQ_QUOTE_SENT_ID = 3;



    /**
     * @param string $saveKey
     * @param callable|null $argLoader
     * @return callable
     */
    public static function loadQuotesCollection(
        string $saveKey = self::QUOTE_COLLECTION_KEY, callable $argLoader = null
    ): callable
    {
        return function($action) use ($saveKey, $argLoader) {
                if($argLoader) {
                    $args = $argLoader($action);
                }
                $res = self::getService()->fetch("transaction", $args ?? []);
                $action->set(
                    $saveKey, new QuoteCollection($res->getCollection("data")->getItemsAsArray())
                );
        };
    }

    /**
     * @param string $collectionKey
     * @param string $newIdsKey
     * @return callable
     * Check the Action for two keys, one for existing items, i.e that have a boq_item_id
     * and one for new items then make two requests to project service transaction endpoint to save the data
     */
    public static function saveQuotesItems(string $collectionKey = self::QUOTE_COLLECTION_KEY, string $newIdsKey = "new_quote_item_ids"): callable
    {
        return function($action) use($collectionKey, $newIdsKey) {

            $newIds = [];
            $lastPublishedVersion = $action->get("lastPublishedVersion");
            foreach($action->getCollection($collectionKey) as $quote) {
                $items  = $quote->getItemsForSave();
                $operations = [
                    "write"  => Quote::NEW_QUOTE_ITEMS_KEY,
                    "update" => Quote::EXISTING_QUOTE_ITEMS_KEY
                ];

                foreach($operations as $method => $key) {
                    $tid  = $quote->get("id");
                    $data = $items[$key] ?? [];

                    // Clean quotation marks from keys
                    $data = array_map(function($item) use ($lastPublishedVersion) {
                        $result = [];
                        foreach($item->toArray() as $key => $value) {
                            $value = $value === 'null' ? null : $value;
                            $result[str_replace("'", "", $key)] = $value;
                            $result["boq_version"] = $lastPublishedVersion;
                        }
                        return new Shape($result);
                    }, $data);

                    if(count($data)) {
                        $url = "transaction/$tid/item";
                        try{
                            $res = self::getService()->$method($url, new Shape(["data" => $data]))->get("json");
                            if($res->has("data.ids")) {
                                foreach($res->get("data.ids", []) as $k => $nid) {
                                    $newIds[] = ["boq_item_id" => $k, "new_quote_item_id" => $nid];
                                }
                            }

                            if($res->has("error")) {
                                $error   =  $res->get("error");
                                $message = "ProjectService Returned an error on $method operation for quoteItems ";
                                $message .= $error["description"] ?? "";
                                throw new MiddlewareException("serviceError", $message) ;
                            }
                       } catch (\Exception $e) {
                            throw new MiddlewareException("serviceError", $e->getMessage()) ;
                       }
                    }
                }
            }
            $action->set($newIdsKey, $newIds);
        };
    }

    /**
     * @param string $payloadKey
     * @param string $tenderIdKey
     * @param callable|null $callback
     * @return callable
     */
    public static function createTransaction(string $payloadKey, string $tenderIdKey = "tender.id", callable $callback = null) : callable
    {
        return function($a) use ($payloadKey, $tenderIdKey, $callback) {
            if($tenderId = $a->int($tenderIdKey)) {
                $payload = $a->getShape($payloadKey)->toArray() + ["tender_id" => $tenderId, 'status_id' => 0];
                $res  = self::getService()->write("transaction", new Shape(["data" => $payload]));
                $data = $res->get("json")->getShape("data");
                $id = $data->get("id");
                $a->set("transaction_id", $id);
                // TODO: Refactor using loadQuotesCollection
                $transactionData  = self::getService()->fetch("transaction",["tid" => $tenderId, "sid" => $a->int("account.id")]);
                $quoteCollection = new QuoteCollection($transactionData->getCollection("data")->getItemsAsArray());
                $a->set(self::QUOTE_COLLECTION_KEY, $quoteCollection
                );
                if($callback) {
                    $callback($a, $res);
                }
            }
            else {
                throw new MiddlewareException("missingMiddleRequireVar", "createTransaction : no tender_id found");
            }
        };
    }

    /**
     * @param string $saveKey
     * @return callable
     * To maintain backwards compatibility with the quote system designed for quotes uploaded without a digital pricing document and maintained
     * in the transaction table, on publish or save of a digital pricing document quote we need to match the section headers and collect the
     * items and sum them then update the table. Be mindful that in future if we allow for section headers that are not matched with the transaction
     * table (prelims, measured works, other works) then this method might break.
     */
    public static function updateTransactionFromQuoteItems(
        string $boqKey=BoqMiddleware::BOQ_KEY,
        string $quotesKey=QuoteMiddleware::QUOTE_COLLECTION_KEY,
        $transactionIdKey = "transaction_id",
    ) : callable
    {
        return function($a) use ($boqKey, $quotesKey, $transactionIdKey) {
            $boq        = $a->get($boqKey);
            $sectionHeaders = Quote::getMainSectionHeadersCollection();
            $totals     = $boq->sumQuotesBySection($a->getCollection($quotesKey), true, function($k) use($sectionHeaders) {
                return $sectionHeaders->filterByField("map", $k)->first()->get("slug");
            });
            $totals->set("transaction_id", $a->get($transactionIdKey));
            foreach($sectionHeaders as $header) {
                $key = $header->get("slug");
                if($totals->get($key, 0)) {
                    QuoteMiddleware::updateTransaction($key)($totals);
                }
            }
            if($totals->get("price", 0)) {
                QuoteMiddleware::updateTransaction("price")($totals);
            }
        };
    }

    /**
     * @param string $dataKey
     * @param string $saveKey
     * @return \Closure
     */
    public static function getItemsDifferences(string $dataKey = 'entries', string $saveKey = 'differences'): \Closure
    {
        return function($a) use ($dataKey, $saveKey){
            $items = [];
            $differences = [];
            //loop through all quotes to get the rate and the versions
            $a->getCollection(self::QUOTE_COLLECTION_KEY)->first()->get("quote")->map(function($item) use (&$items){
                $items[$item->get("boq_item_id")][] = [
                    'item_version' => [
                        'version'     => $item->get("version"),
                        'status'      => $item->get("status_id"),
                    ],
                    'rate'        => $item->get("rate"),
                    'created_at'  => $item->get("created_at"),
                    'boq_item_id' => $item->get("boq_item_id"),
                ];
                return $item;
            });

            //loop through all quote items to get the boq item data
            $entries = (new Collection($a->get("boq.$dataKey"), Shape::class));
            $latest_version = 1;
            foreach($items as $key => &$item) {
                $entry = $entries->filterByField("id", $key);
                if($entry->count()){
                    $item = array_map(function($item) use ($entry) {
                        $item_mapping = $entry->first()->get("item_mappings");
                        if(is_array($item_mapping)){
                            $item_mapping = array_shift($item_mapping);
                            $item_mapping = new Shape($item_mapping);
                        }
                        return array_merge($item, [
                            'type'        => $item_mapping->get("type"),
                            'item_no'     => $item_mapping->get("item_no"),
                            'description' => $item_mapping->get("description"),
                            'quantity'    => $item_mapping->get("quantity"),
                            'price'       => number_format($item['rate'] * $item_mapping->get("quantity"), 2),
                            'rate'        => $item['rate']
                        ]);
                    }, $item);
                }
                Item::getItemsDifferences(Item::sortByLatestVersion($item), $differences);
                if($differences) {
                    $first_item = reset($differences)[0];
                    $current_version = $first_item->get("item_version.version");
                    if($current_version > $latest_version) {
                        $latest_version = $current_version;
                    }
                }
            }
            unset($item);
            $a->set($saveKey,
                Item::getItemsLatestVersionDifferences(
                    $differences,
                    $latest_version
                )
            );
            $a->set($saveKey."_documents", QuoteModel::getSubcontractorDocumentsByVersion($a->get(QuoteMiddleware::QUOTE_COLLECTION_KEY), $a->int("uriArgs.sid"), $latest_version));
        };
    }

    /**
     * @param string $collectionKey
     * @return callable
     */
    public static function filterQuoteItemsByLatestVersion(string $collectionKey = self::QUOTE_COLLECTION_KEY) : callable {
        return function($a) use ($collectionKey) {
            $collection = $a->getCollection($collectionKey);
            $newItems   = [];
            foreach($collection as $transaction) {
                $quote = $transaction->getCollection("quote");
                $nQuote = $quote->mapReduce("boq_item_id", function($items, $k) {
                    if(count($items) === 1){
                        return $items;
                    }
                    return $items->sort(function($a, $b) {
                        return ($a->get("version") >= $b->get("version")) ? -1 : 1;
                    })->slice();
                });
                $transaction->set("quote", $nQuote);
                $newItems[] = $transaction;
            }
            $a->set($collectionKey, $collection->clone($newItems));
        };
    }

    /**
     * @param string $payloadKey
     * @param string $transactionIdKey
     * @return callable
     */
    public static function updateTransaction(string $payloadKey, string $transactionIdKey = "transaction_id") : callable
    {
        return function($a) use ($payloadKey, $transactionIdKey) {

            if($transaction_id = $a->int($transactionIdKey)) {
                $payload = $a->getShape($payloadKey)->toArray();
                $res = self::getService()->update("transaction/$transaction_id", new Shape(["data" => $payload]));
                $json = $res->get("json");
                if($json->has("error")){
                    throw new MiddlewareException("updateTransactionFailed", "failed to update the transaction $transaction_id because ".$json->get("error.friendly"));
                }
            }
            else {
                throw new MiddlewareException("missingMiddleRequireVar", "updateTransaction : no transaction_id found");
            }
        };
    }

    /**
     * @param string $saveDocumentKey
     * @param string $deleteDocumentKey
     * @return \Closure
     */
    public static function prepareDocuments(string $saveDocumentKey = 'documents', string $deleteDocumentKey = 'delete_documents'): \Closure
    {
        return function($a) use ($saveDocumentKey, $deleteDocumentKey){
            $data = $a->getRoute()->getRequest()->getData();
            $documents = $data->getShape("files")->get("document");
            $a->set($saveDocumentKey, $documents ? new DocumentCollection($documents) : null);

            $form = $data->get("form");
            $deleteDocuments = array_map(function($id){return intval($id);}, $form->get("delete_document", []));
            $a->set($deleteDocumentKey, $deleteDocuments);
        };
    }

    /**
     * @param string $documentDataKey
     * @return \Closure
     */
    public static function uploadDocuments(string $documentDataKey = 'documents'): \Closure
    {
        return function($a) use ($documentDataKey){
            $transaction_id = $a->get("transaction_id");
            if ($documents = $a->get($documentDataKey)) {
                foreach($documents->getValidDocuments() as $document){
                    self::getService()->write("transaction/$transaction_id/document", new Shape(["data" => [
                        'name'          => $document->getName(),
                        'quote_version' => $a->get("version"),
                        's3_key'        => $document->upload('documents/quote-documents/'.$transaction_id)->getUploadedPath()
                    ]]));
                }
            }
        };
    }

    /**
     * @param string $collectionKey
     * @param string $saveKey
     * @return \Closure
     */
    public static function getLatestVersion(string $collectionKey = self::QUOTE_COLLECTION_KEY, string $saveKey = 'version'): \Closure
    {
        return function($a) use ($collectionKey, $saveKey){
            /**
             * Loop all the quotes find the lowest price per boq_item_id
             */
            $version = 1;
            $collection = $a->getCollection($collectionKey);
            foreach($collection->getItems() as $item){
                foreach($item->getCollection("quote") as $quote) {
                    if($quote->int("version") > $version) {
                        $version = $quote->int("version");
                    }
                }
            }
            $a->set($saveKey, $version);
        };
    }

    /**
     * @param string $documentDataKey
     * @return \Closure
     */
    public static function removeDocuments(string $documentDataKey = 'delete_documents'): \Closure
    {
        return function($a) use ($documentDataKey){
            if ($documents = $a->get($documentDataKey)) {
                foreach($documents as $idDocument){
                    self::getService()->delete("transaction/$idDocument/document");
                }
            }
        };
    }

    /**
     * @param string $collectionKey
     * @return \Closure
     * Add a best price flag to any quote that matches the lowest price found
     */
    public static function calculateBestPrice(string $collectionKey = self::QUOTE_COLLECTION_KEY): \Closure
    {
        return function($a) use ($collectionKey){

            /**
             * Loop all the quotes find the lowest price per boq_item_id
             */
            $index = [];
            $collection = $a->getCollection($collectionKey);
            foreach($collection->getItems() as $item){
                foreach($item->getCollection("quote") as $quote) {
                    $rate  = floatval($quote->get("rate"));
                    $boqId = $quote->get("boq_item_id");
                    if(!isset($index[$boqId]) || $rate < $index[$boqId]) {
                        $index[$boqId] = $rate;
                    }
                }
            }

            /**
             * As subcontractors can provide the same price for an item, check if there price is the same as the
             * lowest found
             */
            $a->set($collectionKey, $collection->map(function($q) use($index) {
                return $q->set("quote", $q->getCollection("quote")->map(function($quote) use($index) {
                    $itemIndex = $index[$quote->get("boq_item_id")];
                    return $quote->set("best_price", ($itemIndex === floatval($quote->get("rate"))));
                }));
            }));
        };
    }

    /**
     * @return \Closure
     */
    public static function addQuoteHistory(): \Closure
    {
        return function($a){
            $tid = $a->get("boq.tender.id");
            $pid = $a->get("boq.tender.project_id");
            $sid = $a->get("uriArgs.sid");
            $status = $a->get("types")->filterByField("uid", "tender_returned")->first();
            Manager::getService("project")->write("project/$pid/tender/$tid/history", new Shape(["data" =>
                [
                    "specialist_id"         => $sid,
                    "author_id"             => $sid,
                    "status_id"             => $status->get("id"),
                    "tender_history_type"   => 'Enquiry',
                    "meta"                  => []
                ]
            ]));
        };
    }

    /**
     * @param string $documentDataKey
     * @param string $downloadPathKey
     * @param string $documentSaveKey
     * @param string $zipName
     * @return \Closure
     */
    public static function downloadDocuments(string $documentDataKey, string $downloadPathKey, string $documentSaveKey = 'zip', string $zipName = 'documents.zip'): \Closure
    {
        return function($a) use ($documentDataKey, $downloadPathKey, $documentSaveKey, $zipName){
            if ($documents = $a->get($documentDataKey)) {
                Manager::getService("s3")->downloadDocumentsAsArchive(
                    "document",
                    $documents,
                    $zipName,
                    $a->get($downloadPathKey),
                );
                $document_content = file_get_contents( sprintf("%s/%s", $a->get($downloadPathKey), $zipName));
                $res = Manager::getService('s3')->uploadContent(
                    "document",
                    sprintf("%s/quotes/%s/%s", Config::get("environment"), $a->get("uriArgs.sid"), $zipName),
                    $document_content,
                );
                if($res->get("ObjectURL")){
                    $a->set($documentSaveKey, $document_content);
                }
            }
        };
    }

    /**
     * @param string $revisionDataKey
     * @param string $output_name
     * @return \Closure
     */
    public static function getRevisionToS3(string $revisionDataKey, string $output_name = 'Tender Addendum.pdf'): \Closure
    {
        return function($a) use ($revisionDataKey, $output_name){
            try {
                $a->set("pdf", ['name' => $output_name]);
                $eid = $a->get($revisionDataKey);
                $save_file = Config::get('boq.revision.save.tmp')."/quote-$eid.pdf";
                $revision_path = sprintf("%s/%s/%s","quotes", $a->get("uriArgs.sid"), $eid);
                BoqPdfMiddleware::getS3UploadedKey($revision_path)($a);
                $a->set("revision", [
                    'key'  => $a->get("uploaded_key"),
                    'file' => $save_file
                ]);
            } catch (\Exception $e) {
                throw new MiddlewareException("quoteRevisionDownloadFail", $e->getMessage());
            }
        };
    }

    /**
     * @param string $collectionKey
     * @param string $outputKey
     * @return \Closure
     */
    public static function groupQuoteItemsByPublishedVersion(string $collectionKey = self::QUOTE_COLLECTION_KEY, string $outputKey = self::QUOTE_HISTORY_KEY): \Closure
    {
        return function ($a) use ($collectionKey, $outputKey) {
            $latestQuotes = [];
            $a->get($collectionKey)->mapChild("quote",function ($quotes, $quote) use (&$latestQuotes) {
                $quoteData = $quotes;
                if($quote){
                    //filter not published quotes
                    if($quote['status_id'] !== self::BOQ_QUOTE_SENT_ID){ return $quote; }
                    $boqItemId    = (int)$quote['boq_item_id'];
                    $version      = (int)$quote['version'];
                    $prev_version = $version - 1;
                    $sid = $quoteData->get("subcontractor_id");
                    $latestQuotes[$sid][$version]['ids'][] = $boqItemId;
                    $latestQuotes[$sid][$version]['quote_items'][$boqItemId] = $quote;
                    $latestQuotes[$sid][$version]['version'] = $version;
                    if(isset($latestQuotes[$sid][$prev_version])) {
                        $diff = array_diff($latestQuotes[$sid][$prev_version]['ids'], $latestQuotes[$sid][$version]['ids']);
                        $latestQuotes[$sid][$version]['ids'] = array_merge($latestQuotes[$sid][$version]['ids'], $diff);
                        foreach($diff as $value){
                            $latestQuotes[$sid][$version]['quote_items'][$value] = $latestQuotes[$sid][$prev_version]['quote_items'][$value] ?? [];
                        }
                    }
                }
            });
            $a->set($outputKey, (new Collection($latestQuotes, Shape::class)));
        };
    }

    /**
     * @param string $historyKey
     * @param string $outputKey
     * @return \Closure
     */
    public static function quoteHistoryCalculateSectionPrices(string $historyKey = self::QUOTE_HISTORY_KEY, string $outputKey = self::QUOTE_HISTORY_KEY): \Closure
    {
        return function ($a) use ($historyKey, $outputKey) {
            $headers = [];
            $programmeWeeks = $a->get("programme_weeks");
            $a->getCollection($historyKey)->map(function($quotes, $sid) use (&$headers){
                foreach($quotes->toArray() as $quoteData) {
                    $itemsCollection = (new Collection($quoteData["quote_items"], Shape::class));
                    $itemsCollection->sortByKeys();
                    $version = $quoteData["version"];
                    $itemsCollection->map(function($q) use ($version, &$headers, &$sections, &$section_name, $sid){
                        if($q->get("item_mapping.type") === "section"){
                            $section_name = strtolower(str_replace(" ", "_", $q->get("item_mapping.description")));
                            $sections[$section_name] = 0;
                        }
                        if(isset($section_name)) {
                            $sections[$section_name] += $q->get("rate") * $q->get("item_mapping.quantity");
                            $headers[$sid][$version] = [
                                'version' => $version,
                                'created_at' => $q->get("created_at"),
                                'sections' => $sections
                            ];
                        }
                    });
                }
            });
            foreach($headers as $sid => &$header){
                foreach($header as $index => &$data){
                    $version = $data['version'];
                    $data['sections']['quotation_price'] = array_sum($data['sections']);
                    $data['sections']['weeks'] = $programmeWeeks[$sid][$version] ?? ["id"=>0, "text"=>0, "id_account"=>$sid];
                }
            }
            $a->set($outputKey, $headers);
        };
    }

}
