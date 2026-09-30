<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

require 'Mockup.php';

class Fixture extends AbstractMigration
{

    const ENVIRONMENT = 'development';
    const CONTRACTOR_ID = 1;

    /**
     * @var int
     */
    public int $contractor_id = 0;

    /**
     * @var int
     */
    public int $subcontractor_id = 0;

    /**
     * @var int
     */
    public int $project_id = 0;

    /**
     * @var array
     */
    public array $tender = [];

    /**
     * @var array
     */
    public array $tenders = [];

    /**
     * @var Mockup
     */
    public Mockup $mockup;

    /**
     * @var array
     */
    public array $project = [];

    /**
     * @var array
     */
    public array $project_data = [];

    /**
     * @param int $contractor_id
     * @return void
     */
    public function setContractorId(int $contractor_id): void
    {
        $this->contractor_id = $contractor_id;
    }

    /**
     * @return int
     */
    public function getContractorId(): int
    {
        return $this->contractor_id;
    }

    /**
     * @return int
     */
    public function getProjectId(): int
    {
        return $this->project_id;
    }

    /**
     * @param string $data_path
     * @return array
     */
    public function getMockupData(string $data_path): array
    {
        $data = $this->mockup->load($data_path);
        return $data[static::ENVIRONMENT] ?? [];
    }

    /**
     * @param int $length
     * @return string
     */
    public function generateSimpleRandomString(int $length = 16): string
    {
        $characters = 'abcdefghijklmnopqrstuvwxyz';
        $characters = str_shuffle($characters);
        return substr($characters, 0, $length);
    }

    /**
     * @param string $name
     * @return string
     */
    public function generateUniqueName(string $name = ''): string
    {
        if($name) {
            $raw_name = trim(str_replace("{Unique}", "", $name));
            $exist = $this->fetchRow("SELECT COUNT(*) AS total FROM project where name = '" . $raw_name . "' ");
            if ($exist['total']) {
                $exist_like = $this->fetchRow("SELECT COUNT(*) AS total FROM project where name LIKE '%" . $raw_name . "%' ");
                return (string)($exist_like['total']);
            }
            return "";
        }

        return $this->generateSimpleRandomString();
    }

    /**
     * @param string $project_name
     * @return string|void
     */
    public function generateSlugFromProjectName(string $project_name = '')
    {
        if($project_name){
            $slug = preg_replace("/[^a-zA-Z0-9]+/", "-", strtolower(trim($project_name)));
            return trim($slug,'-');
        }
    }

    public function getModel(string $model)
    {
        return $this->mockup->getModel($model);
    }

    /**
     * @return int[]
     */
    public function getSubcontractorsMapping(): array
    {
        $mapping = [];
        $subcontractor_ids = $this->mockup->getArg("subcontractor_ids");
        if($subcontractor_ids){
            $sids = explode(",", $subcontractor_ids);
            if($sids){
                foreach($sids as $index => $sid){
                    ++$index;
                    $mapping["SubcontractorId$index"] = $sid;
                }
            }
        }
        return $mapping;
    }

    /**
     * @param array $project_data
     * @return void
     */
    public function replaceProjectShortcodes(array &$project_data): void
    {
        $shortcodeModel = $this->getModel("shortcodes");
        foreach ($project_data as &$value) {
            if (is_array($value)) {
                $this->replaceProjectShortcodes($value);
            }elseif($value) {
              $value = (string)$value;
              foreach($shortcodeModel->getShortcodesList() as $shortcode){
                  if ( $shortcodeModel->hasShortcode($value, $shortcode) ) {
                      $shortcodeModel->replaceShortcode($this, $value, [$project_data['name'] ?? '']);
                  }
              }
            }
        }
        $this->setProjectData($project_data);
    }

    /**
     * @param array $project
     * @return void
     */
    public function setProject(array $project): void
    {
        $this->project = $project;
    }

    /**
     * @return array
     */
    public function getProject(): array
    {
        return $this->project;
    }

    /**
     * @param string|null $key
     * @param $return
     */
    public function getProjectData(string $key = null, $return = null)
    {
        if($key){
            return $this->project_data[$key] ?? $return;
        }
        return $this->project_data;
    }

    /**
     * @param array $project_data
     * @return void
     */
    public function setProjectData(array $project_data): void
    {
        $this->project_data = $project_data;
    }

