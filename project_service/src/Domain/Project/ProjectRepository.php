<?php

declare(strict_types=1);

namespace App\Domain\Project;

use App\Domain\AbstractRepository;
use App\Domain\Project\BoQ\Entity;
use App\Domain\Project\BoQ\Item;
use App\Domain\Project\BoQ\ItemMapping;
use App\Domain\Project\BoQ\ItemVersion;
use App\Domain\Project\BoQ\Resource;
use App\Domain\Project\BoQ\ResourceMapping;
use App\Domain\Project\BoQ\ResourceVersion;
use App\Domain\Project\BoQ\ResourceType;
use App\Domain\Project\BoQ\QuoteItem;
use App\Domain\Project\BoQ\Unit;
use App\Domain\Transaction\Transaction;
use App\Domain\Transaction\TransactionDocument;
use App\Domain\Transaction\TransactionType;
use App\Infrastructure\Persistence\S3;
use App\Domain\Project\TeamMemberRole;
use App\Domain\Project\TeamMemberRoleMapping;
use App\Domain\Project\Integration\ProjectIntegration;
use App\Domain\TenderRecommendation\TenderRecommendation;

/**
 * Class ProjectRepository
 * @package App\Domain\Project
 */
class ProjectRepository extends AbstractRepository
{
  /**
   * Allow a default model to be set for get model function
   */
  const DEFAULT_MODEL = "project";

  /**
   * @var string[]
   */
  protected $models = [
    "project" => Project::class,
    "projectOwnerMapping" => ProjectOwnerMapping::class,
    "package" => Package::class,
    "tender" => Tender::class,
    "tenderHistory" => TenderHistory::class,
    "tenderHistoryType" => TenderHistoryStatus::class,
    "tenderHistoryArchive" => TenderHistoryArchive::class,
    "tenderDependency" => TenderDependency::class,
    "transaction" => Transaction::class,
    "transactionDocument" => TransactionDocument::class,
    "transactionType" => TransactionType::class,
    "instruction" => Instruction::class,
    "instructionType" => InstructionType::class,
    "instructionStatus" => InstructionStatus::class,
    "unit" => Unit::class,
    "boqEntity" => Entity::class,
    "boqItem" => Item::class,
    "boqItemMapping" => ItemMapping::class,
    "boqItemVersion" => ItemVersion::class,
    "boqResource" => Resource::class,
    "boqResourceMapping" => ResourceMapping::class,
    "boqResourceVersion" => ResourceVersion::class,
    "boqQuoteItem" => QuoteItem::class,
    "boqResourceType" => ResourceType::class,
    "project_entity_status" => Statuses::class,
    "teamMemberRole" => TeamMemberRole::class,
    "teamMemberRoleMapping" => TeamMemberRoleMapping::class,
    "project_integration_mapping" => ProjectIntegration::class,
    "tender_recommendation" => TenderRecommendation::class,
  ];

  /**
   * @param array $data
   */
  /**
   * Run a unit of work inside a database transaction, returning whatever the
   * callback returns. Any exception rolls the whole unit back.
   *
   * @param callable $work
   * @return mixed
   */
  public function transaction(callable $work)
  {
    return $this->getModel()->getConnection()->transaction($work);
  }

  public function createProjectMapping(array $data): void
  {
    $model = $this->getModel('projectOwnerMapping');
    if (!isset($data['type'])) {
      $data['type'] = ProjectOwnerMapping::DEFAULT_TYPE;
    }
    $model::create($data);
  }

