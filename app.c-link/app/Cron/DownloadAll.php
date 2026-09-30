<?php

namespace App\Cron;

use App\Api\Account;
use App\Api\Aws\Sns;
use App\Api\Aws\Sqs;
use App\Api\Document;
use App\Api\Email\Email;
use App\Api\Project;
use App\Api\S3;
use App\Api\Tender;
use App\core\Environment as Env;
use App\Models\Document\Category;
use App\Utility\Dir;
use App\Utility\Download;

class DownloadAll
{

    /**
     * @var array
     */
    protected static array $queue = [];

    /**
     * @param string $queue
     * @param int $multiple
     * @return array
     */
    public static function getQueueItems(string $queue = "download_all", int $multiple = 1) : array {
        if(Sqs::isEnabled()) {
            return Sqs::queueParallel($queue, $multiple);
        }
        return self::$queue[$queue] ?? [];
    }

    /**
     * @param $item
     * @param $k
     * @return void
     */
    public static function cleanQueueItem($item, $k = null): void
    {
        if(Sqs::isEnabled()) {
            Sqs::remove($item, "download_all");
        }
        elseif(isset(self::$queue[$k])) {
            unset(self::$queue[$k]);
        }
    }

    public function process(): void
    {
        $items  = self::getQueueItems(multiple: Sqs::getConfig('parallel'));
        foreach($items as $key => $data) {
            $content = json_decode($data['Body'], true);
            try {
                if(!$content) {
                    throw new \Exception("Malformed message json");
                }
                $this->download($content);
                self::cleanQueueItem($data, $key);
            }
            catch (\Exception $t) {
                Sns::send("download_all_process_queue", json_encode([
                    "environment" => Env::getValue("ENVIRONMENT"),
                    'error' => $t->getMessage(),
                    'data'  => $content
                ]));
            }
        }
    }

    /**
     * @param array $content
     * @return void
     * @throws \App\Api\Exception
     */
    public function download(array $content = []): void
    {
        set_time_limit(config('php.settings.max_execution_time'));

        $filters        = $content["ids"] ?? [];
        $instruction_id = $content["instruction_id"] ?? 0;
        $categories = Document::get("category", [
            "entity_id"   => $content["tid"]  ?? 0,
            "entity_type" => $content["type"] ?? "",
        ]);

        $project = Project::getProject($content["pid"] ?? 0);
        $tender  = Tender::getTender($content["pid"], $content["tid"]);
        $aid     = $project['group_id'];
        $account = Account::getAccount($aid);

        $error = '';
        if ($categories) {
            try {
                $label          = Dir::cleanFolderName($content["label"] ?? "Documents");
                $downloadFolder = Dir::getPath(config('document.download.folder'));
                $downloadPath   = $downloadFolder . $label;
                $download       = new Download($downloadPath);
                $downloads      = 0;
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
                    if (!$results) {
                        $error = 'The documents could not be downloaded';
                    }
                }
                if ($downloads) {
                    $zip = $download->zip($downloadFolder);
                    $download->clean();
                    //upload zip to s3
                    $key = sprintf(
                        "%s-%s-%s/Documents.zip",
                        time(),
                        $content['tid'],
                        hash("sha256", bin2hex(random_bytes(16)))
                    );
                    $res = S3::upload("download_all", $key, $zip, "zip");
                    $download_url = $res['ObjectURL'] ?? null;
                    if($download_url) {
                        //send email to the client with the aws link
                        Email::send([
                            'template' => 'Download Documents',
                            'sender'   => ['id' => $aid],
                            'to'       => $content['email'],
                            'extra'    => [
                                'main_contractor' => $account['name'],
                                "user_name"       => $content['user_name'],
                                'project_name'    => $project['name'],
                                'package_name'    => $tender['label'],
                                'download_url'    => $download_url
                            ]
                        ],'clink');
                    }
                    else{
                        $error = 'Failed to upload zip to S3';
                    }

                } else {
                    $error = 'No documents were found';
                }

                if($error){
                    Sns::send("download_all_process_queue", json_encode([
                        "environment" => Env::getValue("ENVIRONMENT"),
                        'error' => $error,
                        'data'  => $content
                    ]));
                }
            } catch (\Exception $e) {
                Sns::send("download_all_process_queue", json_encode([
                    "environment" => Env::getValue("ENVIRONMENT"),
                    'error' => $e->getMessage(),
                    'data'  => $content
                ]));
                error_log($e->getMessage());
                exit("Application Error");
            }
        }
    }
}
