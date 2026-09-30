<?php

namespace App\Models;

use App\Api\Document;
use App\Api\Document\TenderTemplate;
use App\DocCreator\DownloadManager\DownloadManagerFactory;

class DownloadManager extends Abstraction
{
    /**
     * Label of the token type that opens the download page.
     */
    public const TOKEN_LABEL = 'download_manager';

    private static array $tokens = [];
    private ?string $source = null;
    private mixed $userModel = null;
    private mixed $recipient = null;
    private int $tenderId = 0;

    public function setSource(?string $source): void
    {
        $this->source = $source;
    }

    public function setUser(mixed $user): void
    {
        $this->userModel = $user;
    }

    /**
     * @param mixed $recipient
     */
    public function setRecipient(mixed $recipient): void
    {
        $this->recipient = $recipient;
    }

    /**
     * @param int $tenderId
     */
    public function setTenderId(int $tenderId): void
    {
        $this->tenderId = $tenderId;
    }

    /**
     * @param array $data
     * @return mixed
     */
    public function getDownloadLink(array $data = []): mixed
    {
        $nd        = (string) ($data['numbered_document'] ?? '');
        $reference = strtolower((string) ($data['reference'] ?? 'asite'));

        $isPreview = ($this->source === 'preview');
        $isQueue   = ($this->source === 'queue');

        if (!$isPreview && !$isQueue) {
            return sprintf('{%s_LINK}', $nd);
        }

        try {
            $documentId = $this->getId();
            $token      = '';

            if ($isQueue) {
                $token = $this->issueToken((int) $documentId);
            }

            $result = DownloadManagerFactory::make($reference)->getLinks([$nd], [
                'document_id'   => $documentId,
                'document_type' => self::resolveDocumentType((int) $documentId),
                'token'         => $token,
                'source'        => $this->source,
                'base_url'      => $isQueue ? rtrim((string) config('url.site'), '/') : '',
            ]);

            return $result[$nd] ?? null;

        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * @param int $documentId
     * @return string
     */
    private function issueToken(int $documentId): string
    {
        if (!$this->userModel) {
            return '';
        }

        $recipientId = (int) ($this->recipient?->getId() ?? 0);

        $cacheKey = $documentId . ':' . $recipientId;
        if (isset(self::$tokens[$cacheKey])) {
            return self::$tokens[$cacheKey];
        }

        $meta = ['tender_id' => $this->tenderId, 'document_id' => $documentId];

        if ($recipientId > 0) {
            $meta['subcontractor_id'] = $recipientId;
        } else {
            error_log("DownloadManager: no recipient for document {$documentId}; its link cannot be attributed or withdrawn");
        }

        $request = $this->userModel->createTokenByLabel(
            (int) $this->userModel->getId(),
            self::TOKEN_LABEL,
            $meta
        );

        $json = $request->json()['data'] ?? [];

        return self::$tokens[$cacheKey] = (string) ($json['token'] ?? '');
    }

    public static function resolveDocumentType(int $documentId): string
    {
        try {
            $categories = Document::getTemplateCategories($documentId);

            $category = $categories->filterByField('entity_type', 'order_template')->getFirst();
            if ($category && $category->getId()) {
                return 'order';
            }

            $category = $categories->filterByField('entity_type', 'tender_template')->getFirst();
            if ($category && $category->getId()) {
                $doc = Document::getDocument($documentId);
                $name = $doc['name'] ?? '';
                return TenderTemplate::isTenderAddendum($name) ? 'addendum' : 'enquiry';
            }
        } catch (\Exception $e) {
            // Fall through to default
        }

        return 'enquiry';
    }
}
