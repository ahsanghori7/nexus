<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class MclarenTemplateNameCleanup extends AbstractMigration
{
    protected $tableName = 'document';
    protected $type = 2;

    protected $renames = [
        ['suffix' => 'templates/orders/mclaren/mcl-com-sc-700-v0-jct-dbsub-2024.json', 'to' => 'JCT Design and Build Subcontract 2024'],
        ['suffix' => 'templates/orders/mclaren/2016-mclaren-jct.json', 'to' => 'JCT Design and Build Subcontract 2016'],
        ['suffix' => 'templates/orders/mclaren/domestic-short-order.json', 'to' => 'Domestic Short Order for Minor Works'],
        ['suffix' => 'templates/tenders/mclaren/mcLaren-enquiry-letter-2024.json', 'to' => 'Enquiry Letter 2024'],
        ['suffix' => 'templates/tenders/mclaren/enquiry-letter-wording-clink-mark-up.json', 'to' => 'Enquiry Letter 2016'],
        ['suffix' => 'templates/orders/mclaren/mclaren-short-form-consultant-appointment.json', 'to' => 'Short Form Consultant Appointment'],
        ['suffix' => 'templates/orders/mclaren/long-form-consultant-appointment.json', 'to' => 'Long Form Consultant Appointment'],
    ];

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
        foreach ($this->renames as $rename) {
            $this->execute(
                'UPDATE ' . $this->tableName . ' SET name = ? WHERE s3_key LIKE ? AND type = ? AND status = 1',
                [$rename['to'], '%' . $rename['suffix'], $this->type]
            );
        }
    }
}