  /**
   * @codeCoverageIgnore
   * @return array
   */
  public function constants()
  {

    $constants = [
      'project' => [
        'type' => [
          21 => 'Civils & Infrastructure',
          22 => 'Commercial',
          23 => 'High-end Residential',
          24 => 'Housing',
          25 => 'Industrial',
          26 => 'Public Sector',
          27 => 'Mixed-Use',
          28 => 'Commercial Fit Out',
          29 => 'Facade Remediation',
          30 => 'Life Sciences',
          31 => 'Data Centres',
          32 => 'Pharmaceutical',
          33 => 'Semi-Conductor',
          34 => 'Advanced Manufacturing',
          35 => 'Healthcare'

        ],
        'status' => [
          0 => 'pending',
          1 => 'publish',
          2 => 'private',
          3 => 'draft'
        ],
        'phase' => [
          0 => 'Tender',
          1 => 'Secured Contract',
          2 => 'Two-Stage Tender',
          3 => 'Negotiated Tender'
        ],
        'insurances' => [
          0 => 'Not Applicable',
          1 => '£1 Million',
          2 => '£2 Million',
          3 => '£5 Million',
          4 => '£10 Million',
          5 => '£15 Million',
          6 => '£20 Million',
          7 => 'Other'
        ],
        'team_role' => [
          "Project Director" => 1,
          "Commercial Director" => 2,
          "Commercial Manager" => 3,
          "Quantity Surveyor" => 4,
          "Assistant Quantity Surveyor" => 5,
          "Procurement Lead" => 6,
          "Package Manager" => 7,
          "Construction Manager" => 8,
          "Project Manager" => 9,
          "Site Manager" => 10,
          "General Foreman" => 11,
          "Site Engineer" => 12,
          "Logistics Manager" => 13,
          "Design Manager" => 14,
          "Technical Coordinator" => 15,
          "MEP Manager" => 16,
          "Planner" => 17,
          "Package Planner" => 18,
          "Health & Safety Manager" => 19,
          "Health & Safety Advisor" => 20,
          "Environmental Manager" => 21,
          "Quality Manager" => 22,
          "Temporary Works Coordinator" => 23,
          "Client Liaison Manager" => 24,
          "Employer’s Agent" => 25,
          "Legal Counsel" => 26,
          "Insurance Manager" => 27,
          "Cost Manager" => 28,
          "Performance Manager" => 29,
          "Community Liaison Manager" => 30,
          "Digital Construction Manager" => 31,
          "Supply Chain Manager" => 32,
          "Pre-Construction Manager" => 33,
          "Structural Engineer" => 34,
          "Services Engineer" => 35,
          "Principal Contractor " => 36,
          "Principal Designer" => 37
        ],
        "notice_period_commence_work_on_site" => [
          "1 week",
          "2 weeks",
          "3 weeks",
          "4 weeks"
        ],
        "comment_period_subcontractor_drawings" => [
          "1 week",
          "2 weeks",
          "3 weeks",
          "4 weeks",
          "6 weeks",
          "8 weeks"
        ],
        "does_sectional_completion_apply" => [
          "Applies",
          "Does not apply"
        ],
        "retention_release_date" => [
          "3 months after the Rectification Period",
          "6 months after the Rectification Period",
          "12 months after the Rectification Period",
          "18 months after the Rectification Period",
          "24 months after the Rectification Period"
        ],
        "prime_cost_addition_for_materials" => [
          "N/A",
          "0%",
          "5%",
          "10%",
          "15%",
          "20%",
          "25%"
        ],
        "prime_cost_addition_for_plant" => [
          "N/A",
          "0%",
          "5%",
          "10%",
          "15%",
          "20%",
          "25%"
        ],
        "rectification_defects_period" => [
          "12 months",
          "24 months"
        ],
        "retention" => [
          "0%",
          "1%",
          "2%",
          "3%",
          "4%",
          "5%"
        ],
      ],
      'pricing_document' => [
        'packages' => [
          'Groundworks',
          'Steelwork',
          'Brickwork',
          'First Fix Carpentry',
          'Roof Finishes and Cladding',
          'Rainwater Systems',
          'Windows and External Doors',
          'Architectural Metal and Glazing',
          'Mechanical - Plumbing',
          'Electrical',
          'Drylining',
          'Second Fix Carpentry',
          'Kitchens and Joinery',
          'Tiling',
          'Floor Finishes',
          'Painting and Wall Papering',
          'Utilities',
          'Hard and Soft Landscape',
        ]
      ],
      'tender' => [
        'size' => [
          14 => 'Packages £100k to £250k',
          15 => 'Packages £250k to £500k',
          16 => 'Packages £25k to £100k',
          17 => 'Packages £500k to £1m',
          18 => 'Packages £5k to £25k',
          19 => 'Packages over £1m',
          20 => 'Packages up to £5k',
          559 => 'To Be Confirmed',
        ],
        'service' => [
          27 => 'Consultant',
          28 => 'Design and Supply',
          29 => 'Design Only',
          30 => 'Design, Supply and Install',
          31 => 'Install Only',
          32 => 'Supply and Install',
          33 => 'Supply Only',
          443 => 'Maintenance',
          528 => 'Hire',
          529 => 'Rope Access',
        ],
        'state' => [
          'suggested',
          'draft',
          'published'
        ],
        'default' => [
          'service' => 27,
          'size'    => 559
        ],
        'dependency' => [
          1 => 'tender_return',
          2 => 'start_on_site',
          3 => 'send_date',
        ]
      ],
      'default_categories' => [
        'Architectural',
        'Structural',
        'M&E',
        'Pricing document',
      ],
    ];

    if (isset($constants['project']['type']) && is_array($constants['project']['type'])) {
      asort($constants['project']['type']);
    }

    return $constants;
  }

  /**
   * @param int $pid
   * @param string $label
   * @param array $data
   * @param array $packages
   * @return \App\Domain\AbstractModel
   * @throws \App\Domain\DomainException
   */
  public function createTender(int $pid,  string $label, array $data, array $packages = [])
  {
    $group = $this->getModel("tender");
    $mapping = $this->getModel("package");

    $data["project_id"] = $pid;
    $data["label"] = $label;
    if (empty($data['reference_no'])) {
        $data['reference_no'] = $this->generateTenderReferenceNo($pid);
    }
    $data['status'] = $this->resolveTenderStatus($data['service'] ?? null, $data['start_on_site'] ?? null, !empty($packages));
    $group->fill($data)->save();

    if (!empty($packages)) {
      $rows = array_map(static function ($id) use ($group) {
        return [
          "package_id" => $id,
          "tender_id" => $group->getId(),
        ];
      }, $packages);

      $mapping::insert($rows);
    }
    return $group;
  }

  /**
   * Derives a tender's status from whether it has a service, a start_on_site
   * date, and at least one attached package. 0 factors -> needs_setup,
   * 1-2 factors -> in_progress, all 3 -> ready.
   *
   * @param mixed $service
   * @param mixed $startOnSite
   * @param bool $hasPackages
   * @return string
   */
  public function resolveTenderStatus($service, $startOnSite, bool $hasPackages): string
  {
    $metCount = count(array_filter([!empty($service), !empty($startOnSite), $hasPackages]));

    return match (true) {
      $metCount === 0 => 'needs_setup',
      $metCount === 3 => 'ready',
      default => 'in_progress',
    };
  }

  /**
   * @param int $pid
   * @param array $tenders
   * @return array
   * @throws \App\Domain\DomainException
   */
  public function bulkCreateTender(int $pid, array $tenders): array
  {
    $created = [];
    $existingLabels = $this->getModel("tender")
      ->where("project_id", $pid)
      ->pluck("label")
      ->all();
    $existingLabelsLower = array_map(fn ($label) => mb_strtolower($label, "UTF-8"), $existingLabels);
    $seenLabels = [];

    foreach ($tenders as $tender) {
      $label = is_array($tender) ? ($tender["label"] ?? false) : false;
      $packages = is_array($tender) ? ($tender["packages"] ?? []) : [];

      if (!$label || !is_array($packages)) {
        continue;
      }
      $labelLower = mb_strtolower($label, "UTF-8");
      if (in_array($labelLower, $existingLabelsLower, true) || in_array($labelLower, $seenLabels, true)) {
        continue;
      }
      unset($tender["packages"]);

      $seenLabels[] = $labelLower;
      $group = $this->createTender($pid, $label, $tender, $packages);
      $created[] = $group->getId();
    }

    return $created;
  }

