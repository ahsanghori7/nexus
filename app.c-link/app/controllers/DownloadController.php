<?php

namespace App\controllers;

use App\Api\Account;
use App\Api\Aws\Sqs;
use App\Api\Client;
use App\Api\Document;
use App\Api\Document\Category as CategoryApi;
use App\Api\Document\Validator as DocValidator;
use App\Api\Project;
use App\Api\S3;
use App\Api\Transactions;
use App\core\Controller;
use App\DocCreator\Signatory\Signatory;
use App\Models\Document\Category;
use App\Models\Permission;
use App\Factory\UserFactory;
use App\Models\Tender as TenderModel;
use App\Utility\Download;
use App\Utility\Dir;
use App\Api\Tender;
use App\core\Request;

use App\Api\Api;
use App\core\Config;
use App\Api\BoQ\BoQ as BoQApi;

class DownloadController extends Controller
{

    const DEFAULT_SIGNATORY_SERVICE = 'docusign';

    public $user_path = 'main-contractor';

    protected $user;

    /**
     * @var array|array[]
     */
    public array $headers = [
        'zip'   => "application/zip",
        'pdf'   => "application/pdf",
        'excel' => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

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
        Permission::allow(
            'main-contractor',
            $resource,
            [
                "project",
                "tender",
                "category",
                "quote",
                "document",
                "instruction",
                "order",
                "boq",
                "asset",
                "boq_export",
                "download_all_queue"
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
            throw new \Exception("Permission denied.");
        }
    }

    public function index() {}

    /**
     * @param int $id
     * @return void
     * @throws \Exception
     */
    public function document(int $id): void
    {
        try {
            $token = $_COOKIE['token_' . Config::get('environment')];
            Api::downloadContentFromUrl("document/download/$id", [], ['Authorization' => "Bearer $token"], [
                "name" => "Document.pdf",
                "type" => $this->headers['pdf']
            ]);
        } catch (\Exception $e) {
            error_log($e->getMessage());
            app()->view->render(views_path() . "/errors/500.php");
            return;
        }
    }

    /**
     * @param int $id
     * @return void
     * @throws \Exception
     */
    public function asset(int $id)
    {
        $res = Document::get("document/$id");
        if ($res) {
            $document = new \App\Models\Document($res, (string)$id);
            if ($document->isOwner($this->user)) {
                $tmp = sys_get_temp_dir();
                $downloaded = $document->download($tmp);
                if ($downloaded) {
                    Client::downloadResponse($tmp . "/" . $document->getData("name"), true);
                }
            } else {
                exit("Permission Denied");
            }
        }
    }

    /**
     * @param string $type
     * @param int $id
     * @throws \Exception
     */
    public function project(string $type, int $id): void
    {
        try {
            Project::ownsProject($this->user, $id);
        } catch (\Exception $e) {
            exit("Permission Denied");
        }

        if ($type === "categories") {
            $this->categories($id, Project::ENTITY_TYPE, "all files");
        }
    }

    /**
     * @param int $id
     * @param string $email
     * @return void
     * @throws \Exception
     */
    public function download_all_queue(int $id, string $email = "")
    {
        $error = "";
        try{
            $data        = Tender::get("tender/$id");
            $tenderModel = new TenderModel($data[$id], (string)$id);
            if(filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $tenderConnection = Project::hasTenderConnection($tenderModel->getData("project_id"), $id, $email);
                if($tenderConnection['allowed'] === true) {
                    //add queue to SQS
                    Sqs::send(json_encode([
                        'tid'       => $id,
                        'ids'       => Request::getArgArray("ids"),
                        'pid'       => $tenderModel->getData("project_id"),
                        'email'     => $email,
                        'user_name' => $tenderConnection['user_name'],
                        'type'      => Tender::ENTITY_TYPE
                    ]), 'download_all');
                }else{
                    $error = "Please provide a valid email address related to the tender/order.";
                }
            }
            else{
                $error = "Email $email is not valid";
            }
        }catch (\Exception $e){
            $error = "Tender not found.";
        }
        if($error) {
            throw new \Exception($error);
        }
    }

    /**
     * DEPRECATED USE download_all_queue INSTEAD
     * @param string $type
     * @param int $id
     * @param bool $validate_owner
     * @throws \App\Api\Exception
     */
    public function tender(string $type, int $id, bool $validate_owner = true)
    {
        $args = ["tid" => $id];
        if ($validate_owner) {
            try {
                Tender::validateOwner(new Request(), $this->user, $args);
            } catch (\Exception $e) {
                exit("Permission Denied");
            }
        } else {
            $data = Tender::get("tender/$id");
            $args["tender"] = new TenderModel($data[$id], (string)$id);
        }

        if ($type === "categories") {
            $this->categories($id, Tender::ENTITY_TYPE, $args["tender"]->getData("label"));
        }
    }

    /**
     * @param string $type
     * @param int $id
     * @param bool $validate_owner
     * @throws \App\Api\Exception
     */
    public function instruction(string $type, int $id, bool $validate_owner = true)
    {
        $args = ["tid" => $id];
        if ($validate_owner) {
            try {
                Tender::validateOwner(new Request(), $this->user, $args);
            } catch (\Exception $e) {
                exit("Permission Denied");
            }
        } else {
            $data = Tender::get("tender/$id");
            $args["tender"] = new TenderModel($data[$id], (string)$id);
        }

        $type = ucfirst($type);
        $this->categories($id, "instruction", "$type " . Request::getArg("instruction_nr"), false);
    }

    /**
     * @param int $entity_id
     * @param string $entityType
     * @param string $label
     * @param bool $clean_label
     * @throws \App\Api\Exception
     */
    public function categories(int $entity_id, string $entityType, string $label, bool $clean_label = true): void
    {
        $filters = Request::getArgArray("ids");
        $instruction_id = Request::getArg("instruction_id");
        $categories = Document::get("category", [
            "entity_id" => $entity_id,
            "entity_type" => $entityType
        ]);

        //allow the script to run until we process all files
        //currently if the user have a lot of files (hundreds of files) the script will exceeded the configured max_execution_time from
        //php.ini
        set_time_limit(config('php.settings.max_execution_time'));

        if ($categories) {
            try {
                if ($clean_label) {
                    $label = Dir::cleanFolderName($label);
                }
                $downloadFolder = Dir::getPath(config('document.download.folder'));
                $downloadPath = $downloadFolder . $label;
                $download = new Download($downloadPath);
                $downloads = 0;
                foreach ($categories as $cid => $category) {
                    if ($filters && !in_array($cid, $filters)) {
                        continue;
                    }
                    $downloads++;
                    $cat = new Category($category, $cid);
                    if ($instruction_id) {
                        $results = $cat->downloadInstruction($download->getPath(), $instruction_id);
                    } else {
                        $results = $cat->downloadStructural($download->addFolder(Dir::cleanFolderName($cat->getData("label"))));
                    }
                    //Here if the array is empty there were no files, if the array has false values then
                    //These represent failed downloads and @todo need to handle this
                    if (!$results) {
                    }
                }
                if ($downloads) {
                    $zip = $download->zip($downloadFolder);
                    $download->clean();
                    Client::downloadResponse($zip, true, "files.zip");
                } else {
                    $this->notFound();
                }
            } catch (\Exception $e) {
                error_log($e->getMessage());
                //Maybe a more graceful response is needed here?
                exit("Application Error");
            }
        }

        $this->notFound();
    }

    public function notFound()
    {
        header("HTTP/1.1 404 Not Found");
        exit();
    }

    /**
     * @param int $id
     * @throws \App\Api\Exception
     */
    public function category(int $id): void
    {
        $category = CategoryApi::load($id);
        $hasDocuments = false;
        if ($category instanceof Category) {
            $hasDocuments = $category->hasDocuments();
        }
        if ($hasDocuments) {
            $args = ["category" => $category];
            DocValidator::isCategoryOwner(new Request(), $this->user, $args);

            try {
                $label = strtolower(Dir::cleanFolderName($category->getData("label")));
                $downloadFolder = Dir::getPath(config('document.download.folder'));
                $downloadPath = $downloadFolder . $label;
                foreach (glob($downloadPath . '/*.zip') as $file) {
                    if (is_file($file)) {
                        unlink($file);
                    }
                }

                $download = new Download($downloadPath);
                $results = false;
                if ($category instanceof Category) {
                    $results = $category->downloadStructural($download->getPath());
                }
                //Here if the array is empty there were no files, if the array has false values then
                //These represent failed downloads and @todo need to handle this
                if (!$results) {
                }
                $zip = $download->zip($downloadFolder);
                $download->clean();
                Client::downloadResponse($zip, true, "files.zip");
            } catch (\Exception $e) {
                error_log($e->getMessage());
                exit("Application Error");
            }
        }
        $this->notFound();
    }

    /**
     * @param int $id
     * @param int $tid
     * @param $sid
     * @throws \Exception
     */
    public function quote(int $id, int $tid, $qid = null, $sid)
    {
        try {
            $bucket = S3::getBucket('document');
            $candidateKeys = [];
            if ($qid !== null) {
                $candidateKeys[] = sprintf('%s/tenders/%s/transactions/%s/quotes/%s.zip', $id, $tid, $qid, $sid);
            }
            $candidateKeys[] = sprintf('%s/tenders/%s/transactions/quotes/%s.zip', $id, $tid, $sid);
            foreach ($candidateKeys as $file) {
                $download = S3::download($bucket, S3::getKey($file, 'projects'));

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

    public function boq(int $id)
    {
        try {
            $token = app()->Cookie->getCookie('token');
            $downloadFolder = Dir::getPath(config('document.download.folder'));
            $downloadPath = $downloadFolder . "files";
            $download = new Download($downloadPath);
            $quotes = BoQApi::get("boq/$id/quote", [], ['Authorization' => "Bearer $token"]);
            foreach ($quotes as $quote) {
                foreach ($quote['document'] ?? [] as $document) {
                    S3::save(S3::getBucket('document'), $document['s3_key'], $downloadPath . "/" . $document['name']);
                }
            }
            $zip = $download->zip($downloadFolder);
            $download->clean();
            Client::downloadResponse($zip, true, "Quote.zip");
        } catch (\Exception $e) {
            error_log($e->getMessage());
            throw new \Exception("The quote files couldn't be downloaded.");
        }
    }

    /**
     * @param int $id
     * @return void
     */
    public function boq_export(int $id)
    {
        try {
            $token = $_COOKIE['token_' . Config::get('environment')];
            $boqRes = BoQApi::get("boq/entity/$id", [], ['Authorization' => "Bearer $token"]); // Get BOQ entity data
            $boqData = array_shift($boqRes); // Get first item
            $packageName = $boqData['tender']['label'];
            $tenderId = $boqData['tender']['id'];
            $tenderRes = Tender::get("tender/$tenderId"); // Get Tender data
            $projectName = $tenderRes['project']['name'];
            $currDate = date('d/m/Y');

            Api::downloadContentFromUrl("boq/export/$id", [], ['Authorization' => "Bearer $token"], [
                "name" => "{$projectName} - {$packageName} - Tender Analysis - {$currDate}.xlsx",
                "type" => $this->headers['excel']
            ]);
        } catch (\Exception $e) {
            error_log($e->getMessage());
            app()->view->render(views_path() . "/errors/500.php");
            return;
        }
    }
}
