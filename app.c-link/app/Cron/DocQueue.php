<?php

namespace App\Cron;

use App\Api\Aws\Sns;
use App\Api\Aws\Sqs;
use App\Cron\DocQueue\Enquiry;
use App\Cron\DocQueue\Order;
use App\Cron\DocQueue\Snapshot;
use App\Cron\DocQueue\Item;
use App\core\Environment as Env;
use App\Api\Account as AccountApi;
use App\Api\Tender\Enquiry as EnquiryApi;
use App\Api\Project as ProjectApi;
use App\Cron\DocQueue\PreviewSnapshot;

class DocQueue {

    /**
     * @var array
     */
    protected static array $queue = [];

    /**
     * @param string $queue
     * @param int $multiple
     * @return array
     */
    public static function getQueueItems($queue="default", int $multiple = 1) : array {
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
    public static function cleanQueueItem($item, $k=null, $queue = 'default') {
        if(Sqs::isEnabled()) {
            Sqs::remove($item, $queue);
        }
        elseif(isset(self::$queue[$k])) {
            unset(self::$queue[$k]);
        }
    }

    /**
     * @throws \Mpdf\MpdfException
     */
    public function process(): void
    {
        $start_time = microtime(true);
        $items  = self::getQueueItems('default', Sqs::getConfig('parallel'));
        $itemCount = count($items);
        $failed = 0;

        foreach($items as $k => $data) {
            $content = json_decode($data['Body'], true);
            try {
                if(!$content) {
                    throw new \Exception("Malformed message json");
                }

                $item = new Item($content);
                $docClass = self::getDocType($content);
                $docType  = new $docClass($item);
                $docType->process();
                self::cleanQueueItem($data, $k);
            }
            catch (\Exception $t) {
                $message = json_encode($data);
                if(isset($item)) {
                    $message = json_encode($item->getData());
                }
                self::handleQueueError($t, $message);
                $messageArray = json_decode($message, true);
                if(isset($messageArray['enquiry_type']) && $messageArray['enquiry_type'] == 'sending_tender'){
                    $recipientIds = $messageArray['suids'] ?? [];
                    $email = null;

                    if (!empty($recipientIds)) {
                        $userId = (int) $recipientIds[0];
                        $userProfile = AccountApi::get("user/$userId/profile");
                        $email = $userProfile['email'] ?? null;
                    }

                    $emailTypeIds = AccountApi::getEmailTypeIds(['bounce', 'sent']);
                    AccountApi::post("email/log", [
                        "email_id" => $emailTypeIds[0] ?? 2,
                        "user_id"  => $messageArray['uid'] ?? null,
                        "template" => 'Tender Received Inactive',
                        "meta"     => json_encode([
                            'recipient_id' => $messageArray['suids'] ?? [],
                            'enquiry'      => $messageArray['did'] ?? null,
                            'entity_type'  => 'Enquiry Sent',
                            'tender_id'    => $messageArray['tid'] ?? null,
                            'account_id'   => $messageArray['sids'] ?? null,
                            'email'        => $email
                        ])
                    ]);

                    // Processed emails count (all users)
                    $processed = AccountApi::get("email/logs-by-entity-account", [
                        "user_ids"     => $messageArray['uid'] ?? null,
                        'enquiry'      => $messageArray['did'] ?? null,
                        'entity_type'  => 'Enquiry Sent',
                        'account_id'   => (string)($messageArray['sids'] ?? '')
                    ]);

                    $accountTotalUsers = $messageArray['account_total_users'] ?? 0;
                    if (count($processed) < $accountTotalUsers) {
                        return;
                    }

                    // Any success?
                    $sent = AccountApi::get("email/logs-by-entity-account", [
                        "user_ids"     => $messageArray['uid'] ?? null,
                        'enquiry'      => $messageArray['did'] ?? null,
                        'entity_type'  => 'Enquiry Sent',
                        'account_id'   => (string)($messageArray['sids'] ?? ''),
                        'email_id'     => $emailTypeIds[1] ?? 4
                    ]);

                    $tenderTypeIDs = ["sent", "bounced", "in_queue"];
                    $tenderStatus = ProjectApi::getTenderHistoryTypeIds($tenderTypeIDs);

                    $finalStatus = (count($sent) > 0) ? ($tenderStatus[0] ?? 1) : ($tenderStatus[1] ?? 18);

                    // Update tender_history if still in_queue
                    $results = EnquiryApi::get(
                        "project/".($messageArray['pid'] ?? '')."/tender/".($messageArray['tid'] ?? '')."/history",
                        [
                            "specialist_id" => $messageArray['sids'] ?? null,
                            "status_id"     => $tenderStatus[2] ?? 15
                        ]
                    );

                    $results = array_shift($results);
                    if (!$results || empty($results['history'])) {
                        return;
                    }

                    $history = array_shift($results['history']);

                    EnquiryApi::updateHistory(
                        $messageArray['pid'] ?? null,
                        $messageArray['tid'] ?? null,
                        $history['id'] ?? null,
                        ["status_id" => $finalStatus]
                    );
                }
                $failed ++;
            }
        }

        $average = number_format((microtime(true) - $start_time) / Sqs::getConfig('parallel'));
        self::checkQueueTimer($average, json_encode($items));

        echo "Queue processed ". ($itemCount - $failed) . " out of $itemCount items\n";
    }

    public function processSnapshot(): void
    {
        $start_time = microtime(true);
        $items  = self::getQueueItems('snapshot', Sqs::getConfig('snapshot_parallel'));

        $itemCount = count($items);
        $failed = 0;

        foreach ($items as $k => $data) {
            $content = json_decode($data['Body'], true);
            try {
                if (!$content) {
                    throw new \Exception('Malformed snapshot message json');
                }
                (new Snapshot($content))->process();
                self::cleanQueueItem($data, $k, 'snapshot');
            } catch (\Exception $t) {
                self::handleQueueError($t, json_encode($data));
                $failed++;
            }
        }

        $average = number_format((microtime(true) - $start_time) / Sqs::getConfig('snapshot_parallel'));
        self::checkQueueTimer($average, json_encode($items));

        echo "Snapshot queue processed " . ($itemCount - $failed) . " out of $itemCount items\n";
    }

    public function processPreviewSnapshot(): void
    {
        $start_time = microtime(true);
        $items  = self::getQueueItems('preview_snapshot', Sqs::getConfig('parallel'));

        $itemCount = count($items);
        $failed = 0;

        foreach ($items as $k => $data) {
            $content = json_decode($data['Body'], true);
            try {
                if (!$content) {
                    throw new \Exception('Malformed preview snapshot message json');
                }
                (new PreviewSnapshot($content))->process();
                self::cleanQueueItem($data, $k, 'preview_snapshot');
            } catch (\Exception $t) {
                self::handleQueueError($t, json_encode($data));
                $failed++;
            }
        }

        $average = number_format((microtime(true) - $start_time) / Sqs::getConfig('parallel'));
        self::checkQueueTimer($average, json_encode($items));

        echo "Preview Snapshot queue processed " . ($itemCount - $failed) . " out of $itemCount items\n";
    }

    /**
     * @param int $average
     * @param string $body
     * @throws \Exception
     */
    public static function checkQueueTimer(int $average, string $body): void
    {
        $total_time = $average * Sqs::getConfig('parallel');
        if($average > Sqs::getConfig('timeout_average') || $total_time > Sqs::getConfig('timeout_total')) {
            //Send warning emails if the queue takes too much time
            $message = "Queue timeout:";
            $message .= "\nEnvironment: " . Env::getValue("ENVIRONMENT");
            $message .= "\nBody: " . $body;
            $message .= "\nTime Total: " . $total_time;
            $message .= "\nTime Average: " . $average;
            Sns::send("timeout_document_process", $message);
            if(!Env::isDevelopment()) {
                Sns::send("timeout_document_process", $message);
            }
            else {
                echo $message . "\n";
            }
        }
    }

    /**
     * @param \Exception $e
     * @return void
     */
    public static function handleQueueError(\Throwable $e, string $body) {
        //Send warning emails if queue fails to process
        $message = "Document Failed to process with error " . $e->getMessage();
        $message .= "\nException: " . get_class($e);
        $message .= "\nEnvironment: " . Env::getValue("ENVIRONMENT");
        $message .= "\nTimestamp: " . date('c');
        $message .= "\nBody: " . $body;
        $message .= "\nStack Trace:\n" . $e->getTraceAsString();
        if(!Env::isDevelopment()) {
            try {
                Sns::send("failed_document_process", $message);
            } catch (\Throwable $snsError) {
                error_log("Failed to publish SNS notification: " . $snsError->getMessage());
            }
        }
        else {
            echo $message . "\n";
        }

        error_log($message);
    }

    /**
     * @param array $data
     * @return string
     */
    public static function getDocType(array $data) {
        if(isset($data["qid"]) && $data["qid"]) {
            return Order::class;
        }
        else {
            return Enquiry::class;
        }
    }

    /**
     * @param array $data
     * @param $queue
     * @return void
     * @throws \Mpdf\MpdfException
     */
    public static function send(array $data, $queue="default") {
        $message = json_encode($data);
        if(Sqs::isEnabled()) {
            Sqs::send($message, $queue);
        }
        else {
            self::setManualQueueItem($queue, $message);
            (new DocQueue())->process();
        }
    }

    /**
     * @param string $queue
     * @param string $message
     * @return void
     */
    public static function setManualQueueItem(string $queue, string $message) {
        self::$queue[$queue][] = ["Body" => $message];
    }
}
