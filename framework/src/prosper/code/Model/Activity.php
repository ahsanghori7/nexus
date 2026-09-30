<?php

namespace Prosper\Model;

use Core\Service\Manager;
use Core\Data\Shape;

class Activity
{

    /**
     * @param int $aid
     * @return mixed
     */
    public static function getData(int $aid): mixed
    {
        try {
            $data = Manager::getService('project')
                ->fetch("tender", ["specialist_id" => $aid])
                ->getCollection('data')
                ->getItemsAsArray();
        } catch (\Exception $e) {
            $data = [];
        }
        return $data;
    }

    /**
     * @param int $aid
     * @return mixed
     *
     * @throws \Exception
     */
    public static function getTransactions(int $aid): mixed
    {
        try {
            $transactions = Manager::getService('project')
                ->fetch("transaction", ["subcontractor_id" => $aid])
                ->getCollection('data')
                ->getItemsAsArray();
        } catch (\Exception $e) {
            $transactions = [];
        }
        return $transactions;
    }

    /**
     * @param array<mixed> $transactions
     * @return mixed
     *
     * * @throws \Exception
     */
    public static function processTransaction(array $transactions): mixed
    {
        $activities = [];
        foreach ($transactions as $i) {
            $i = (array)$i;
            $pid = strval(((array)$i['tender'])['project_id']);
            $tid = intval(((array)$i['tender'])['id']);

            try {
                $project = Manager::getService('project')->fetch("project/$pid")->get("data");
                $data = $project->get("name");
                $projectName = is_array($data) ? $data[0] : $data;
            } catch (\Exception $e) {
                $projectName = "";
            }

            $activities[(int)$pid][$tid] = [
                'project' => $projectName,
                'package' => ((array)$i['tender'])['label'],
                'id' => $pid . $tid,
                'quotes_uploaded' => $i['quote_created']
            ];

            $activities[(int)$pid][$tid]["quotes_uploaded"] = date("Y-m-d", strtotime($i['quote_created']));
        }
        return $activities;
    }

    /**
     * @param array<mixed> $interests
     * @return mixed
     */
    public static function processInterests(array $tender, $pid, $tid, &$latest_history_date): mixed
    {
        if (!isset($tender["Interest"])) {
            return [];
        }

        $interests = $tender["Interest"];
        $interest = end($interests);
        $history = end($interest['history']);

        if (strtotime(strval($history['created_at'])) > $latest_history_date[$pid][$tid]) {
            if ($latest_history = strtotime(strval($history['created_at']))) {
                $latest_history_date[$pid][$tid] = $latest_history;
            }
        }
        $status = 0;
        if (((array)$tender)["awarded"]) {
            $status = 1;
        }
        return [
            'package' => $tender['label'],
            'packaged_awarded_status' => $status,
            'interest_registered' =>  date("Y-m-d", $latest_history_date[$pid][$tid])
        ];
    }

    /**
     * @param array<mixed> $tender
     * @param Collection $history_statuses
     * @return mixed
     */
    public static function processEnquiries(array $tender, $history_statuses): mixed
    {
        if (!isset($tender["Enquiry"])) {
            return [];
        }

        date_default_timezone_set('Europe/London');
        $enquiries = $tender["Enquiry"] ?: [];
        $enquiry = end($enquiries);
        $sent_status = $history_statuses->filterByField('uid', 'sent')->getFirst();
        $history_first = [];
        array_map(function ($item) use (&$history_first, $sent_status) {
            $item = (array)$item;
            if (intval($item['status_id']) === $sent_status->get("id")) {
                $history_first = $item;
            }
        }, (array)((array)$enquiry)['history']);

        //unawarded
        $status = 0;

        //awarded
        if (((array)$tender)["awarded"]) {
            $status = 1;
        }

        //awarded to the subcontractor
        $history_last = end($enquiry['history']);
        $awarded_status = $history_statuses->filterByField('uid', 'awarded')->getFirst();
        if ($tender["awarded"] && $history_last['status_id'] === $awarded_status->get("id")) {
            $status = 2;
        }

        $history_first = (array)$history_first;
        $createdAt = strval($history_first['created_at']) ?: date("Y-m-d");
        $history_first['created_at'] = date('Y-m-d', strtotime("$createdAt UTC") ?: null);

        return [
            "package" => $tender['label'],
            "packaged_awarded_status" => $status,
            "enquiry_recieved" => $history_first['created_at'],
        ];
    }

    /**
     * @param array<mixed> $orders
     * @param Collection $history_statuses
     * @return array<mixed>
     */
    public static function processOrders(array $tender, int $aid, $pid, $tid, $tenders, &$latest_history_date, $history_statuses): mixed
    {
        if (!isset($tender["Order"])) {
            return [];
        }

        $historyOrders = [];
        if (isset($tenders[$tid])) {
            $tenderOrder = $tenders[$tid]['Order'];
            foreach ($tenderOrder as $t) {
                foreach ($t['history'] as $h) {
                    $historyOrders[] = $h;
                }
            }
        }

        usort($historyOrders, function ($item1, $item2) {
            return $item1['created_at'] <=> $item2['created_at'];
        });

        $lastHistoryOrder = end($historyOrders);
        $historySpecialistId = (int)$lastHistoryOrder['specialist_id'];

        $tender = (array)$tender;
        $order = (array)(end($tender['Order']));
        $status_id = end($order['history'])['status_id'];
        $awarded_status = $history_statuses->filterByField('uid', 'awarded')->getFirst();

        return ($tender["awarded"] && $status_id === $awarded_status->get("id")) ? [
            'packaged_awarded_status' => $historySpecialistId === $aid ? 2 : 1,
            'quotes_uploaded' =>  date("Y-m-d", $latest_history_date[$pid][$tid])
        ] : [];
    }

    /**
     * @param array<mixed> $activities
     * @return array<mixed>
     */
    public static function formatActivities(array $activities): array
    {
        $result = [];
        foreach ($activities as $activity) {
            foreach ((array)$activity as $tid => $package) {
                $tid = intval($tid);
                if (isset($result[$tid])) {
                    $result[$tid] = array_merge((array)$result[$tid], (array)$package);
                } else {
                    $result[$tid] = $package;
                }
            }
        }
        return array_values($result);
    }
}
