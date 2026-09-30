<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSpecialistIdIndexToTenderHistory extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('tender_history');

        if (!$this->indexExists('idx_th_type_tender')) {
            $table->addIndex(['tender_history_type', 'tender_id'], [
                'name'   => 'idx_th_type_tender',
                'unique' => false,
            ]);
        }

        if (!$this->indexExists('idx_th_specialist_created')) {
            $table->addIndex(['specialist_id', 'created_at'], [
                'name'   => 'idx_th_specialist_created',
                'unique' => false,
            ]);
        }

        $table->update();
    }

    public function down(): void
    {
        $table = $this->table('tender_history');

        if ($this->indexExists('idx_th_type_tender')) {
            $table->removeIndexByName('idx_th_type_tender');
        }

        if ($this->indexExists('idx_th_specialist_created')) {
            $table->removeIndexByName('idx_th_specialist_created');
        }

        $table->update();
    }

    private function indexExists(string $name): bool
    {
        return (bool) $this->fetchRow(sprintf(
            "SHOW INDEX FROM `tender_history` WHERE Key_name = '%s'",
            addslashes($name)
        ));
    }
}
