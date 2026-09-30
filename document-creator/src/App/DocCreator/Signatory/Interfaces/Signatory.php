<?php

namespace App\DocCreator\Signatory\Interfaces;

use App\DocCreator\Signatory\Signer\AbstractSigner;
use App\Models\Document as DocumentModel;
use App\Models\UserModel;

/**
 * Interface SignatoryInterface
 */
interface Signatory
{

    public function create(): void;

    /**
     * @param UserModel $user
     */
    public function addSigner(UserModel $user): void;

    /**
     * @param DocumentModel $document
     */
    public function addDocument(DocumentModel $document): void;

    /**
     * @param string $envelope_id
     */
    public function preview(string $envelope_id): void;

    /**
     * @param string $envelope_id
     * @param string $return_url
     * @return string
     */
    public function getSignerLink(string $envelope_id, string $return_url): string;

    /**
     * @return string
     */
    public function getEnvelopeId(): string;
}
