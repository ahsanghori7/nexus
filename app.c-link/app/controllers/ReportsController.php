<?php

namespace App\controllers;

use App\Api\Account;
use App\Api\Api;
use App\Api\Project;
use App\Api\Transactions;
use App\Api\Tender as TenderApi;
use App\Api\V2\SupplyChain;
use App\core\Controller;
use App\Models\Permission;
use App\Factory\UserFactory;
use App\Models\Transaction;
use DateTime;

use CL\Pdf\Parser;


class ReportsController extends Controller
{

  public const ANZ_REGION_CODE = ['NZ', 'AUS'];

  public $user_path = 'reports';

  protected $user;

  /**
   * @return bool
   */
  public function isAuthorized(): bool
  {
    $action = $this->request->param('action');
    $resource = 'c-link';
    $config = array();

    Permission::allow('administrator', $resource, ['*']);
    Permission::allow(
      'main-contractor',
      $resource,
      [
        'tender',
        'quotes',
        'order',
        'supply_chain'
      ]
    );

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
    $this->user = UserFactory::getUser();
    if (!$this->user) {
      redirect(config('url.site') . "/login");
    }
    $this->view->setContext(["is_admin" => user_role() === "administrator"]);
  }

  public function index(): void
  {
    redirect(config('url.site') . "/main-contractor");
  }


  public function back_to_admin()
  {
    redirect(config('url.admin'));
  }

  /**
   * @param string $pid
   * @return void
   */
  public function quotes(string $pid): void
  {
    $pid = (int)$pid;
    $user = UserFactory::getUser();
    $idRegion = $user->getRegionId();
    $regionGroup = $user->getRegionGroupByRegionId($idRegion);
    $regionCode = $regionGroup["code"];
    $currencySymbol = "£";
    if (in_array($regionCode, self::ANZ_REGION_CODE)) {
      $currencySymbol = "$";
    }

    $project = Project::ownsProject($user, $pid);

    $data = Transactions::getQuotesList($pid);
    $reportData = [];
    if ($data && isset($data["tenders"]) && !is_null($data["tenders"])) {
      foreach ($data["tenders"] as $tender) {
        if (isset($tender['quotes']) && !empty($tender['quotes'])) {
          $reportItem = [
            'tender' => $tender['label'],
            'awarded' => $tender['awarded'] ? 'Awarded' : 'Not awarded'
          ];

          $aids = [];
          $quotes = [];
          foreach ($tender['quotes'] as $quote) {
            $aids[] = $quote['subcontractor_id'];
            $quotationPrice = number_format(floatval(Transactions::pennyToFloat(intval($quote['price']))), 2, '.', ',');
            $measuredWork = number_format(floatval(Transactions::pennyToFloat(intval($quote['measured_work']))), 2, '.', ',');
            $prelims = number_format(floatval(Transactions::pennyToFloat(intval($quote['prelims']))), 2, '.', ',');
            $provSumsOthers = number_format(floatval(Transactions::pennyToFloat(intval($quote['other_items']))), 2, '.', ',');
            $quotes[$quote['subcontractor_id']][] = [
              'quote_price_int' => intval($quote['price']),
              'quotation_price' => $currencySymbol . $quotationPrice,
              'measured_work' => $currencySymbol . $measuredWork,
              'prelims' => $currencySymbol . $prelims,
              'prov_sums_others' => $currencySymbol . $provSumsOthers,
              'programme' => $quote['programme'],
            ];
          }

          $result = [];
          $accounts = Account::getAccounts($aids);
          foreach ($accounts as $aid => $account) {
            $quotes[$aid] = array_map(function ($quote) use ($account) {
              $quote['company'] = $account['name'];
              return $quote;
            }, $quotes[$aid]);
            $result = array_merge($result, $quotes[$aid]);
          }

          usort($result, function ($a, $b) {
            return $a['quote_price_int'] - $b['quote_price_int'];
          });

          $reportItem['quotes'] = $result;
          $reportData[] = $reportItem;
        }
      }
    }

    usort($reportData, function ($a, $b) {
      return strcmp(strtolower($a['tender']), strtolower($b['tender']));
    });

    $fileName = "{$project['name']} - Quotes Report";

    self::createReport($project['name'], "Quotes Report", $fileName, "/reports/project_quotes.php", $reportData, [public_path() . 'css/quotes.css']);
  }

