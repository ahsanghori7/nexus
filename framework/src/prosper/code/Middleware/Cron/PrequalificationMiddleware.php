<?php

namespace Prosper\Middleware\Cron;

use DateTime;
use Core\Data\Collection;
use Core\Service\Manager;
use Prosper\Middleware\Cron\AbstractPrequalificationMiddleware;

class PrequalificationMiddleware extends AbstractPrequalificationMiddleware
{
    const OTHER_SECTION = "Other";
    const DOCUMENTS_PARENT_CODE = "documents";
    const INSURANCE_CODE = "insurances";
    const EXAMPLE_DOCUMENTS_CODE = "example-documents";

    const UK_SECTIONS_CONFIG = [
        1 => [4, 5, 6],
        3 => []
    ];

    private $documentAccounts;
    private $documentTypes;
    private $documentSubtypes;

    public function setDocumentsAccount(array $documentAccounts): void
    {
        $this->documentAccounts = $documentAccounts;
    }

    public function getDocumentsAccount(): array
    {
        return $this->documentAccounts;
    }

    public function setDocumentTypes(Collection $documentTypes): void
    {
        $this->documentTypes = $documentTypes;
    }

    public function getDocumentTypes(): Collection
    {
        return $this->documentTypes;
    }

    public function setDocumentSubtypes(Collection $documentSubtypes): void
    {
        $this->documentSubtypes = $documentSubtypes;
    }

    public function getDocumentSubtypes(): Collection
    {
        return $this->documentSubtypes;
    }

    private $certificates;

    public function setCertificates(Collection $certificates): void
    {
        $this->certificates = $certificates;
    }

    public function getCertificates(): Collection
    {
        return $this->certificates;
    }

    private $prequalificationSections;

    public function setPrequalificationSections(Collection $prequalificationSections): void
    {
        $this->prequalificationSections = $prequalificationSections;
    }

    public function getPrequalificationSections(): Collection
    {
        return $this->prequalificationSections;
    }

    public function getConfig(): array
    {
        $config = self::UK_SECTIONS_CONFIG;
        $documentsParent = $this->getPrequalificationSections()->filterByField("code", self::DOCUMENTS_PARENT_CODE)->getFirst();
        if ($documentsParent) {
            $config[$documentsParent->int("id")] = $this->getDocumentSectionIds();
        }
        return $config;
    }

    private function getRequiredDocumentCertificates(): array
    {
        return array_values(array_filter($this->getCertificates()->getItemsAsArray(), function ($cert) {
            //Example Documents are evidential samples with no issuing body and no expiry date,
            //so they are excluded from the PQQ status entirely - neither their absence nor an
            //expiry may move the PQQ status.
            return !empty($cert["id"])
                && !empty($cert["uid"])
                && !empty($cert["documents"])
                && $cert["uid"] !== self::EXAMPLE_DOCUMENTS_CODE;
        }));
    }

    private function getDocumentSectionIds(): array
    {
        $ids = [];
        foreach ($this->getRequiredDocumentCertificates() as $cert) {
            $section = $this->getPrequalificationSections()->filterByField("code", $cert["uid"])->getFirst();
            if ($section) {
                $ids[] = $section->int("id");
            }
        }

        return $ids;
    }

    public function checkStatus(int $id): array
    {
        $data = Manager::getService("account")->fetch("prequalification/$id")->get("data");

        $turnover = $data->get("turnover", []);
        $references = $data->get("references", []);
        $meta = $data->get("meta", []);

        $data = [];

        $this->checkFinance($data, $turnover, $meta);
        $this->checkDocuments($data, $id);
        $this->checkReferences($data, $references);

        return $data;
    }

