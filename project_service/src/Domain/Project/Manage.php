<?php


namespace App\Domain\Project;


use App\Infrastructure\Persistence\S3;
use Slim\Psr7\UploadedFile;

class Manage
{
  /**
   * @var callable|null
   */
  private static $repositoryFactory = null;

  public static $meta_keys = [
    'post_site_location' => 'site_address_one',
    'post_postcode' => 'site_address_postcode',
    'post_insurance_employer' => 'employer_liabilty_insurance',
    'post_insurance_public' => 'public_product_insurance',
  ];

  public static $insurances_values = [
    'Not Applicable' => 0,
    '£1 Million' => 1,
    '£2 Million' => 2,
    '£5 Million' => 3,
    '£10 Million' => 4,
    '£15 Million' => 5,
    '£20 Million' => 6,
  ];

  public const DEFAULT_PROJECT_TYPE = 22;
  public const DEFAULT_PROJECT_STATUS = 0;
  public const DEFAULT_PROJECT_PHASE = 0;
  public const DEFAULT_PROJECT_REGION = 15;
  public const DEFAULT_TENDER_SIZE = 559;
  public const DEFAULT_TENDER_SERVICE = 27;
  public const INSURANCES_OTHER_KEY = 7;

  /**
   * @param callable|null $factory
   */
  public static function setRepositoryFactory($factory): void
  {
      self::$repositoryFactory = $factory;
  }

  /**
   * @return ProjectRepository
   */
  private static function projectRepository(): ProjectRepository
  {
      if (self::$repositoryFactory) {
          $repo = \call_user_func(self::$repositoryFactory);
          if (!$repo instanceof ProjectRepository) {
              throw new \RuntimeException('Project repository factory must return ' . ProjectRepository::class);
          }
          return $repo;
      }

      return new ProjectRepository();
  }

  /**
   * @param int $id
   * @return int|mixed
   */
  public static function getProjectStatusId(string $status)
  {
      $projectRepo = self::projectRepository();
      $constants = $projectRepo->constants();
      foreach($constants['project']['status'] as $k => $v){
        if($v == $status)
        {
          return $k;
        }
      }
      return self::DEFAULT_PROJECT_STATUS;
  }

  /**
   * @param int $id
   * @param array $values
   */
  public static function createProject(int $id, array $values)
  {

    $projectRepo = self::projectRepository();

    if(!isset($values['meta']['post_type']) || !$values['meta']['post_type']){
      $values['meta']['post_type'] = self::DEFAULT_PROJECT_TYPE;
    }
    if(!isset($values['meta']['post_location']) || !$values['meta']['post_location']){
      $values['meta']['post_location'] = self::DEFAULT_PROJECT_REGION;
    }

    $start = explode("-", $values['meta']['post_start_date']);
    $start = $start[2] . "-" . $start[1] . "-" . $start[0];

    $end = explode("-", $values['meta']['post_completion_date']);
    $end = $end[2] . "-" . $end[1] . "-" . $end[0];

    $data = [
      "id" => $id,
      "name" => $values['post_title'],
      "slug" => $values['post_name'],
      "group_id" => $values['owner'] ?? $values['post_author'],
      "logo" => $values['meta']['post_logo'] ?? '',
      "type" => $values['meta']['post_type'],
      "region" => $values['meta']['post_location'],
      "reference" => $values['meta']['post_reference'],
      "start" => $start,
      "end" => $end,
      "description" => $values['post_content'],
      "created_at" => $values['post_date'],
      'status' => self::getProjectStatusId($values['post_status'])
    ];

    try{
      $projectRepo->create($data);

      $projectRepo->createProjectMapping(array(
        'project_id' => $id,
        'owner_id' => $values['post_author'],
      ));

      if(isset($values['co-author']) && !empty($values['co-author'])){
        foreach($values['co-author'] as $k => $v){
          $projectRepo->createProjectMapping(array(
            'project_id' => $id,
            'owner_id' => $k,
            'type' => 'Co-author',
          ));
        }
      }


    }catch (\Exception $e){
      echo $e->getMessage();
    }

  }