  /**
   * @param int $pid
   * @param array $tenderIds
   * @return array
   */
  public function bulkDeleteTender(int $pid, array $tenderIds): array
  {
    $validIds = $this->getModel("tender")
      ->where("project_id", $pid)
      ->whereIn("id", $tenderIds)
      ->pluck("id")
      ->map(fn($id) => (int) $id)
      ->all();

    if ($validIds) {
      $this->getModel("tender")->whereIn("id", $validIds)->delete();
    }

    return $validIds;
  }

  /**
   * @param array $data
   * @return \App\Domain\AbstractModel
   * @throws \App\Domain\DomainException
   */
  public function addTenderHistory(array $data): \App\Domain\AbstractModel
  {
    $history = $this->getModel('tenderHistory');
    $history->store($data);
    return $history;
  }

  /**
   * @param int $pid
   * @param array $records
   * @return array
   */
  public function bulkAddTenderHistory(int $pid, array $records): array
  {
    // Distinct tender ids referenced by the incoming records
    $tenderIds = [];
    foreach ($records as $record) {
      $tenderIds[(int)($record["tender_id"] ?? 0)] = true;
    }
    unset($tenderIds[0]);

    // Validate every tender belongs to the project in a single query
    $validTenderIds = [];
    if ($tenderIds) {
      foreach (
        $this->getModel("tender")
          ->where("project_id", $pid)
          ->whereIn("id", array_keys($tenderIds))
          ->get() as $tender
      ) {
        $validTenderIds[(int)$tender["id"]] = true;
      }
    }

    $rows = [];
    $skipped = [];
    foreach ($records as $record) {
      $tid = (int)($record["tender_id"] ?? 0);
      if (!isset($validTenderIds[$tid])) {
        $skipped[$tid] = $tid;
        continue;
      }

      $rows[] = [
        "tender_id"           => $tid,
        "specialist_id"       => (int)$record["specialist_id"],
        "author_id"           => (int)$record["author_id"],
        "status_id"           => (int)$record["status_id"],
        "tender_history_type" => $record["tender_history_type"],
        "meta"                => json_encode($record["meta"] ?? ""),
      ];
    }

    if ($rows) {
      $this->getModel("tenderHistory")->insert($rows);
    }

    return [
      "inserted" => count($rows),
      "skipped"  => array_values($skipped),
    ];
  }

  /**
   * @param array $ids
   * @return array
   * @throws \Exception
   */
  public function getPackagesByTenderId(array $ids)
  {
    $packages = [];
    foreach ($this->getModel('package')->whereIn('tender_id', $ids)->get() as $row) {
      $packages[$row["tender_id"]][] = $row["package_id"];
    }
    return $packages;
  }

  /**
   * @param int $pid
   * @return array
   */
  public function getBoqQuoteDocumentsByProject(int $pid): array
  {
    $entities = $this->getBoqEntitiesWithEntriesByProject($pid);
    $itemToEntity = $entities->isEmpty() ? [] : $this->mapBoqItemsToEntities($entities);
    $txToEntity = $this->mapQuoteTransactionsToEntities($itemToEntity);
    $txIdsWithDocs = $this->getTransactionIdsWithDocuments($txToEntity);

    return $this->mapQuoteDocumentTransactionsByTender($txToEntity, $txIdsWithDocs);
  }

  /**
   * @param int $pid
   * @return mixed
   */
  private function getBoqEntitiesWithEntriesByProject(int $pid)
  {
    return $this->getModel('boqEntity')
      ->select('id', 'tender_id')
      ->whereHas('tender', function ($query) use ($pid) {
        $query->where('project_id', $pid);
      })
      ->with(['entries' => function ($query) {
        $query->select('id', 'boq_entity_id');
      }])
      ->get();
  }

  /**
   * @param mixed $entities
   * @return array
   */
  private function mapBoqItemsToEntities($entities): array
  {
    $itemToEntity = [];
    foreach ($entities as $entity) {
      foreach ($entity->entries as $item) {
        $itemToEntity[$item->id] = $entity->id;
      }
    }

    return $itemToEntity;
  }

  /**
   * @param array $itemToEntity
   * @return array
   */
  private function mapQuoteTransactionsToEntities(array $itemToEntity): array
  {
    if (empty($itemToEntity)) {
      return [];
    }

    $quoteItems = $this->getModel('boqQuoteItem')
      ->select('transaction_id', 'boq_item_id')
      ->whereIn('boq_item_id', array_keys($itemToEntity))
      ->get();

    $txToEntity = [];
    foreach ($quoteItems as $qi) {
      $txToEntity[$qi->transaction_id] = $itemToEntity[$qi->boq_item_id];
    }

    return $txToEntity;
  }

  /**
   * @param array $txToEntity
   * @return array
   */
  private function getTransactionIdsWithDocuments(array $txToEntity): array
  {
    if (empty($txToEntity)) {
      return [];
    }

    return $this->getModel('transactionDocument')
      ->select('transaction_id')
      ->whereIn('transaction_id', array_keys($txToEntity))
      ->distinct()
      ->pluck('transaction_id')
      ->all();
  }

  /**
   * @param array $txToEntity
   * @param array $txIdsWithDocs
   * @return array
   */
  private function mapQuoteDocumentTransactionsByTender(array $txToEntity, array $txIdsWithDocs): array
  {
    if (empty($txIdsWithDocs)) {
      return [];
    }

    $transactions = $this->getModel('transaction')
      ->select('id', 'tender_id')
      ->whereIn('id', $txIdsWithDocs)
      ->get();

    $result = [];
    foreach ($transactions as $tx) {
      $eid = $txToEntity[$tx->id];
      $result[$tx->tender_id][$tx->id] = $eid;
    }

    return $result;
  }

