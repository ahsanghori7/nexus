<?php

namespace App\controllers;

use App\Api\Account;
use App\Api\Project;
use App\Api\S3;
use App\Api\CostPlanningTool;
use App\core\Controller;
use App\Domain\User\User;
use App\Models\Permission;
use App\Factory\UserFactory;

use App\core\Config;
use App\core\Session;
use CL\CostPlanningTool\CostPlanningApp;


class MainContractorController extends Controller
{
  private const CPT_EXPORT_SESSION_KEY = 'cpt_exports';

  public $user_path = 'main-contractor';

  protected $user;

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
    $membership = $this->user->getMembership();
    Permission::allow('main-contractor', $resource, $membership->getAllowedPages());

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

    $actions = ['profile'];

    $this->Security->requirePost($actions);

    switch ($this->request->param('action')) {

      case "profile":
        $this->Security->config("form", ['fields' => ['username', 'pass']]);
        break;
    }

    $this->user = UserFactory::getUser();
    if (!$this->user) {
      redirect(config('url.site') . "/login");
    }

    try {
        $ssoProvider = Account::get("account/{$this->user->getAccountId()}/sso/provider");
        $isSsoEnabledOnAccount = ($ssoProvider['provider'] ?? 'local') !== 'local';
    } catch (\Exception $e) {
        $isSsoEnabledOnAccount = false;
    }

    $hidePasswordField = $isSsoEnabledOnAccount;

    setJsConfig('user_id', $this->user->getId());
    setJsConfig('account_id', $this->user->getAccountId());
    setJsConfig('url', SITE_URL);
    setJsConfig('info', Account::info($this->request, $this->user, []));
    setJsConfig('isCostPlaningTool', $this->user->getMembership()->isCPT());
    setJsConfig('hidePasswordField', $hidePasswordField);

