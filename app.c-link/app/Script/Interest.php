<?php

namespace App\Script;

use App\Api\Account;
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
   * @throws \Exception
   */
  public function sendEmail(array $contractor)
  {
    try{

      $contractorModel = new UserModel($contractor, $contractor['id']);
      $request = $contractorModel->createTokenByLabel($contractor['id'], 'auto_loader');
      $json = $request->json()["data"] ?? [];

      $token_url = sprintf("%s/auto_loader/?token=%s", config("url.site"), $json['token']);

      $user = Account::getUser($contractor['id']);
      $hubspot_data = [
        'first_name'   => $user['firstname'],
        'token_url'    => $token_url
      ];

      $res = Hubspot::sendEmail($contractor['email'], AccountApi::getConfig("interest.hubspot.interest_retroactively_reminder"), [
        'custom' => $hubspot_data
      ]);

      if($res['status'] == "error"){
        $this->handleError($res['message'], json_encode(['contractor' => $contractor]));
      }
    }catch (\Exception $e){
      $this->handleError($e->getMessage(), json_encode(['contractor' => $contractor]));
    }
  }

  /**
   * @throws \App\Api\Exception
   * Get list of history Interests that were sent by subcontractors 2 weeks prior current day
   * Check the list of interests to see if the contractor didn't yet took any action to the interest
   * We will get the contractor account id from the project table group id column
   */
  public function process(): void
  {
    try{

      $tenders = Project::get("tender/history", [
        'tender_history_type' => 'Interest',
        'created_start_date'  => date("Y-m-d", strtotime("-2 weeks"))
      ]);

      $projects_ids = [];
      array_map(function ($tender) use(&$projects_ids){
        if($tender['status_id'] === 1){
          $projects_ids[$tender['project_id']] = $tender['project_id'];
        }
        else{
          unset($projects_ids[$tender['project_id']]);
        }
        return $tender;
      }, $tenders);

      $projects = Project::get("project",
        ["id" => "[". implode(",", $projects_ids ) ."]"]
      );
      $contractors = array_column($projects, 'group_id');
      $accounts = Account::getAccounts($contractors);

      foreach($accounts as $contractor){
        $this->sendEmail($contractor);
      }

    }catch (\Exception $e){
      $this->handleError($e->getMessage(), '');
    }
  }
}