  /**
   * @return array
   * @throws \Exception
   */
  public function aggregateTenderTransactionFiles($model): array
  {

    $rows  = $model->get()->toArray();

    $trkeys = array_fill_keys(
      $this->getModel("transaction")->getColumnNames("", ["id as trans_id", "tender_id", "type_id"]),
      true
    );

    $files = [];
    $s3Files = [];
    $pidsFetched = [];

    //Group the Tender transaction by tender id
    foreach ($rows as $tender => $row) {

      $pid = $row["project_id"];
      $tid = $row["tender_id"] ?? $row['tid'];

      $transaction = array_intersect_key($row, $trkeys);
      if (!$transaction['status_id']) {
        continue;
      }

      $sid = $this->resolveTransactionSubcontractorId($transaction);
      $qid = $transaction['id'] ?: null;
      $this->loadProjectQuoteFiles($pid, $s3Files, $pidsFetched);

      $files[$tid][$transaction['id']] = $this->findTransactionQuoteFileUrl($s3Files, $pid, $tid, $sid, $qid);
      $files[$tid]["sid"] = $sid;
    }

    return $files;
  }

  /**
   * In legacy the subcontractor can be manually added to the quote and therefore there is no user id created
   * in account service. We use the md5 of the subcontractor name as a substitute of the user id.
   *
   * @param array $transaction
   * @return mixed|string
   */
  private function resolveTransactionSubcontractorId(array $transaction)
  {
    $sid = $transaction["subcontractor_id"];
    if ($sid != -1) {
      return $sid;
    }

    $meta = json_decode($transaction['meta'] ?? '');
    if (isset($meta->subcontractor_name)) {
      return md5($meta->subcontractor_name);
    }

    return $sid;
  }

  /**
   * @param int $pid
   * @param array $s3Files
   * @param array $pidsFetched
   * @return void
   */
  private function loadProjectQuoteFiles(int $pid, array &$s3Files, array &$pidsFetched): void
  {
    if (isset($pidsFetched[$pid])) {
      return;
    }

    $s3Files += S3::getAllTransactionQuoteFilesForProject($pid);
    $pidsFetched[$pid] = true;
  }

  /**
   * @param array $s3Files
   * @param int $pid
   * @param int $tid
   * @param mixed $sid
   * @param int|string|null $qid
   * @return string|null
   */
  private function findTransactionQuoteFileUrl(array $s3Files, int $pid, int $tid, $sid, $qid = null): ?string
  {
    $candidateKeys = S3::getTransactionQuoteCandidateKeys($pid, $tid, $sid . '.zip', $qid);
    foreach ($candidateKeys as $key) {
      if (isset($s3Files[$key])) {
        return $s3Files[$key];
      }
    }

    return null;
  }

  /**
   * Per-file quote document metadata for a project, grouped by tender id and transaction id.
   *
   * @param int $pid
   * @return array
   */
  public function getTransactionDocumentsByProject(int $pid): array
  {
    $rows = $this->getModel('transactionDocument')
      ->select(
        'transaction_document.id',
        'transaction_document.transaction_id',
        'transaction_document.name',
        'transaction_document.quote_version',
        'transaction_document.created_at',
        'transaction.tender_id'
      )
      ->join('transaction', 'transaction.id', '=', 'transaction_document.transaction_id')
      ->join('tender', 'tender.id', '=', 'transaction.tender_id')
      ->where('tender.project_id', $pid)
      ->orderBy('transaction_document.id')
      ->get()
      ->toArray();

    $documents = [];
    foreach ($rows as $row) {
      $tid = $row['tender_id'];
      $qid = $row['transaction_id'];

      if (!isset($documents[$tid][$qid])) {
        $documents[$tid][$qid] = [
          'count' => 0,
          'documents' => [],
        ];
      }

      $documents[$tid][$qid]['documents'][] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'quote_version' => $row['quote_version'],
        'created_at' => $row['created_at'],
      ];
      $documents[$tid][$qid]['count']++;
    }