    /**
     * @return int
     */
    public function getLastInsertedId(): int
    {
        return (int)$this->getAdapter()->getConnection()->lastInsertId();
    }

    /**
     * @param array $projects
     * @return void
     */
    public function createProject(array $projects): void
    {
        foreach($projects as $project_data){
            $this->setProjectData($project_data);
            $this->replaceProjectShortcodes($project_data);
            $this->setProject($this->getProjectData("project"));
            $this->table('project')->insert($this->getProject())->save();
            $this->project_id = $this->getLastInsertedId();
            $this->createTenders($this->getProjectData("tenders"));
        }
    }

    /**
     * @param array $tender
     * @return void
     */
    public function createTender(array $tender): void
    {
        $tender_table_data = array_diff_key($tender, array_flip(['packages', 'boq_state', 'history', 'quotes', 'boq']));
        $this->table('tender')->insert($tender_table_data + ['project_id' => $this->getProjectId()])->save();
        $tender_id = $this->getLastInsertedId();
        $this->tenders[$tender_id] = $tender + ['id' => $tender_id, 'boq_state' => $tender['boq_state'] ?? null];

        //package mapping
        if($packages = $tender['packages'] ?? []) {
            foreach ($packages as $package) {
                $this->table('package_mapping')->insert([
                    'package_id' => $package,
                    'tender_id'  => $tender_id
                ])->save();
            }
        }

        //tender history
        if($history = $tender['history'] ?? []){
            foreach($history as $history_data){
                $this->table('tender_history')->insert($history_data + ['tender_id' => $tender_id])->save();
            }
        }

        //quotes
        $quotes_ids = [];
        if($quotes = $tender['quotes'] ?? []){
            foreach($quotes as $quote_data){
                $this->table('transaction')->insert($quote_data + ['tender_id' => $tender_id])->save();
                $quotes_ids[] = $this->getLastInsertedId();
            }
        }

        //boq
        if($boq = $tender['boq'] ?? []){
            //boq entity
            $this->table('boq_entity')->insert([
                'tender_id' => $tender_id
            ])->save();
            $entity_id = $this->getLastInsertedId();
            foreach($boq as $boq_data){
                //boq items
                $this->table('boq_item')->insert([
                    'boq_entity_id' => $entity_id
                ])->save();
                $boq_item_id = $this->getLastInsertedId();
                //boq item mapping
                $boq_data_table_data = array_diff_key($boq_data, array_flip(['note','version','status','quote']));
                $this->table('boq_item_mapping')->insert($boq_data_table_data + ['boq_item_id' => $boq_item_id])->save();
                //boq item version
                $this->table('boq_item_version')->insert([
                    'boq_item_mapping_id' => $this->getLastInsertedId(),
                    'version'             => $boq_data['version'] ?? 1,
                    'status'              => $boq_data['status']  ?? 2,
                ])->save();
                //boq item note
                if($boq_data['type'] === "item") {
                    $this->addNote($boq_item_id, "item", $boq_data['note']);
                }

                //boq item quote
                if(isset($boq_data['quote'])){
                    foreach($boq_data['quote'] as $quote){
                        $quote['version'] ??= 1;
                        $quote['status_id'] ??= 3;
                        $quote['transaction_id'] = $quotes_ids[$quote['transaction_index'] - 1];
                        $quote['boq_item_id']    = $boq_item_id;
                        unset($quote['transaction_index']);
                        $this->table('boq_quote_item')->insert($quote)->save();
                    }
                }
            }
        }
    }

    /**
     * @param array $tenders
     * @return void
     */
    public function createTenders(array $tenders): void
    {
        foreach ($tenders as $tender) {
            $this->createTender($tender);
        }
    }

    /**
     * @param int $id
     * @param string $type
     * @param string $note
     * @return void
     */
    public function addNote(int $id, string $type, string $note = ''): void
    {
        //boq note
        $this->table('boq_note')->insert([
            'text' => $note
        ])->save();
        $note_id = $this->getLastInsertedId();
        //boq note mapping
        $this->table('boq_note_mapping')->insert([
            'note_id' => $note_id,
            'boq_id'  => $id,
            'type'    => "boq_$type",
        ])->save();
    }
}