    private function checkFinance(array &$data, array $turnover, array $meta)
    {
        [$turnoverSection, $orderValueSection, $employeesSection] = self::UK_SECTIONS_CONFIG[1];
        $data[$turnoverSection] = false;
        if ($turnover) {
            $validData = array_filter($turnover, function ($item) {
                return intval($item["active_trading"]) && intval($item["value"]);
            });
            $data[$turnoverSection] = (bool)count($validData);
        }

        $data[$orderValueSection] = false;
        if (isset($meta["min_order_value"]) && isset($meta["max_order_value"])) {
            $data[$orderValueSection] = intval($meta["min_order_value"]) && intval($meta["max_order_value"]);
        }

        $data[$employeesSection] = (bool)intval($meta["num_current_employees"] ?? 0);

        $data[1] = $data[$turnoverSection]
            && $data[$orderValueSection]
            && $data[$employeesSection];
    }

    private function checkDocuments(array &$data, int $aid)
    {
        $prequalificationSections = $this->getPrequalificationSections();
        $documentsAccount = $this->getDocumentsAccount();
        $today = new DateTime();
        $today->setTime(0, 0, 0);

        $sectionComplete = true;
        $anySectionChecked = false;
        foreach ($this->getRequiredDocumentCertificates() as $cert) {
            $subtype = $cert["id"];
            $uid = $cert["uid"];
            $documents = $cert["documents"];

            $section = $prequalificationSections->filterByField("code", $uid)->getFirst();
            if (!$section) {
                continue;
            }
            $sectionId = $section->int("id");

            if ($uid === self::INSURANCE_CODE) {
                $docs = array_map(function ($d) {
                    return $d["name"];
                }, $documents);

                $completeDocuments = [];
                foreach ($docs as $doc) {
                    if ($doc === self::OTHER_SECTION) {
                        continue;
                    }
                    $accountDocuments = $this->filterDocuments($documentsAccount, $subtype, $aid);
                    $completeDocuments[$doc] = $this->hasUnexpiredDocument($accountDocuments, $today);
                }

                $completedDocuments = count(array_filter($completeDocuments, function ($doc) {
                    return $doc;
                }));

                $anySectionChecked = true;
                $data[$sectionId] = $completedDocuments > 1;
            } else {
                $accountDocuments = $this->filterDocuments($documentsAccount, $subtype, $aid);
                $anySectionChecked = true;
                $data[$sectionId] = !$this->hasExpiredDocument($accountDocuments, $today);
            }

            if (!$data[$sectionId]) {
                $sectionComplete = false;
            }
        }

        if (!$anySectionChecked) {
            $sectionComplete = false;
        }

        $documentsParent = $prequalificationSections->filterByField("code", self::DOCUMENTS_PARENT_CODE)->getFirst();
        if ($documentsParent) {
            $data[$documentsParent->int("id")] = $sectionComplete;
        }
    }

    private function checkReferences(array &$data, array $references)
    {
        $result = false;
        if ((bool)count($references)) {

            $approved = array_filter($references, function ($ref) {
                return $ref['status'] === "approved";
            });

            if ($approved && count($approved)) {
                $result = true;
            }
        }
        $data[3] = $result;
    }

    private function filterDocuments($documents, $subtype, $owner_id)
    {
        $result = [];
        foreach ($documents as $document) {
            if ($document['subtype'] != $subtype) {
                continue;
            }

            if (isset($document['owner'])) {
                foreach ($document['owner'] as $owner) {
                    if ($owner['owner_id'] == $owner_id) {
                        $result[] = $document;
                        break;
                    }
                }
            }
        }
        return $result;
    }

    private function parseDocumentDate(array $doc): ?DateTime
    {
        $documentValues = json_decode($doc["meta"], true);
        if (isset($documentValues["date"]) && $documentValues["date"]) {
            try {
                return new Datetime($documentValues["date"]);
            } catch (\Throwable $th) {
                return null;
            }
        }
        return null;
    }

    private function hasUnexpiredDocument(array $documents, DateTime $today): bool
    {
        return (bool) array_filter($documents, function ($doc) use ($today) {
            $documentDate = $this->parseDocumentDate($doc);
            return $documentDate !== null && $documentDate >= $today;
        });
    }

    private function hasExpiredDocument(array $documents, DateTime $today): bool
    {
        return (bool) array_filter($documents, function ($doc) use ($today) {
            $documentDate = $this->parseDocumentDate($doc);
            return $documentDate !== null && $documentDate < $today;
        });
    }
}
