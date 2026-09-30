<?php

namespace Prosper\Model;

class Document
{

    /**
     * @var array
     */
    protected array $document;

    public function __construct(array $document, int $aid = 0)
    {
        $this->document = $document[$aid] ?? $document;
    }

    /**
     * @return mixed
     */
    public function getID(): mixed
    {
        return $this->document['id'] ?? null;
    }

    /**
     * @return mixed|null
     */
    public function getUrl(): mixed
    {
        return $this->document['url'] ?? null;
    }

    /**
     * @return string
     */
    public function getType(): string
    {
        return ($this->document['is_tender_addendum'] ?? false) ? 'tender_addendum' : 'enquiry';
    }
}
