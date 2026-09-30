<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ResourceMappingRelactionCascade extends AbstractMigration
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
        try{
            $this->table('boq_resource_mapping')
                ->dropForeignKey('boq_resource_id')
                ->update();
        }catch (\Exception $e) {
            $this->output->writeln('Error: ' . $e->getMessage());
        }
        $this->table('boq_resource_mapping')
            ->addForeignKey('boq_resource_id', 'boq_resource', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('boq_id', 'boq_entity', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->update();

        $types = $this->fetchAll('SELECT * FROM boq_resource_type');
        $typeProgramme = 'programme_weeks';
        $typeNote = 'programme_weeks';
        foreach ($types as $type) {
            if ($type['label'] === 'programme_weeks') {
                $typeProgramme = $type['id'];
            }
            if ($type['label'] === 'exclusion_allowances_note') {
                $typeNote = $type['id'];
            }
        }

        $entities = $this->fetchAll('SELECT * FROM boq_entity');
        foreach ($entities as $entity) {
            $idBoq = $entity['id'];
            $idTender = $entity['tender_id'];

            $transactions = $this->fetchAll('SELECT * FROM transaction where tender_id = ' . $idTender);
            foreach ($transactions as $transaction) {
                $note = $transaction['note'] ?? "";
                $programme = $transaction['programme'] ?? "";

                $this->table('boq_resource')->insert(['text' => $note])->save();
                $idResource = $this->getAdapter()->getConnection()->lastInsertId();
                $this->table('boq_resource_mapping')->insert([
                    'boq_resource_id' => $idResource,
                    'boq_id' => $idBoq,
                    'boq_resource_type_id' => $typeNote,
                ])->save();
                $idMappingResource = $this->getAdapter()->getConnection()->lastInsertId();
                $this->table('boq_resource_version')->insert([
                    'boq_resource_mapping_id' => $idMappingResource,
                    'status' => 2
                ])->save();

                $this->table('boq_resource')->insert(['text' => $programme])->save();
                $idResource = $this->getAdapter()->getConnection()->lastInsertId();
                $this->table('boq_resource_mapping')->insert([
                    'boq_resource_id' => $idResource,
                    'boq_id' => $idBoq,
                    'boq_resource_type_id' => $typeProgramme,
                ])->save();
                $idMappingResource = $this->getAdapter()->getConnection()->lastInsertId();
                $this->table('boq_resource_version')->insert([
                    'boq_resource_mapping_id' => $idMappingResource,
                    'status' => 2
                ])->save();
            }
        }
    }
}