  /**
   * @param string $pid
   * @return void
   */
  public function tender(string $pid): void
  {
    $pid = (int)$pid;
    $type = Project::TENDER_ENQUIRY_TYPE;
    $currentUser = UserFactory::getUser();
    $project = Project::ownsProject($currentUser, $pid);
    $data = Project::tenderReport($pid, $type);
    $reportData = [];
    $userData = $currentUser->getData();
    $preparedBy  = $userData['firstname'] . ' ' . $userData['lastname'];
    $accountName = $userData['account']['name'];

    $tender_return_id = TenderApi::getHistoryTypes()
        ->filterByField("uid", "tender_returned")
        ->getFirst()
        ->getId();

    if ($data && isset($data['tenders'])) {
      $packageOrder = [];
      // Loop through tenders
      foreach ($data['tenders'] as $tender) {

        if (!in_array($tender['label'], $packageOrder, true)) {
            $packageOrder[] = $tender['label'];
        }
        // Loop through the tender templates
        foreach ($tender['templates'] ?? [] as $templateId => $template) {
          // Status logic
          if ($template['sent_date'] !== '-') {
              $approvalStatus = 'Sent';
          } elseif (!empty($template['approval_info']['status'])) {
              $approvalStatus = $template['approval_info']['status'];
          } else {
              $approvalStatus = $template['status'] == 0 ? 'Draft' : 'Published';
          }

          $approverName = $template['approval_info']['approver_name'] ?? '-';

          $createdDate = !empty($template['created_at'])
              ? (new DateTime($template['created_at']))->format('d/m/Y')
              : '-';

          $sentDateDbDefault = $template['sent_date'] !== '-'
              ? $template['sent_date']
              : $template['created_at'];


          $rows = [];

          $sentToSubs  = $template['sent_to_subcontractors'] ?? '-';

          // Matching the rows as displayed on frontend to check which tenders are sent to whom with count
          if (is_array($sentToSubs)) {
            foreach ($sentToSubs as $sub) {

                  $rows[] = [
                      'company'      => $sub['name'],
                      'contact'      => $sub['email'] ?? '-',
                      'sent_date_db' => $sentDateDbDefault,
                      'sent_date'    => $template['sent_date'] !== '-'
                          ? (new DateTime($template['sent_date']))->format('d/m/Y')
                          : '-'
                  ];

            }
          }
          else {
            $rows[] = [
                'company'      => '-',
                'contact'      => '-',
                'sent_date_db' => $sentDateDbDefault,
                'sent_date'    => '-'
            ];
          }

          // Qoutes logic which was implemented before kept it just in case if it is needed in the future
          foreach ($rows as $row) {
            $tenderReturned = '-';

            if (!empty($tender['enquries'])) {
              foreach ($tender['enquries'] as $enquiry) {
                foreach ($enquiry['history'] ?? [] as $histItem) {

                    $meta = is_string($histItem['meta'])
                        ? json_decode($histItem['meta'], true)
                        : $histItem['meta'];

                    if (
                        (int)$histItem['status_id'] === (int)$tender_return_id &&
                        isset($meta['enquiry']) &&
                        (int)$meta['enquiry'] === (int)$templateId
                    ) {
                        $tenderReturned = 'Quote Received';
                        break 2;
                    }
                }
              }
            }

            // Preparing data to be populated
            $reportData[] = [
                'label'           => $tender['label'],
                'name'            => $template['name'],
                'company'         => $row['company'],
                'contact'         => $row['contact'],
                'created_date'    => $createdDate,
                'sent_date'       => $row['sent_date'],
                'send_date_db'    => $row['sent_date_db'],
                'tender_returned' => $tenderReturned,
                'approval_status' => $approvalStatus,
                'approver_name'   => $approverName
            ];
          }
        }
      }
    }

    $groupedReportData = [];

    // init empty groups in frontend order
    foreach ($packageOrder as $label) {
        $groupedReportData[$label] = [];
    }

    // now fill them
    foreach ($reportData as $row) {
        $groupedReportData[$row['label']][] = $row;
    }

    // remove empty groups for safety
    $groupedReportData = array_filter($groupedReportData);

    $fileName = "Tender_Report_{$project['name']}";

    self::createReport(
        $project['name'],
        'Enquiries report',
        $fileName,
        '/reports/project_tenders.php',
        [
            'project_name'     => $project['name'],
            'prepared_by'      => $preparedBy,
            'account_name'     => $accountName,
            'report'           => $groupedReportData,
            'is_tender_report' => true,
        ]
    );
  }