    return $documents;
  }

  /**
   * Replace-or-insert the metadata row for one uploaded quote file. A re-upload
   * of the same filename replaces the zip entry, so the row follows suit.
   *
   * @param int $transactionId
   * @param string $name
   * @param string $s3Key
   * @return int
   */
  public function replaceTransactionDocument(int $transactionId, string $name, string $s3Key): int
  {
    $model = $this->getModel('transactionDocument');
    $model->where(['transaction_id' => $transactionId, 'name' => $name])->delete();

    return (int)$model->store([
      'transaction_id' => $transactionId,
      'quote_version' => 1,
      'name' => $name,
      's3_key' => $s3Key,
    ])->getId();
  }

  /**
   * @param null $filter_status
   * @param null $filter_type_id
   * @return array
   * @throws \Exception
   */
  public function aggregateTenderTransaction($model, $filter_status = null, $filter_type_id = null)
  {
    $rows  = $model->get()->toArray();

    $pkeys = array_fill_keys($this->getModel("project")->getColumnNames("", ["id"]), true);
    $tkeys = array_fill_keys($this->getModel("tender")->getColumnNames("", ["id"]), true);
    $trkeys = array_fill_keys(
      $this->getModel("transaction")->getColumnNames("", ["id as trans_id", "tender_id", "type_id"]),
      true
    );

    $tender_ids = [];
    foreach ($rows as $tender => $row) {
      $tender_ids[] = $row["tid"];
    }

    $packages = $this->getPackagesByTenderId(array_unique($tender_ids));
    $transaction_model = $this->getModel("transactionType")->findAll();
    $transaction_types = [];
    foreach ($transaction_model as $transaction) {
      $transaction_types[$transaction['id']] = $transaction['label'];
    }
    $data = [];

    $format_keys = ['price', 'measured_work', 'prelims', 'other_items'];

    $prices_history = [];
    $budget_history = [];
    $pid = 0;
    /*
       * Deprecated needs to be removed in the future
       */
    $gia = 0;
    //Group the Tender transaction by tender id
    foreach ($rows as $tender => $row) {
      $pid = $row["project_id"];
      $tid = $row["tender_id"] ?? $row['tid'];

      if (!isset($data[$pid])) {

        $data[$pid] = array_intersect_key($row, $pkeys);
        $data[$pid]["tender"] = [];
        $data[$pid]['created_at'] = $row['pca'] ?? '';
        $data[$pid]["sids"] = [];
        /**
         * To keep the order of the array we loose the project id from the key so we need an extra key to get the id from
         */
        $data[$pid]['pid'] = $pid;
      }
      if (!isset($data[$pid]["tender"][$tid])) {
        $data[$pid]["tender"][$tid] = array_intersect_key($row, $tkeys);
        $data[$pid]["tender"][$tid]["packages"] = $packages[$tid] ?? [];
      }

      $transaction = array_intersect_key($row, $trkeys);

      if (!$transaction['status_id']) {
        continue;
      }

      /*
           * Filter transaction by status id
           */
      if ($filter_status && $transaction['status_id'] != $filter_status) {
        continue;
      }

      /*
          * Filter transaction by type id
          */
      if ($filter_type_id && isset($row['type_id']) && $row['type_id'] != $filter_type_id) {
        continue;
      }


      $transaction["quote_created"] = $row["qca"];
      $transaction["order_created"] = $row["oca"];
      $transaction["has_boq_quotes"] = (bool)count($row["last_quote"]);
      $type    = $transaction_types[$row["type_id"]];
      $sid     = $transaction["subcontractor_id"];

      /**
       * Add the subcontractor ids to be able to get their information in a bulk action
       * We only add the subcontractor for active transaction and for existing user ids
       */
      if ($transaction['status_id'] == 1 && $sid != -1) {
        $data[$pid]["sids"][$sid][$tid] = $sid;
      }

      if (!isset($prices_history[$tid])) {
        $prices_history[$tid] = 0;
      }

      /**
       * If the transaction is
       *                    a quote,
       *                    compliant,
       *                    active
       * we need to store the price from the quote
       */
      if ($type == 'Quote' && $transaction['compliant'] && $transaction['status_id'] == 1) {
        if ($transaction['price'] > $prices_history[$tid]) {
          $prices_history[$tid] = (float)$transaction['price'];
        }
        /*
             * If the contractor specifically selected a price that means that we will use that price
             * for the summary calculation even if that price is not the lowest price for that tender
            */
        if ($transaction['price_selected']) {
          $prices_history[$tid] = (float)$transaction['price'];
        }
      }

      /**
       * In legacy the subcontractor can be manually added to the quote and therefore there is no user id created
       * in account service
       * We will use the md5 of the subcontractor name as a substitute of the user id
       */
      if ($sid == -1) {
        $meta = json_decode($transaction['meta'] ?? '');
        if (isset($meta->subcontractor_name)) {
          $sid = md5($meta->subcontractor_name);
        }
      }

      $data[$pid]["tender"][$tid][$type]['transactions'][$sid]["transaction"][] = $transaction;
    }

    $data[$pid]['summary'] = $this->summary([
      'gia' => $gia,
      'budget' => array_sum($budget_history),
      'forecast_cost' => array_sum($prices_history),
    ]);

    return $data;
  }

  /**
   * @param array $values
   * @return array
   */
  public function summary(array $values): array
  {
    $profit_loss = $values['budget'] - $values['forecast_cost'];
    $budget = (int) $values['budget'];
    $gia = (int) $values['gia'];
    $forecast = (int) $values['forecast_cost'];

    $budget_cost = ($budget && $forecast) ? ($forecast / $budget) : 0;
    $forecast_cost_per_ft2 = ($forecast && $gia) ? ($forecast / $gia) : 0;
    $profit_loss_percent = ($budget_cost) ? (($budget - $forecast) / $budget * 100) : 0;
    return [
      'profit_loss' => number_format($profit_loss, 2),
      'budget' => number_format($budget, 2),
      'forecast_cost' => number_format($forecast, 2),
      'profit_loss_percent' => number_format($profit_loss_percent), //for percent we don't need decimal
      'budget_cost' => number_format($budget_cost, 2),
      'forecast_cost_per_ft2' => number_format($forecast_cost_per_ft2, 2)
    ];
  }

  /**
   * @return array
   * @throws \Exception
   */
  public function getSummary($model): array
  {
    $transactions = $this->aggregateTenderTransaction($model);
    $transactions = array_shift($transactions);
    return $transactions['summary'] ?? [];
  }

  /**
   * @param int $projectId
   * @return array
   */
  public function getProjectDashboardSummary(int $projectId): array
  {
    $tenderIds = $this->getModel('tender')
      ->where('project_id', $projectId)
      ->pluck('id')
      ->all();

    if (empty($tenderIds)) {
      return [];
    }

    $summary = [];
    foreach ($tenderIds as $tenderId) {
      $summary[$tenderId] = [
        'interest_count' => 0,
        'enquiries_sent' => 0,
        'unique_quote_count' => 0,
        'total_quote_count' => 0,
      ];
    }

    $historyCounts = $this->getProjectDashboardHistoryCounts($projectId);
    foreach ($historyCounts as $row) {
      $tid = (int)$row['tender_id'];
      $count = (int)$row['history_count'];

      if (($row['tender_history_type'] ?? '') === 'Interest') {
        $summary[$tid]['interest_count'] = $count;
      } elseif (($row['tender_history_type'] ?? '') === 'Enquiry') {
        $summary[$tid]['enquiries_sent'] = $count;
      }
    }

    $quoteCounts = $this->getProjectDashboardQuoteCounts($projectId);
    foreach ($quoteCounts as $row) {
      $tid = (int)$row['tender_id'];
      $summary[$tid]['unique_quote_count']++;
      $summary[$tid]['total_quote_count'] += (int)$row['quote_count'];
    }

    return $summary;
  }

  /**
   * @param int $projectId
   * @return array
   */
  private function getProjectDashboardHistoryCounts(int $projectId): array
  {
    $rankedHistory = $this->getModel('tenderHistory')
      ->selectRaw("
        tender_history.tender_id,
        tender_history.specialist_id,
        tender_history.tender_history_type,
        tender_history.status_id,
        ROW_NUMBER() OVER (
          PARTITION BY tender_history.tender_id, tender_history.specialist_id, tender_history.tender_history_type
          ORDER BY tender_history.created_at DESC, tender_history.id DESC
        ) AS rn
      ")
      ->join('tender', 'tender.id', '=', 'tender_history.tender_id')
      ->where('tender.project_id', $projectId)
      ->whereIn('tender_history.tender_history_type', ['Interest', 'Enquiry']);

    return $this->getModel('tenderHistory')
      ->fromSub($rankedHistory, 'ranked_history')
      ->selectRaw('ranked_history.tender_id, ranked_history.tender_history_type, COUNT(*) as history_count')
      ->join('tender_history_status', 'tender_history_status.id', '=', 'ranked_history.status_id')
      ->where('ranked_history.rn', 1)
      ->whereNotIn('tender_history_status.uid', ['dismissed', 'deleted', 'added'])
      ->groupBy(['ranked_history.tender_id', 'ranked_history.tender_history_type'])
      ->get()
      ->toArray();
  }

  /**
   * @param int $projectId
   * @return array
   */
  private function getProjectDashboardQuoteCounts(int $projectId): array
  {
    return $this->getModel('transaction')
      ->selectRaw('transaction.tender_id, transaction.subcontractor_id, COUNT(*) as quote_count')
      ->join('tender', 'tender.id', '=', 'transaction.tender_id')
      ->where('tender.project_id', $projectId)
      ->groupBy(['transaction.tender_id', 'transaction.subcontractor_id'])
      ->get()
      ->toArray();
  }

  /**
   * @param int $tender_parent_id
   * @param int $tender_child_id
   * @return bool
   * @throws \Exception
   * if we want to map a child that has already the current tender id as parent
   * If we try to map the child with the same id as the parent id
   * B -> C -> D
   * C -> B -> D conflict
   * In the above example C is depedendent of the package B therefore we cannot make the package B dependent of package C
   */
  public function checkDepedencyConfict(int $tender_parent_id, int $tender_child_id): bool
  {
    if ($tender_child_id === $tender_parent_id) {
      return true;
    }
    $dependencyModel = $this->getModel("tenderDependency")->where([
      "tender_parent_id" => $tender_parent_id,
      "tender_id"        => $tender_child_id
    ]);
    return $dependencyModel->exists();
  }

  /**
   * @param array $dependency
   * @return void
   * @throws \App\Domain\DomainException
   * if the mapped tender id has no record as the parent
   */
  public function createDependencyParent(array $dependency): void
  {
    $dependencyParentModel = $this->getModel("tenderDependency")->where(["tender_id" => $dependency['tender_parent_id']]);
    if (!$dependencyParentModel->exists()) {
      $dependency['tender_id'] = $dependency['tender_parent_id'];
      $dependency['tender_parent_id'] = null;
      $this->getModel("tenderDependency")->store($dependency);
    }
  }

  /**
   * @param int $tid
   * @param bool $first_level
   * @return array
   * @throws \Exception
   */
  public function getDependenciesChildrenByTenderId(int $tid, bool $first_level = true): array
  {
    $dependency_key = $first_level ? 'dependency' : 'dependencies';
    $dependencies = $this->getModel("tenderDependency")
      ->where(["tender_id" => $tid])
      ->with($dependency_key);

    if ($dependencies->exists()) {
      foreach ($dependencies->get()->toArray() as $key => $dependency) {
        if ($dependency[$dependency_key]) {
          if ($first_level) {
            unset($dependency[$dependency_key]);
            $result[$key] = [
              'tender_child_id' => $dependency['tender_parent_id'],
              'tender_dependency_key' => $dependency['tender_dependency_key'],
              'tender_dependency_child_key' => $dependency['tender_dependency_parent_key'],
            ];
            continue;
          }
          $dependency['dependency'] = $dependency[$dependency_key];
        }
        if (isset($dependency['dependency']) && $dependency['dependency']) {
          $result[$key] = $dependency['dependency'];
        }
      }
    }

    return $result ?? [];
  }

  /**
   * @param int $tid
   * @param bool $first_level
   * @return array
   * @throws \Exception
   */
  public function getDependenciesParentsByTenderId(int $tid, bool $first_level = true): array
  {
    $dependency_key = $first_level ? 'dependency' : 'dependencies';
    $dependencies = $this->getModel("tenderDependency")
      ->where(["tender_parent_id" => $tid])
      ->with($dependency_key);

    if ($dependencies->exists()) {
      foreach ($dependencies->get()->toArray() as $key => $dependency) {
        if ($dependency[$dependency_key]) {
          if ($first_level) {
            unset($dependency[$dependency_key]);
            $result[] = [
              'tender_parent_id' => $dependency['tender_id'],
              'tender_dependency_key' => $dependency['tender_dependency_key'],
              'tender_dependency_parent_key' => $dependency['tender_dependency_parent_key'],
            ];
            continue;
          }
          $dependency['dependency'] = $dependency[$dependency_key];
        }
        if (isset($dependency['dependency']) && $dependency['dependency']) {
          $result[] = $dependency['dependency'];
        }
      }
    }

    return $result ?? [];
  }

  /**
   * @param array $tenderIds
   * @param string $type
   * @return array
   */
  public function getProjectDependenciesByTenderIds(array $tenderIds, string $type = 'parent'): array
  {
    if (empty($tenderIds)) {
      return [];
    }

    return $type === 'parent'
      ? $this->getProjectParentDependenciesByTenderIds($tenderIds)
      : $this->getProjectChildrenDependenciesByTenderIds($tenderIds);
  }

  /**
   * @param array $tenderIds
   * @return array
   */
  protected function getProjectParentDependenciesByTenderIds(array $tenderIds): array
  {
    $rows = $this->getModel("tenderDependency")
      ->select([
        'tender_id',
        'tender_parent_id',
        'tender_dependency_key',
        'tender_dependency_parent_key',
      ])
      ->whereIn('tender_parent_id', $tenderIds)
      ->get()
      ->toArray();

    $dependenciesByParentId = [];
    foreach ($rows as $row) {
      if (isset($row['tender_parent_id']) && !is_null($row['tender_parent_id'])) {
        $dependenciesByParentId[(int)$row['tender_parent_id']][] = $row;
      }
    }

    $activeDependencyTenderIds = $this->getActiveDependencyTenderIds($tenderIds);

    $result = [];
    foreach ($tenderIds as $tenderId) {
      $result[$tenderId] = [];
      foreach ($dependenciesByParentId[$tenderId] ?? [] as $dependency) {
        if (isset($activeDependencyTenderIds[(int)$dependency['tender_parent_id']])) {
          $result[$tenderId][] = [
            'tender_parent_id' => $dependency['tender_id'],
            'tender_dependency_key' => $dependency['tender_dependency_key'],
            'tender_dependency_parent_key' => $dependency['tender_dependency_parent_key'],
          ];
        }
      }
    }

    return $result;
  }

  /**
   * @param array $tenderIds
   * @return array
   */
  protected function getProjectChildrenDependenciesByTenderIds(array $tenderIds): array
  {
    $rows = $this->getModel("tenderDependency")
      ->select([
        'tender_id',
        'tender_parent_id',
        'tender_dependency_key',
        'tender_dependency_parent_key',
      ])
      ->whereIn('tender_id', $tenderIds)
      ->get()
      ->toArray();

    $dependenciesByTenderId = [];
    $parentIds = [];
    foreach ($rows as $row) {
      if (isset($row['tender_id'])) {
        $dependenciesByTenderId[(int)$row['tender_id']][] = $row;
      }
      if (isset($row['tender_parent_id']) && !is_null($row['tender_parent_id'])) {
        $parentIds[] = (int)$row['tender_parent_id'];
      }
    }

    $activeDependencyTenderIds = $this->getActiveDependencyTenderIds(array_values(array_unique($parentIds)));

    $result = [];
    foreach ($tenderIds as $tenderId) {
      $result[$tenderId] = [];
      foreach ($dependenciesByTenderId[$tenderId] ?? [] as $dependency) {
        if (isset($activeDependencyTenderIds[(int)$dependency['tender_parent_id']])) {
          $result[$tenderId][] = [
            'tender_child_id' => $dependency['tender_parent_id'],
            'tender_dependency_key' => $dependency['tender_dependency_key'],
            'tender_dependency_child_key' => $dependency['tender_dependency_parent_key'],
          ];
        }
      }
    }

    return $result;
  }

  /**
   * @param array $tenderIds
   * @return array
   */
  protected function getActiveDependencyTenderIds(array $tenderIds): array
  {
    if (!$tenderIds) {
      return [];
    }

    $rows = $this->getModel("tenderDependency")
      ->select(['tender_id'])
      ->whereIn('tender_id', $tenderIds)
      ->groupBy('tender_id')
      ->get()
      ->toArray();

    $activeDependencyTenderIds = [];
    foreach ($rows as $row) {
      if (isset($row['tender_id'])) {
        $activeDependencyTenderIds[(int)$row['tender_id']] = true;
      }
    }

    return $activeDependencyTenderIds;
  }

  /**
   * @param bool $latestHistoryOnly
   * @return array
   * @throws \Exception
   */
  public function aggregateTenderHistory($model, bool $latestHistoryOnly = false)
  {
    $rows  = $model->get()->toArray();
    $pkeys = array_fill_keys($this->getModel("project")->getColumnNames("", ["id"]), true);
    $tkeys = array_fill_keys($this->getModel("tender")->getColumnNames("", ["id"]), true);
    $hkeys = array_fill_keys(
      $this->getModel("tenderHistory")->getColumnNames("", ["id", "tender_id", "tender_history_type"]),
      true
    );

    $tender_ids = [];
    foreach ($rows as $tender => $row) {
      $tender_ids[] = $row["tid"];
    }

    $packages = $this->getPackagesByTenderId(array_unique($tender_ids));

    $data = [];
    $lastStatus = [];
    //Group the Tender history by tender id
    foreach ($rows as $tender => $row) {
      $pid = $row["project_id"];
      $tid = $row["tender_id"] ?? $row['tid'];

      if (!isset($data[$pid])) {
        $data[$pid] = array_intersect_key($row, $pkeys);
        $data[$pid]["tender"] = [];
        $data[$pid]['created_at'] = $row['pca'] ?? '';
        $data[$pid]["sids"] = [];
        /**
         * To keep the order of the array we loose the project id from the key so we need an extra key to get the id from
         */
        $data[$pid]['pid'] = $pid;
      }

      $data[$pid]["project_creator"] = $row["project_creator"] ?? null;
      $data[$pid]["group_id"] = $row["group_id"] ?? null;

      if (!isset($data[$pid]["tender"][$tid])) {
        $data[$pid]["tender"][$tid] = array_intersect_key($row, $tkeys);
        $data[$pid]["tender"][$tid]["packages"] = $packages[$tid] ?? [];
        $data[$pid]["tender"][$tid]["decision_date"] = $row["decision_date"];
        $data[$pid]["tender"][$tid]["subcontract_work_finish"] = $row["subcontract_work_finish"];
      }

      $history = array_intersect_key($row, $hkeys);
      if (!$history['status_id']) {
        continue;
      }
      //Not Ideal.... we need to alias the created_at col, as its overriden by the project created_at col
      $history["created_at"] = $row["ca"];
      $type    = $row["tender_history_type"];
      $sid     = $row["specialist_id"];
      if (!$latestHistoryOnly) {
        $data[$pid]["tender"][$tid][$type][$sid]["history"][] = $history;
      }
      $data[$pid]["tender"][$tid][$type][$sid]["archived"] = $row["archived"] ?? false;

      //We dont need to update the order key when the status is viewed
      if ($history['status_id'] != 5) {
        if (!isset($data[$pid]['updated_at'])) {
          $data[$pid]['updated_at'] = $history["created_at"];
        } elseif (new \DateTime($history["created_at"]) > new \DateTime($data[$pid]['updated_at'])) {
          $data[$pid]['updated_at'] = $history["created_at"];
        }
      }

      $k = md5($tid . $sid . $type);
      if (!isset($lastStatus[$k])) {
        $lastStatus[$k] = false;
      }

      if (!$lastStatus[$k] || (new \DateTime($history["created_at"]) > new \DateTime($lastStatus[$k]))) {
        $lastStatus[$k] = $history["created_at"];
        $data[$pid]["tender"][$tid][$type][$sid]["last_status"] = $history["status_id"];
        if ($latestHistoryOnly) {
          $data[$pid]["tender"][$tid][$type][$sid]["last_history"] = $history;
        }
        //Keep track of all the ids for quick account loading later
        $data[$pid]["sids"][$sid][$tid] = $history["status_id"];
      }
    }

    return $data;
  }

  /**
   * @param int $projectId
   * @return array
   */
  public function getProjectInterests(int $projectId): array
  {
    $rankedInterest = $this->getModel('tenderHistory')
      ->selectRaw("
        tender_history.tender_id as id,
        tender.label,
        tender_history.specialist_id as cid,
        tender_history_status.uid as status_uid,
        ROW_NUMBER() OVER (
          PARTITION BY tender_history.tender_id, tender_history.specialist_id
          ORDER BY tender_history.created_at DESC, tender_history.id DESC
        ) as rn
      ")
      ->join('tender', 'tender.id', '=', 'tender_history.tender_id')
      ->join('tender_history_status', 'tender_history_status.id', '=', 'tender_history.status_id')
      ->where('tender.project_id', $projectId)
      ->where('tender_history.tender_history_type', 'Interest')
      ->whereNotNull('tender_history.specialist_id');

    return $this->getModel('tenderHistory')
      ->fromSub($rankedInterest, 'ranked_interest')
      ->select([
        'ranked_interest.id',
        'ranked_interest.label',
        'ranked_interest.cid',
      ])
      ->where('ranked_interest.rn', 1)
      ->whereIn('ranked_interest.status_uid', ['viewed', 'sent'])
      ->orderBy('ranked_interest.id')
      ->orderBy('ranked_interest.cid')
      ->get()
      ->toArray();
  }

  /**
   * @param string $name
   * @return string
   */
  public function generateSlug(string $name)
  {
    $slug = preg_replace("/[^a-zA-Z0-9]+/", "-", strtolower(trim($name)));
    return trim($slug, '-');
  }

  /**
   * Get project integration by project ID and provider ID
   *
   * @param int $projectId
   * @param int $providerId
   * @return ProjectIntegration|null
   */
  public function getProjectIntegration(int $projectId, int $providerId): ?ProjectIntegration
  {
    $model = $this->getModel('project_integration_mapping');
    $result = $model::where([
      'project_id' => $projectId,
      'provider_id' => $providerId
    ])->first();

    return $result ?: null;
  }

  /**
   * Save project integration (insert or update)
   * Uses try-catch to prevent race conditions with concurrent requests
   *
   * @param int $projectId
   * @param int $providerId
   * @param array $data
   * @return int Integration ID
   * @throws \Exception
   */
  public function saveProjectIntegration(int $projectId, int $providerId, array $data): int
  {
    $model = $this->getModel('project_integration_mapping');

    $now = date('Y-m-d H:i:s');

    $integrationData = [
      'project_id' => $projectId,
      'provider_id' => $providerId,
      'integration_id' => $data['integration_id'] ?? null,
      'integration_name' => $data['integration_name'] ?? null,
      'integration_uri' => $data['integration_uri'] ?? null,
      'meta' => isset($data['meta']) ? json_encode($data['meta']) : null,
      'created_at' => $now,
      'updated_at' => $now
    ];

    // Try to insert first (optimistic path for new records)
    try {
      $integration = $model::create($integrationData);
      return $integration->id;
    } catch (\Illuminate\Database\QueryException $e) {
      // Check if error is due to unique constraint violation
      // MySQL: error code 1062, SQLSTATE 23000, message contains "Duplicate entry"
      // PostgreSQL: SQLSTATE 23505, message contains "UNIQUE constraint" or "duplicate key"
      $errorCode = $e->getCode();
      $errorMessage = $e->getMessage();
      $isDuplicateKey =
        $errorCode == 1062 || // MySQL duplicate key error code
        $errorCode == 23000 || // SQLSTATE for integrity constraint violation
        strpos($errorMessage, 'Duplicate entry') !== false || // MySQL error message
        strpos($errorMessage, 'UNIQUE constraint') !== false || // PostgreSQL error message
        strpos($errorMessage, 'duplicate key') !== false; // PostgreSQL alternative message

      if ($isDuplicateKey) {
        // Record already exists due to concurrent insert, update it instead
        $existing = $model::where([
          'project_id' => $projectId,
          'provider_id' => $providerId
        ])->first();

        if ($existing) {
          // Remove created_at from update data to preserve original timestamp
          unset($integrationData['created_at']);
          $existing->update($integrationData);
          return $existing->id;
        }
      }
      // Re-throw if it's a different error
      throw $e;
    }
  }

  /**
   * @param int $projectId
   * @return string
   * @throws \App\Domain\DomainException
   */
  public function generateTenderReferenceNo(int $projectId): string
  {
    $project = $this->getModel('project')->find($projectId);
    $abbr = strtoupper(substr(
        preg_replace('/[^A-Za-z]/', '', $project->name),
        0,
        3
    ));

    $last = $this->getModel('tender')
      ->where('project_id', $projectId)
      ->whereNotNull('reference_no')
      ->orderBy('id', 'desc')
      ->first();
    $next = 1;

    if ($last && preg_match('/-(\d+)$/', $last->reference_no, $m)) {
      $next = ((int)$m[1]) + 1;
    }
    return sprintf('%s-%03d', $abbr, $next);
  }
}