  /**
   * @param int $id
   * @param array $tenders
   */
  public function addProjectTenders(int $id, array $tenders)
  {

    $projectRepo = self::projectRepository();

    foreach($tenders as $key => $value)
    {

      if(empty($value))
      {
        continue;
      }

      $packages = [];
      if($value['custom'])
      {
        $packages = $value['packages'];
      }else{
        $packages[] = $key;
      }

      if(!$value['label']){
        continue;
      }

      if(!isset($value['packages_size']) || $value['packages_size'] == ''){
        $value['packages_size'] = self::DEFAULT_TENDER_SIZE;
      }
      if(!isset($value['packages_service']) || $value['packages_service'] == ''){
        $value['packages_service'] = self::DEFAULT_TENDER_SERVICE;
      }

      $data = [
        "label" => $value['label'],
        "packages" => $packages,
        "is_custom" => $value['custom'],
        "tender_return" => $value['tender_return'] ?? '',
        "start_on_site" => $value['start_on_site'] ?? '',
        "size" => $value['packages_size'],
        "service" => $value['packages_service'],
        "awarded" => $value['awarded'],
        "has_document" => $value['history']['document']
      ];

      try{
        $tender_id = $projectRepo->createTender(
          $id,
          $value['label'],
          $data,
          $packages
        );

        self::addInterestHistory($tender_id->getId(), $value['history']['interests']);
        self::addEnquiryHistory($tender_id->getId(), $value['history']['enquiries']);

      }catch (\Exception $e){
        echo $e->getMessage();
        die;
      }

    }
  }

  /**
   * @param int $id
   * @param array $tenders
   * @throws \App\Domain\DomainException
   */
  public static function addProjectTransactions(int $id, array $tenders)
  {
    $projectRepo = self::projectRepository();

      $transaction_type = [
        'quotes' => 1,
        'orders' => 2
      ];

      foreach ($tenders as $key => $value) {

        if ( isset($value['quotes']) ) {

          $tenderModel = $projectRepo->getModel('tender')->where('label',$value['label'])->where('project_id',$id);
          if($tenderModel->exists()) {
            $tender = $tenderModel->get()->first()->toArray();
            $tid = $tender['id'];
          }else{
            continue;
          }

          foreach ($value['quotes'] as $k => $v) {
            if ( !isset($v['package_label']) || !$v['package_label'] ) {
              echo "error " . $k . "\n";
            } else {

              $v['order_date'] = null;
              if(isset($value['orders'])) {
                if($value['orders']['quote_id'] == $v['id'] && !$value['orders']['order_withdraw']){
                  $v['prices']['order_price'] = $value['orders']['prices']['order_price'];
                  $v['order_date'] = $value['orders']['order_date'];
                }
              }

              $meta = null;
              if(!$v['quote_user_id'] || $v['quote_user_id'] == '' || !is_numeric($v['quote_user_id'])){
                $meta = [
                  'subcontractor_name' => $v['quote_subcontractor']
                ];
                $meta = json_encode($meta);
                $v['quote_user_id'] = -1;
              }

              if($v['prices']['budget']) {
                $tenderModel->update(['budget' => $v['prices']['budget']]);
              }

              $data = [
                'tender_id' => $tid,
                'subcontractor_id' => $v['quote_user_id'],
                'type_id' => $transaction_type['quotes'],
                'compliant' => $v['compliant'] == 'yes' ? 1 : 0,
                'price' => $v['prices']['quote_price'] ?? 0,
                'price_selected' => ($v['price_for_calculation'] ? 1  : 0),
                'measured_work' => $v['prices']['measured_work'] ?? 0,
                'prelims' => $v['prices']['prelims'] ?? 0,
                'other_items' => $v['prices']['provisional'] ?? 0,
                'programme' => $v['prices']['weeks'] ?? 0,
                'status_id' => $v['quote_deleted'] == 0 ? 1 : 0,
                'meta' => $meta,
                'order_price' => $v['prices']['order_price'] ?? 0,
                'quote_created' => $v['quote_date'] == '0000-00-00 00:00:00' ? null : $v['quote_date'],
                'order_created' => $v['order_date'] == '0000-00-00 00:00:00' ? null : $v['order_date'],
              ];

              $transaction = $projectRepo->getModel('transaction');
              $storedTransaction = $transaction->store($data);
              $qid = (int)$storedTransaction->getId();

              if($v['file']){
                if(file_exists($v['file'])){

                  $zipName = $v['quote_user_id'];
                  if(!$zipName){
                    $zipName = md5($v['quote_subcontractor']);
                  }

                  $zipName .= '.zip';

                  $zipFile = new UploadedFile(
                    $v['file'],
                    $zipName,
                    'application/zip',
                    filesize($v['file']),
                    0,
                    false
                  );

                  S3::upload($zipFile, $id, $tid, $qid);
                }
              }
            }
          }
        }
      }
  }