  /**
   * @return void
   * @throws \Exception
   * No need to supply the aid as we can retrieve it from the session
   */
  public function supply_chain(): void
  {
    $name = $this->user->getFullName();
    $token = app()->Cookie->getCookie('token');
    $data = Api::get("account/supply-chain",[], ['Authorization' => "Bearer $token"]);
    $externalSubcontractor = intval(Account::getSubscriptionByLabel("External Subcontractor", "yearly")->getId());
    $reportData = [];
    foreach ($data as $sp) {
      $reportItem = [
        'company' => $sp['name'],
        'contact_name' => $sp['users'][0]['display_name'],
        'contact_number' => $sp['mobile'] ?? $sp['users'][0]['contact_number'] ?? "",
        'trades' => implode(', ', array_map(function ($trade) {
          return $trade['label'];
        }, $sp['trades'] ?? [])),
        'activated' => intval($sp['subscription_id']) === $externalSubcontractor ? 'No' : 'Yes'
      ];
      $reportData[] = $reportItem;
    }

    usort($reportData, function ($a, $b) {
      return strcmp(strtolower($a['company']), strtolower($b['company']));
    });

    self::createReport($name, "Supply chain report", "Supply Chain", "/reports/supply_chain.php", $reportData);
  }

  /**
   * @param string $pid
   * @return void
   */
  public function order(string $pid): void
  {
    $pid = (int)$pid;
    $user = UserFactory::getUser();
    $idRegion = $user->getRegionId();
    $regionGroup = $user->getRegionGroupByRegionId($idRegion);
    $regionCode = $regionGroup["code"];
    $project = Project::ownsProject($user, $pid);
    $orders = Transaction::getOrders($pid);
    uasort($orders, function ($a, $b) {
      return strcasecmp($a['tender']['label'], $b['tender']['label']);
    });
    $data  = array_merge($orders, ["region_code" => $regionCode]);
    $fileName = "{$project['name']} - Orders Report";
    self::createReport($project['name'], "Orders report", $fileName, "/reports/issued_orders.php", $data);
  }

  /**
   * @param string $name
   * @param string $title
   * @param string $fileName
   * @param string $reportFile
   * @param array $data
   * @param array $extraStyles
   * @param string $extension
   * @return void
   */
  public static function createReport(
    string $name = "",
    string $title = "",
    string $fileName = "",
    string $reportFile = "",
    array $data = [],
    array $extraStyles = [],
    string $extension = 'pdf'
  ): void {
    $parser = new Parser([]);
    try {
      $report = app()->view->render(config('path.views') . $reportFile, $data);
      $mainStyles = [public_path() . 'css/reports.css'];
      $currentDate = new DateTime();
      $accountName    = $data['account_name']    ?? '';
      $isTenderReport = !empty($data['is_tender_report']);
      $data = [
        'name' => $name,
        'styles' => array_merge($mainStyles, $extraStyles),
        'report' => $report,
        'is_tender_report' => $isTenderReport];

      // As per required for tender report naming convention date format
      $dateFormat = str_contains($fileName, 'Tender_Report_') ? 'd-m-Y' : 'Y-m-d';
      $fileName = "{$fileName}_{$currentDate->format($dateFormat)}.{$extension}";

      $mainTemplate = app()->view->render(config('path.views') . "/reports/reports.php", $data);
      $pdf = $parser->newParser();
      if ($isTenderReport && $accountName) {
         $pdf->SetHTMLFooter('
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #000; border-right:none; border-bottom:none; border-left:none; border-collapse:collapse;">
              <tr>
                  <td width="80%" style="border:none; background-color:white; font-style:italic; font-size:11px;">
                      Generated from C-Link | ' . htmlspecialchars($accountName) . '
                  </td>
                  <td width="20%" style="border:none; background-color:white; font-style:italic; font-size:11px; text-align:right;">
                      {PAGENO}
                  </td>
              </tr>
          </table>');
      } else {
          $pdf->setFooter('{PAGENO}');
      }
      $pdf->WriteHTML($mainTemplate);
      $pdf->SetTitle($title);
      $pdf->Output($fileName, 'I');
    } catch (\Exception $e) {
      echo $e->getMessage();
    }
  }
}