    $this->view->setContext(["is_admin" => user_role() === "administrator"]);
    $this->view->setContext(["user" => $this->user]);
  }

  public function index(): void
  {
    $membership = $this->user->getMembership();
    $isCostPlanningTool = $membership->isCPT();
    if ($isCostPlanningTool) {
      redirect(config('url.site') . "/main-contractor/cost-planning-tool");
    } else {
      $this->dashboard();
    }
  }


  public function back_to_admin()
  {
    redirect(config('url.admin'));
  }

  public function dashboard(): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function cost_planning_tool_failure()
  {
    renderLayouts("cost-planning-tool-failure", [
      'url' => SITE_URL . "/main-contractor/cost-planning-tool"
    ]);
  }

  public function cost_planning_tool()
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);

    define("CPT_PDF_DEST_DIR", public_path() . "/cpt");

    $app = new CostPlanningApp();
    $exportId = $_GET['export'] ?? false;

    if (isset($_GET['output'])) {
        http_response_code(404);
        $this->jsonContent([
            'success' => false,
            'message' => 'Export not found.'
        ]);
    }

    if ($exportId) {
        $exports = Session::get(self::CPT_EXPORT_SESSION_KEY) ?? [];
        $export = $exports[$exportId] ?? null;
        $basePath = realpath(CPT_PDF_DEST_DIR);
        $filePath = false;

        if ($export) {
            $filePath = realpath($export['path'] ?? '');
        }

        if (
            !$export ||
            !is_array($export) ||
            (int)($export['account_id'] ?? 0) !== (int)$this->user->getAccountId() ||
            $filePath === false ||
            $basePath === false ||
            strpos($filePath, $basePath) !== 0 ||
            !file_exists($filePath)
        ) {
            http_response_code(404);
            $this->jsonContent([
                'success' => false,
                'message' => 'Export not found.'
            ]);
        }

        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        $mimeTypes = [
            'pdf'  => 'application/pdf',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        // Return authentication headers
        header("X-Frame-Options: DENY");
        header("X-Content-Type-Options: nosniff");
        header("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload");
        header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none';");

        // Set correct headers
        header("Content-Type: " . $mimeTypes[$ext]);
        header("Content-Disposition: inline; filename=\"" . basename($filePath) . "\"");
        header("Content-Transfer-Encoding: binary");
        header("Content-Length: " . filesize($filePath));
        header("Accept-Ranges: bytes");

        // Serve the file securely
        readfile($filePath);
        exit();
    }

    $cost_planning_tool_url = SITE_URL . "/main-contractor/cost-planning-tool";
    $cost_planning_tool_failure_url = SITE_URL . "/main-contractor/cost-planning-tool-failure";
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        try {
        $app->setPdfExtraPages([]);
        $export_type = $_POST['export_type'] ?? 'pdf';
        if($export_type === "pdf"){
            $res = $app->handleSubmit($_POST);
        }else{
            $res = $app->exportExcel($_POST);
        }

        $exportId = bin2hex(random_bytes(16));
        $exports = Session::get(self::CPT_EXPORT_SESSION_KEY) ?? [];
        $exports[$exportId] = [
            'path' => $res['dest'] ?? '',
            'account_id' => $this->user->getAccountId(),
            'user_id' => $this->user->getId(),
            'created_at' => date('c'),
        ];
        Session::set(self::CPT_EXPORT_SESSION_KEY, $exports);
        $url = $cost_planning_tool_url . "?export=" . $exportId;

        if($res) {
            CostPlanningTool::post("submit", [
                'data' => json_encode($res),
                'email' => $this->user->getData("email"),
                'source' => 'App C-Link'
            ]);
        }
      } catch (\Exception $e) {
        $url = $cost_planning_tool_failure_url;
      }

      $this->response->type('application/json')->setContent(json_encode([
        'data' => [
          'url' => $url
        ]
      ]));
    } else {
      renderLayouts("cost");
    }
  }

  public function jsonContent(array $content): void
  {
      header("Content-Type: application/json");
      echo json_encode($content);
      die;
  }

  public function team_manager(): void
  {
    $this->view->setContext(["react_app" => "projects", "version" => "2"]);
    renderLayouts('react');
  }

  public function error_page(): void
  {
    $this->view->setContext(["react_app" => "clink", "version" => "2"]);
    renderLayouts('react');
  }

  public function add_team(): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function suggestion(): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function project_dashboard(): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function supply_chain(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function inbox(): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function download(string $slug, int $id, int $tid, $sid)
  {
    try {
      $user = UserFactory::getUser();
      if (!$user) {
        throw new \Exception("Permission denied.");
      }
      $project = Project::ownsProject($user, $id);
      if ($slug == 'quote') {
        $file = sprintf('projects/%s/tenders/%s/transactions/%s/%s.zip', $id, $tid, 'quotes', $sid);
        $download = S3::download(S3::getBucket('document'), $file);
        if ($download) {
          header("Content-Type: " . $download['ContentType']);
          echo $download['Body'];
          die;
        }
      }
    } catch (\Exception $e) {
      throw new \Exception("Permission denied.");
    }
  }



  /**
   * @param string $slug
   * @param string $method
   * @param string|null $params
   * @throws \Exception
   */
  public function project(string $slug, string $method, ?string $params = null)
  {

    $project = Project::getProjectBySlug($slug);
    $this->user = UserFactory::getUser();
    $ids = $this->user->getUserIds();

    if (!isset($project['group_id']) || !in_array($project['group_id'], $ids)) {
      throw new \Exception('You don\'t have access to this project!');
    }

    if (method_exists($this, $method)) {
      $this->$method($params);
    } else {
      throw new \Exception('Method ' . $method . ' not found.');
    }
  }

  public function procurement_schedule(): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function add_project(): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function edit_project(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function quotes_tender(): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function company_assets(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function profile(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function issue_order(): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function issue_enquiry(): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function file_manager(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function document_creator(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function tender_templates(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function draft_orders(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "draft-orders"]);
    renderLayouts('react');
  }

  public function instructions_variations(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function ncr(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function boq(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function tender_analysis(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function forecast_final(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function form_instruction(): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function orders(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function tender_recommendations(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }

  public function tender_recommendation(?string $method = null): void
  {
    $this->view->setContext(["react_app" => "clink"]);
    $this->view->setContext(["version" => 2]);
    renderLayouts('react');
  }
}
