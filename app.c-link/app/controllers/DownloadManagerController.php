<?php

namespace App\controllers;

use App\Api\Account;
use App\Api\Project;
use App\Api\Document;
use App\core\Controller;
use App\Models\Permission;
use App\Factory\UserFactory;

class DownloadManagerController extends Controller
{

  public $user_path = 'main-contractor';

  protected $user;

  private const STATUS_VALID     = 'valid';
  private const STATUS_INVALID   = 'invalid';
  private const STATUS_RESCINDED = 'rescinded';

  /**
   * @return bool
   */
  public function isAuthorized(): bool
  {

    $action = $this->request->param('action');

    $resource = 'c-link';

    //config used for conditions on permission check
    $config = array();

    Permission::allow('administrator', $resource, ['*']);
    if ($this->user) { // Just to be safe if user is null so it does not crash
        $membership = $this->user->getMembership();
        Permission::allow('main-contractor', $resource, $membership->getAllowedPages());
    }

    return Permission::check(user_role(), $resource, $action, $config);
  }

  /**
   * @return \App\core\Response|void
   */
  public function startupProcess()
  {
    return parent::startupProcess();
  }

  public function beforeAction(): void
  {
      parent::beforeAction();
      $this->removeComponent('Auth');

      $this->user = UserFactory::getUser();

      // Token in URL then skip login redirect
      $token = $this->request->param('args')[1] ?? null;
      if (!$this->user && !$token) {
          redirect(config('url.site') . "/login");
          return;
      }

      if ($this->user && $token) {
        $action     = $this->request->param('action');
        $documentId = $this->request->param('args')[0] ?? null;
        $queryString = !empty($_GET) ? '?' . http_build_query(array_diff_key($_GET, ['url' => ''])) : '';
        redirect(config('url.site') . "/download-manager/{$action}/{$documentId}{$queryString}");
        return;
      }

      if ($this->user) {
          setJsConfig('user_id', $this->user->getId());
          setJsConfig('account_id', $this->user->getAccountId());
          setJsConfig('url', SITE_URL);
          setJsConfig('info', Account::info($this->request, $this->user, []));
          setJsConfig('isCostPlaningTool', $this->user->getMembership()->isCPT());
          $this->view->setContext(["is_admin" => user_role() === "administrator"]);
          $this->view->setContext(["user" => $this->user]);
      }
  }


  public function index(): void {}

  // /download-manager/order/123
  public function order(?string $documentId = null, ?string $token = null): void
  {
      $this->handleDownload('order', $documentId, $token);
  }

  // /download-manager/addendum/123
  public function addendum(?string $documentId = null, ?string $token = null): void
  {
      $this->handleDownload('addendum', $documentId, $token);
  }

  // /download-manager/enquiry/123
  public function enquiry(?string $documentId = null, ?string $token = null): void
  {
      $this->handleDownload('enquiry', $documentId, $token);
  }

  public function tender_recommendation_attachment(?string $tenderRecommendationId = null, ?string $token = null): void
  {
      $this->handleDownload('tender_recommendation_attachment', $tenderRecommendationId, $token);
  }

  /**
   * Whether a token value was ever issued, regardless of whether it still works.
   *
   * @param string $token
   * @return bool
   */
  private static function isKnownToken(string $token): bool
  {
      if ($token === '') {
          return false;
      }

      try {
          return !empty(Account::get('token', ['token' => $token]));
      } catch (\Exception $e) {
          return false;
      }
  }

  // Common handler
  private function handleDownload(string $context, ?string $documentId, ?string $token): void
  {
      if (!$documentId) {
          http_response_code(400);
          die();
      }

      $isTokenRequest = !empty($token);
      $status         = self::STATUS_VALID;
      $tokenData      = [];

      // No session, no token login redirect
      if (!$isTokenRequest && !$this->user) {
          redirect(config('url.site') . "/login");
          return;
      }

      // Verify token
      $tokenToVerify = $isTokenRequest ? $token : $this->user->getToken();

      try {
          $tokenData = Account::get("token/verify/{$tokenToVerify}");
      } catch (\Exception $e) {
          $status = self::isKnownToken($tokenToVerify) ? self::STATUS_RESCINDED : self::STATUS_INVALID;
      }

      // Token expiry check
      if ($status === self::STATUS_VALID) {
          $isExpired  = !empty($tokenData['expires']) && time() > strtotime($tokenData['expires']);
          $isRevoked  = !empty($tokenData['expired_at']);

          if ($isExpired || $isRevoked) {
              $status = self::STATUS_RESCINDED;
          }
      }

      // Check document owner
      $tenderDocumentOwner = Document::get("document/{$documentId}/owner");
      $ownerId = $tenderDocumentOwner[0] ?? null;
      if ($ownerId) {
            $ownerAccount    = Account::get("account/{$ownerId}");
            $accountName  = $ownerAccount['name'] ?? null;
            setJsConfig('ownerAccountName', $accountName);
      }

      // Subcontractor check using token and then transaction check
      if ($status === self::STATUS_VALID && $isTokenRequest) {
          try {
              $tenderDocument = Document::get("document/{$documentId}/category");

              if (empty($tenderDocument[0]['entity_id'])) { // 0 index entity id bcoz same in all indices need single entity id
                  // Inquiry does not exist
                  $status = self::STATUS_INVALID;
              }
              else {
                  $tokenMeta = json_decode((string)($tokenData['meta'] ?? ''), true);
                  $recipientId = is_array($tokenMeta) ? (int)($tokenMeta['subcontractor_id'] ?? 0) : 0;

                  $isAttributable = $recipientId > 0;

                  foreach ($tenderDocument as $tender) {
                    try {
                        $transactions = Project::get("transaction/tender/[{$tender['entity_id']}]");
                    } catch (\Exception $e) {
                        continue; // No transaction - skip as tender is still open
                    }

                    foreach ($transactions as $transaction) {
                        $isAwarded            = $transaction['tender']['awarded'] ?? 0;
                        $transactionAccountId = $transaction['subcontractor_id'] ?? null;

                        // Rescinded only if awarded to someone else
                        if (
                            $isAttributable &&
                            $isAwarded == 1 &&
                            $transactionAccountId &&
                            (int)$transactionAccountId !== $recipientId
                        ) {
                            $status = self::STATUS_RESCINDED;
                            break 2;
                        }
                    }
                }
              }
          } catch (\Exception $e) {
              $status = self::STATUS_INVALID;
          }
      }

      // Pass data to frontend
      setJsConfig('download_context', $context);
      setJsConfig('document_id', $documentId);
      setJsConfig('token', $token);
      setJsConfig('is_token_request', $isTokenRequest);
      setJsConfig('status', $status);

      $this->view->setContext(["react_app" => "clink"]);
      $this->view->setContext(["version" => 2]);
      renderLayouts('react');
  }
}
