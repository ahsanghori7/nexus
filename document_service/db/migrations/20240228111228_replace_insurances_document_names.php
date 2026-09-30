<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ReplaceInsurancesDocumentNames extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        //Set correct name for insurances documents
        $this->execute(
            'UPDATE document SET name = ? WHERE name = ?',
            ['Schedule Professional Indemnity', 'Professional Indemnity']
        );
        $this->execute(
            'UPDATE document SET name = ? WHERE name = ?',
            ['Schedule Public Liability', 'Public Liability']
        );

        //Set correct name for insurances requests
        $this->execute(
            'UPDATE document_request SET label = ? WHERE label = ?',
            ['Schedule Professional Indemnity', 'Professional Indemnity']
        );
        $this->execute(
            'UPDATE document_request SET label = ? WHERE label = ?',
            ['Schedule Public Liability', 'Public Liability']
        );

        // Delete old records from default certificates
        $this->execute(
            'DELETE FROM document_default_certificates WHERE name = ?',
            ['Professional Indemnity']
        );
        $this->execute(
            'DELETE FROM document_default_certificates WHERE name = ?',
            ['Public Liability']
        );
    }
}