  /**
   * @param int $tender_id
   * @param array $array
   */
  public static function addEnquiryHistory(int $tender_id,array $array): void
  {
    $projectRepo = self::projectRepository();

    foreach($array as $v) {

      if(!$v['company_user_id']){
        $v['company_user_id'] = $v['company_user_id_extern'];
      }

      $data = [
        'tender_id' => $tender_id,
        'status_id' => 1,
        'tender_history_type' => 'Enquiry',
        'author_id' => $v['enquiry_sent_by'],
        'specialist_id' => $v['company_user_id'],
        'created_at' => $v['enquiry_sent_date'],
        'meta' => [
          'info' => $v['info'],
          'document' => $v['document']
        ]
      ];
      try {
        $projectRepo->addTenderHistory($data);
      } catch (\Exception $e) {
        echo $e->getMessage();
      }
    }
  }

  /**
   * @param int $tender_id
   * @param array $array
   */
  public static function addInterestHistory(int $tender_id,array $array): void
  {
    $projectRepo = self::projectRepository();
    foreach($array as $v) {
      $data = [
        'tender_id' => $tender_id,
        'status_id' => 1,
        'tender_history_type' => 'Interest',
        'author_id' => NULL,
        'specialist_id' => $v['interest_sent_by'],
        'created_at' => $v['interest_sent_date'],
        'meta' => $v
      ];
      try {
        $projectRepo->addTenderHistory($data);

        /*
         * If the interest was accepted in legacy we need to update the status to project service
         */
        if($v['interest_schedule']) {

          try{
            $projectRepo->addTenderHistory([
              'tender_id' => $tender_id,
              'status_id' => 4,
              'tender_history_type' => 'Interest',
              'author_id' => $v['author_id'],
              'specialist_id' => $v['interest_sent_by'],
              //because the created at date is the same in legacy for both sent and accepted interest we need to
              //incremented the accepted one as it will always come after the send one
              'created_at' => date("Y-m-d H:i:s", strtotime("{$v['interest_sent_date']} +1 hour")),
              'meta' => []
            ]);
          }catch (\Exception $e){
            echo $e->getMessage();
          }
        }
      } catch (\Exception $e) {
        echo $e->getMessage();
      }
    }
  }

  /**
   * @throws \App\Domain\DomainException
   * @throws \ReflectionException
   */
  public static function importProjects ()
  {

    $projects = self::getProjectJson();

    $projectRepo = self::projectRepository();

    if ( !empty($projects) && is_array($projects) ) {
      foreach ($projects as $project_key => $values) {
        try{
          self::createProject($project_key, $values);
          if(isset($values['packages']) && is_array($values['packages'])) {
            self::addProjectTenders($project_key, $values);
          }
        }catch (\Exception $e){
          echo $e->getMessage();
        }
      }
    }

  }

