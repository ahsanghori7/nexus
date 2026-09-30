<?php

namespace App\Cron;

use App\Api\Account;
use App\Api\Email\Email;
use App\Api\Project;
use App\Api\Hubspot\V2 as Hubspot;
use App\core\Environment as Env;
use App\Api\Aws\Sns;
use App\Models\UserModel;
use App\Api\Account as AccountApi;

class Interest {

  /**
   * @param string $error
   * @param string $body
   * @throws \Exception
   */
  public function handleError(string $error, string $body) {

    //Send warning emails if the interest reminder fails
    $message = "Send email failed to be processed with error " . $error;
    $message .= "\nEnvironment: " . Env::getValue("ENVIRONMENT");
    $message .= "\nBody: " . $body;
    if(!Env::isDevelopment()) {
      Sns::send("failed_interest_reminder", $message);
    }
    else {
      echo $message . "\n";
    }

    error_log($error);
  }

  /**
   * @var array
   */
  public $subcontractors = [];

    /**
     * @param array $contractor
     * @param array $data
     * @throws \Exception
     */
  public function sendEmail(array $contractor, array $data)
  {
      try{
          $contractorModel = new UserModel($contractor, $contractor['id']);
          $contractor_email = $contractor['email'];
          if(isset($contractor['uid'])){
              $user = Account::getUser($contractor['uid']);
              $contractor_email = $user['email'];
              $firstname = $user['firstname'];
              $request = $contractorModel->createTokenByLabel($user['id'], 'auto_loader');
              $json = $request->json()["data"] ?? [];
              $token_url = sprintf("%s/auto_loader/?token=%s&redirect=project/%s/procurement_schedule",
                  config("url.site"), $json['token'], $data['project_slug']
              );
          }
          else{
              $firstname = $contractor['name'];
              $token_url = config('url.site') . "/login";
          }

          Email::send([
              'template' => 'Interest Review',
              'sender'   => ['id' => $user['id'] ?? ''],
              'to'       => $contractor_email,
              'token'    => ['url' => $token_url],
              'extra'    => [
                  'first_name'   => $firstname,
                  'project_name' => $data['name'],
                  'package_name' => $data['label'],
                  'token_url'    => $token_url
              ]
          ],'clink');
      }catch (\Exception $e){
          $this->handleError($e->getMessage(), json_encode(['contractor' => $contractor, 'data' => $data]));
      }
  }

  /**
   * @throws \App\Api\Exception
   * Get list of history Interests that were sent by subcontractors 1 day before the current day
   * Check the list of interests to see if the contractor didn't yet took any action to the interest
   * We will get the contractor account id from the project table group id column
   */
  public function process(): void
  {
    try{
      $tenders = Project::get("tender/history", [
        'tender_history_type' => 'Interest',
        'created_at'          => date("Y-m-d", strtotime("yesterday"))
      ]);

      $interests_found = [];
      $projects_ids = [];
      array_map(function ($tender) use(&$interests_found, &$projects_ids){
        $key = $tender['tender_id'] . $tender['specialist_id'];
        if($tender['status_id'] === 1){
          $interests_found[$key] = $tender;
          $projects_ids[$tender['project_id']] = $tender['project_id'];
        }
        else{
          unset($interests_found[$key], $projects_ids[$tender['project_id']]);
        }
        return $tender;
      }, $tenders);

      $projects = Project::get("project",
        ["id" => "[". implode(",", $projects_ids ) ."]"]);
      $accounts = Account::getAccounts(array_column($projects, 'group_id'));

      foreach($interests_found as $interest){
        $project_key = array_search($interest['project_id'], array_column($projects, 'id'), true);
        $aid = $projects[$project_key]['group_id'];
        $accounts[$aid]['uid'] = $projects[$project_key]['author_id'];
        $this->sendEmail($accounts[$aid], $interest);
      }
    }catch (\Exception $e){
      $this->handleError($e->getMessage(), json_encode(['created_at' => date("Y-m-d", strtotime("yesterday"))]));
    }


  }
}
