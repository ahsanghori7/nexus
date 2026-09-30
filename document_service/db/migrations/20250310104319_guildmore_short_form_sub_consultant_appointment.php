<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use App\Infrastructure\Environment as Env;

final class GuildmoreShortFormSubConsultantAppointment extends AbstractMigration
{
    /**
     * Migrate Up.
     */
    public function up(): void
    {
        $table       = $this->table('document');
        $environment = Env::getValue("ENVIRONMENT", "production");
        $type        = 2; // contractual
        $subtype     = 6; // custom order

        // Insert data
        $data = [
            [
                'name'      => 'Short Form Sub-Consultant Appointment',
                'type'      => $type,
                'subtype'   => $subtype,
                'status'    => 1,
                's3_key'    => "$environment/templates/orders/guildmore-short-form-sub-consultant-appointment.json",
                's3_bucket' => 'document',
                'meta'      => '{"config": {"slug": "guildmore_short_form_subconsultant_appointment","version": "1.0"},"document": {"version": "1.0.0"}}'
            ]
        ];

        $table->insert($data)->save();
    }

    /**
     * Migrate Down.
     */
    public function down(): void
    {
        $environment = Env::getValue("ENVIRONMENT", "production");

        // Delete the specific row
        $this->execute("
            DELETE FROM document
            WHERE name = 'Short Form Sub-Consultant Appointment'
              AND s3_key = '$environment/templates/orders/guildmore_short_form_subconsultant_appointment'
        ");
    }
}