  public static function importQuotesAndOrders()
  {
    $projects = self::getJson('project-quotes-orders');

    $projectRepo = self::projectRepository();

    if ( !empty($projects) && is_array($projects) ) {
      foreach ($projects as $project_key => $values) {

        $gia = $values['meta']['gross_value'] ?? 0;

        $project = $projectRepo->getModel()->where('id', $project_key);
        if ( $project->exists() ) {
          $project->update(['gia' => (int)$gia]);
        }

        try{
          if(isset($values['packages']) && is_array($values['packages'])) {
            self::addProjectTransactions($project_key, $values['packages']);
          }
        }catch (\Exception $e){
          echo $e->getMessage();
        }
      }
    }
  }

  /**
   * @param $repo
   * @param int $pid
   * @param array $meta
   */
  public static function updateProjectMeta($repo,int $pid, array $meta): void
  {
    $update = [];
    foreach(self::$meta_keys as $key => $value){
      if(isset($meta[$key])){
        if($key == 'post_insurance_employer' || $key == 'post_insurance_public'){
          if(isset(self::$insurances_values[$meta[$key]])){
            $meta[$key] = self::$insurances_values[$meta[$key]];
          }else{
            $meta[$key] = self::INSURANCES_OTHER_KEY;
          }
        }
        $update[$value] = $meta[$key];
      }
    }

    if($update) {
      $project = $repo->getModel()->where('id', $pid);
      if ( $project->exists() ) {
        $project->update($update);
      }
    }

  }

  public static function updateProjects(): void
  {
    $projects = self::getProjectJson();

    $projectRepo = self::projectRepository();

    if ( !empty($projects) && is_array($projects) ) {
      foreach ($projects as $project_key => $values) {
        try{
          self::updateProjectMeta($projectRepo, $project_key, $values['meta']);
        }catch (\Exception $e){
          echo $e->getMessage();
        }
      }
    }
  }


  public function updateOrderTransactionMeta(): void
  {
      $doc_templates = self::getJson('document-templates-ids');
      $projectRepo = self::projectRepository();

      if(isset($doc_templates['tender_assets'])) {
          foreach ($doc_templates['tender_assets'] as $type => $assets) {
              foreach ($assets as $key => $asset) {
                  if($asset['entity_type'] == 'order_template') {
                      if($asset['quote']){
                          try{
                              $date = $asset['quote']['quote_date'];

                              if($date == '0000-00-00 00:00:00') {
                                  $order_price = 0;
                                  if(isset($asset['quote']['order_price'])) {
                                      $order_price = preg_replace("/[\D]/", "", $asset['quote']['order_price']);
                                  }
                                  $transaction = $projectRepo->getModel('transaction')
                                      ->where('tender_id', $asset['tid'])
                                      ->where('subcontractor_id', $asset['quote']['quote_user_id'])
                                      ->where('order_price', $order_price);
                              }else{
                                  $transaction = $projectRepo->getModel('transaction')
                                      ->where('tender_id', $asset['tid'])
                                      ->where('quote_created', $asset['quote']['quote_date']);
                              }

                              if($transaction->exists()){
                                  $data = $transaction->get()->toArray();
                                  foreach($data as $k => $v){
                                      $meta = json_decode($v['meta'], true);
                                      $meta['order_template_id'] = $asset['document_id'];
                                      $transaction->update(['meta' => json_encode($meta)]);
                                  }

                              }
                          }catch (\Exception $e){
                              echo $e->getMessage();
                          }
                      }
                  }
              }
          }
      }
  }


    /**
   * @return array|mixed|object
   */
  public static function getProjectJson()
  {
    return self::getJson('project');
  }

  public static function getJson(string $json)
  {
    if(!defined('CLI_ROOT')){
      throw new \Exception('CLI_ROOT is not defined');
    }

    $return = file_get_contents(CLI_ROOT . '/fixtures/' . $json . ".json");
    return json_decode($return, true);
  }

}
