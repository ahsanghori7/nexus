<?php

namespace App\Models;

use App\Api\Project as ProjectApi;
use App\Api\Document\TenderTemplate as TenderTemplateApi;
use App\Api\Tender\Enquiry as EnquiryApi;

class Tender extends Abstraction
{

    public const TENDER_ENQUIRY_SENT_ID = 1;

    public const PROJECT_PHASES_TBC_LABELS = [
        "Tender",
        "Two-Stage Tender",
        "Negotiated Tender"
    ];

    protected $project;

    /**
     * @return string
     */
    public function getApiUrl(): string
    {
        return sprintf(
            "project/%s/tender/%s",
            $this->getData("project_id"),
            $this->getId()
        );
    }

    /**
     * @return int
     */
    public function checkQuickTender(): int
    {
        $tid = $this->getId();
        $pid = $this->getData("project_id");
        try {
            $categories = TenderTemplateApi::get("category", [
                "parent_id"   => $pid,
                "entity_id"   => $tid,
                "entity_type" => TenderTemplateApi::ENTITY_TYPE
            ]);
        } catch (\Exception $e) {
            $categories = [];
        }

        $categories = array_filter(array_values($categories), function ($c) {
            return (bool)count($c["documents"]);
        });

        $documents = [];
        foreach ($categories as $c) {
            $validDocs = array_filter($c["documents"], function ($d) {
                return $d["status"];
            });
            $documents = array_merge($documents, $validDocs);
        }

        usort($documents, fn($a, $b) => $b['created_at'] <=> $a['created_at']);

        $values = [];
        if (count($documents)) {
            $document = array_shift($documents);
            $meta = json_decode($document["meta"], true);
            $values = $meta["values"] ?? [];
        }

        return $values['public_private_liability'] ?? -1;
    }

    /**
     * @return Project
     * @throws \App\Api\Exception
     */
    public function getProject(): Project
    {
        if (!$this->project) {
            $pid = $this->getData("project_id");
            if (!$pid) {
                throw new \Exception("No Project id set for tender");
            }

            $data = ProjectApi::get("project/" . $pid);
            $this->project = new Project($data, $pid);
        }

        return $this->project;
    }

    /**
     * @param string $type
     * @param array $ignore_statuses_ids
     * @return int
     */
    public function getHistoryCountByType(string $type, array $ignore_statuses_ids = []): int
    {
        $count = 0;
        foreach ($this->getData($type, []) as $item) {
            if (!$ignore_statuses_ids || !in_array($item['last_status'], $ignore_statuses_ids, true)) {
                $count++;
            }
        }
        return $count;
    }


    /**
     * @return array
     */
    public function tradeIds(): array
    {
        $trades = [];
        foreach ($this->getData("packages", []) as $trade) {
            $trades[] = $trade["package_id"];
        }
        return $trades;
    }

    /**
     * The addendum's number for the letter
     *
     * @param array $data
     * @return string Empty when the tender history cannot be read.
     */
    public function getAddendumNumber(array $data = []): string
    {
        try {
            $number = EnquiryApi::getAddendumNumber(
                (int) $this->getData('project_id'),
                (int) $this->getId(),
                (int) (($data['models']['document'] ?? null)?->getId() ?? 0)
            );

            return $number ? str_pad((string) $number, 2, '0', STR_PAD_LEFT) : '';
        } catch (\Exception $e) {
            error_log('Tender::getAddendumNumber failed: ' . $e->getMessage());

            return '';
        }
    }

    /**
     * @param array $data
     * @return mixed
     */
    public function getLatestHistory(array $data = []): mixed
    {
        try {
            $subcontractor_model = $data['models']['subcontractor'] ?? $data['subcontractor'] ?? [];
            if (!$subcontractor_model) {
                return '';
            }
            $sid        = $subcontractor_model->getId();
            $tender     = $this->getData();
            $pid        = $tender['project_id'];
            $tid        = $tender['id'];
            $item_found = [];
            $type       = $data['type'] ?? $data['history_type'] ?? '';
            if ($type) {
                $history = ProjectApi::getSpecialistHistory($sid, $type);
                $tender_history = $history[$pid]['tender'][$tid][$type][$sid] ?? [];
                if ($tender_history && isset($tender_history["history"])) {
                    foreach ($tender_history["history"] as $item) {
                        $meta = json_decode($item['meta'] ?? [], true);
                        $tender_addendum = $meta['is_tender_addendum'] ?? false;
                        if ((int)$item["status_id"] === self::TENDER_ENQUIRY_SENT_ID && !$tender_addendum) {
                            $item_found[] = $item;
                        }
                    }
                }
                $item = ($item_found) ? end($item_found) : [];
            }
            $date = Util::formatDate($item['created_at'] ?? '', 'd/m/Y');
        } catch (\Exception $e) {
            $date = '';
        }
        return $date;
    }

    /**
     * @param array $tender_date
     * @param int $min_days_before
     * @param int $days_in_between
     * @param string $date_format
     * @return false|string
     */
    public function getDefaultDecisionDate(array $tender_date, int $min_days_before = 14, int $days_in_between = 28, string $date_format = 'Y-m-d')
    {
        $decision_date = $tender_date['decision_date'] ?? '';
        $start_on_site = $tender_date['start_on_site'] ?? '';
        $tender_return = $tender_date['tender_return'] ?? '';
        if (!$decision_date && $start_on_site && $tender_return) {
            $days_between = intval(Util::getDaysBetweenTwoDates($start_on_site, $tender_return));
            if ($days_between < $days_in_between) {
                $min_days_before = floor($days_between / 2);
            }
            $decision_date = date($date_format, strtotime("-$min_days_before days", strtotime($start_on_site)));
        }
        return $decision_date;
    }

    /**
     * @param array $args
     * @return string
     * @throws \App\Api\Exception
     */
    public function getSubcontractorWorks(array $args = []): string
    {
        $project = $this->getProject();
        $phase   = $project->getData("phase");
        if (!is_null($phase)) {
            $phases      = ProjectApi::getProjectConstants()['project']['phase'] ?? [];
            $phase_label = $phases[$phase] ?? '';
            if (in_array($phase_label, self::PROJECT_PHASES_TBC_LABELS, true)) {
                return 'TBC';
            }
        }
        return $this->getDate($args);
    }

    /**
     * @param array $args
     * @return int
     * @throws \App\Api\Exception
     */
    public function getService(array $args = []): int
    {
        $tender = $this->getData();
        $service = $tender["service"] ?? null;
        if (!is_null($service)) {
            $services = ProjectApi::getProjectConstants()['tender']['service'] ?? [];
            $value = array_search($service, array_keys($services));
            return $value;
        }
        return 0;
    }
}
