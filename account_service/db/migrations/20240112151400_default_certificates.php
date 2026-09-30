<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

class DefaultCertificates extends AbstractMigration
{
    public function change()
    {
        // Insert data into account_prequalification_sections
        $this->table('account_prequalification_sections')
            ->insert([
                ['id' => null, 'label' => 'health-safety'],
                ['id' => null, 'label' => 'health-safety-environmental-qualifications'],
                ['id' => null, 'label' => 'environmental'],
                ['id' => null, 'label' => 'quality'],
                ['id' => null, 'label' => 'example-documents'],
            ])
            ->save();
    }
}
