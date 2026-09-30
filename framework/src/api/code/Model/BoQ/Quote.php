<?php

namespace Api\Model\BoQ;

use Core\Data\Collection;

class Quote
{
    /**
     * @param Collection $quote
     * @param int $version
     * @param int $sid
     * @return array
     * @throws \Exception
     */
    public static function getSubcontractorDocumentsByVersion(Collection $quote, int $sid, int $version = 1): array
    {
        $quote = $quote->filterByStringField("subcontractor_id", $sid);
        $documents = $quote->first()->get("document");
        if($version) {
            $found = [];
            $documents = array_filter($documents, function ($document) use ($version, &$found) {
                if(!in_array($document['name'], $found)) {
                    $found[] = $document['name'];
                    return (int)$document['quote_version'] === $version;
                }
                return false;
            });
        }
        return array_values($documents);
    }
}
