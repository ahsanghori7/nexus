<?php

namespace App\Models;

use App\Api\Aws\Sns;
use App\Api\Account as ApiAccount;
use App\Api\Api;
use App\Api\Document as DocumentApi;
use App\Api\Project as ProjectApi;
use App\core\Cookie;
use Exception;

class Project extends Abstraction
{
    static $error_number_document = '';
    static $token = "";

    /**
     * @param User $user
     * @return bool
     */
    public function isOwner(User $user): bool
    {
        $groupId = $this->getData("group_id");
        return ((int)$groupId) === ((int)$user->getAccountId());
    }

    /**
     * @param int $id
     * @return bool
     */
    public function hasTenderId(int $id): bool
    {
        $tender_ids = array_map(static function ($t) {
            return (int)$t['id'];
        }, $this->getData('tender'));
        return in_array($id, $tender_ids, true);
    }

    /**
     * @return Collection
     */
    public function getTenders(): Collection
    {
        return new Collection($this->getData("tender"), Tender::class);
    }

    /**
     * @param int $id
     * @return Abstraction|Tender
     */
    public function getTender(int $id): Abstraction|Tender
    {
        $tender = $this->getTenders()->filterById($id)->getFirst();
        if (!$tender) {
            $tender = new Tender();
        }
        return $tender;
    }

    /**
     * @param string $label
     * @return Abstraction
     */
    public function getTenderByLabel(string $label)
    {
        return $this->getTenders()->filterByStringField("label", $label)->getFirst();
    }

    /**
     * @return string
     */
    public function getAddress(): string
    {
        $data = $this->getData();
        return implode("\n", array_values(array_filter([
            $data['site_address_one'] ?? null,
            $data['site_address_two'] ?? null,
            $data['site_address_city'] ?? null,
            $data['site_address_postcode'] ?? null,
        ])));
    }

    /**
     * @return string
     * Replace html tags with spaces and then stripping them
     */
    public function getDescription(): string
    {
        $data = $this->getData();
        $cleanText = preg_replace('/<\/?[^>]+>/', ' ', $data['description']);
        $cleanText = preg_replace('/\s+/', ' ', $cleanText);
        return trim($cleanText);
    }

    public function getAsiteFile(array $data = []): mixed
    {
        self::$error_number_document = '';
        $source = $data['source'] ?? null;
        $isPreview = ($source === 'preview');
        $isQueue = ($source === 'queue');
        $numberedDocument = $data['numbered_document'];

        if (!$isPreview && !$isQueue) {
            return sprintf('{%s_LINK}', (($numberedDocument ?? 'ND')));
        }

        $numbers = is_array($numberedDocument) ? array_unique($numberedDocument) : [$numberedDocument];
        $cache = $this->getAsiteSessionCache();
        $results = [];

        // Use cached values where available
        foreach ($numbers as $nd) {
            if (isset($cache[$nd])) {
                $results[$nd] = $cache[$nd];
            }
        }

        $missing = array_values(array_diff($numbers, array_keys($results)));
        try {
            if ($missing) {
                if (empty(self::$token)) {
                    self::$token = app()->Cookie->getCookie('token');
                    if (!self::$token) {
                        $user = $data['user'];
                        $user_id = $user->getId();
                        $request = $user->createTokenByLabel($user_id, 'temp_1h');
                        $json = $request->json()["data"] ?? [];
                        self::$token = $json['token'];
                    }
                }

                $ndString = implode(',', $missing);
                $project_id = $this->getId();
                $res = Api::get("document/provider/asite/$ndString/project/$project_id", [], ['Authorization' => "Bearer " . self::$token]);
                if (!isset($res['url'])) {
                    throw new Exception($res['message'] ?? "Unknown Error Getting Asite URL");
                }

                $fetched = $res['url'];

                foreach ($fetched as $nd => $url) {
                    $formatted = $this->formatAsiteLinks($url);
                    $results[$nd] = $formatted;
                    $cache[$nd] = $formatted;
                }
                $this->setAsiteSessionCache($cache);
            }
            return $results;
        } catch (\Exception $e) {
            $ndLabel = is_array($numberedDocument) ? implode(',', $numberedDocument) : $numberedDocument;
            self::$error_number_document = "Error Getting Numbered Document $ndLabel. Error: " . $e->getMessage();
            return "Error Getting Numbered Document $ndLabel. Error: " . $e->getMessage();
        }
    }

    private function getAsiteSessionCache(): array
    {
        return isset($_SESSION['asite_nd_cache']) && is_array($_SESSION['asite_nd_cache'])
            ? $_SESSION['asite_nd_cache']
            : [];
    }

    private function setAsiteSessionCache(array $cache): void
    {
        $_SESSION['asite_nd_cache'] = $cache;
    }

    private function formatAsiteLinks(mixed $url): string
    {
        if (is_array($url) && count($url) > 1) {
            $links = [];
            foreach ($url as $index => $u) {
                $label = sprintf('%s%02d', "File ", $index + 1);
                $links[] = sprintf('<a target="_blank" href="%s">%s</a>', $u, $label);
            }
            return implode(', ', $links);
        }
        return sprintf('<a target="_blank" href="%s">%s</a>', is_array($url) ? reset($url) : $url, "Available via A-Site");
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function getOwner()
    {
        $data      = $this->getData();
        $author_id = $data['author_id'];
        if ($author_id) {
            $userModel = ApiAccount::get("user/$author_id/profile");
            return $userModel['firstname'] . " " . $userModel['lastname'];
        }
        return '';
    }

    /**
     * @param array $data
     * @return string
     */
    public function getCompletionDate(array $data): string
    {
        $project_data = $this->getData();
        return Util::formatDate($project_data[$data['key']], $data['format']);
    }

    /**
     * @param array $models
     * @return string
     * @throws \App\Api\Exception
     */
    public function getOrderNo(array $models = []): string
    {
        $project = $models['models']['project'] ?? $this;
        $order_no = '';
        if ($project) {
            $document = $models['models']['document'] ?? null;
            if ($document) {
                try {
                    $quote = $document->getMetaValue("quote");
                } catch (\Exception $e) {
                    $quote = [];
                }
                if (isset($quote['id'])) {
                    $qid = (int) $quote['id'];
                    $transaction = ProjectApi::get("transaction/$qid");
                    if ($transaction) {
                        $transaction = array_shift($transaction);
                    }
                    if (isset($transaction['order_number']) && $transaction['order_number']) {
                        $order_no = $transaction['order_number'];
                    }
                }
                if (!$order_no) {
                    $order_no =  $project->getData('reference') . "/" . $document->getDocumentPrefix() . $this->getNextOrderNo($project);
                }
            }
        }

        return $order_no;
    }

    /**
     * @return bool
     */
    public function hasOrderNumber(): bool
    {
        return (bool)$this->getData("order_number");
    }

    /**
     * @param Project $project
     * @return string
     * @throws \App\Api\Exception
     */
    public function getNextOrderNo(Project $project): string
    {
        $count = $this->getTransactionsCount($project);
        return (string)($count + 1) >= 10 ? ($count + 1) : "0" . ($count + 1);
    }

    /**
     * @param Project $project
     * @return int
     * @throws \App\Api\Exception
     */
    public function getTransactionsCount(Project $project): int
    {
        $count = 0;
        $transactions = ProjectApi::get('project/' . $project->getId() . '/tender/transaction');
        $transactions = array_shift($transactions);
        foreach ($transactions['tender'] as $tenders) {
            $tender_data = $this->getTendersTransactions($tenders);
            if ($tender_data) {
                $collection = new Collection($tender_data, __CLASS__);
                $count += $collection->filterByModelFunction('hasOrderNumber', true)->count();
            }
        }
        return $count;
    }

    /**
     * @param array $tenders
     * @return array
     */
    public function getTendersTransactions(array $tenders): array
    {
        $transactions = [];
        $quotes = $tenders['Quote']['transactions'] ?? [];
        foreach ($quotes as $transaction) {
            $transactions[] = array_shift($transaction['transaction']);
        }
        return $transactions;
    }

    /**
     * @param array $args
     * @return array|mixed|string|null
     * @throws \Exception
     */
    public function getValue(array $args = [])
    {
        $constants = ProjectApi::get('project/constants');
        $return    = "";
        if (isset($args['keys']) && $args['keys']) {
            $separator = $args['separator'] ?? ',';
            $value = '';
            foreach ($args['keys'] as $key) {
                if ($this->getData($key, "")) {
                    $value .= $this->getData($key, "") . $separator;
                }
            }
            $return = rtrim($value, $separator);
        }

        if (isset($args['key']) && $args['key']) {
            $value_key = $this->getData($args['key'], "");
            $return = $constants['project'][$args['key']][$value_key] ?? $this->getData($args['key'], "");
        }

        if ($return && isset($args['format'])) {
            $return = Util::formatDate($return, $args['format']);
        }

        return $return;
    }

    /**
     * @param array $args
     * @return mixed|string
     * @throws \Exception
     */
    public function getTeam(array $args = [])
    {
        $label = $args['label'] ?? '';
        $key   = $args['key'] ?? '';
        $user_id = null;
        $team = ProjectApi::get('project/' . $this->getId() . '/team');
        foreach ($team ?? [] as $member) {
            if ($member['team_member_role']['label'] === $label) {
                $user_id = $member['user_id'];
                break;
            }
        }
        if ($user_id) {
            $user = ApiAccount::get("user/$user_id/profile");
            if ($user) {
                return $user[$key] ?? "";
            }
        }
        return "";
    }

    /**
     * @param array $args
     * @return string
     * @throws \Exception
     */
    public function getTeamListSingleData(array $args = []): string
    {
        $key   = $args['key'] ?? 'display_name';
        $team  = ProjectApi::get('project/' . $this->getId() . '/team');
        $users = [];
        foreach ($team ?? [] as $member) {
            $users[$member['user_id']] = $member['team_member_role']['label'];
        }
        $output = '';
        if ($users) {
            $users_list = ApiAccount::get("user?id=[" . implode(',', array_keys($users)) . "]");
            foreach ($users_list as $user) {
                if ($key === 'display_name') {
                    $output .= $user['display_name'] . "{br}{br}";
                } elseif ($key === 'role' && isset($users[$user['id']])) {
                    $output .= $users[$user['id']] . "{br}{br}";
                }
            }
        }
        return $output;
    }

    /**
     * @param array $args
     * @return string
     * @throws \App\Api\Exception
     */
    public function getProjectMemberByRole(array $args = []): string
    {
        $team = ProjectApi::get('project/' . $this->getId() . '/team');
        $role = $args['role'] ?? null;
        $field = $args['field'] ?? null;
        $value = "";
        if ($role) {
            foreach ($team ?? [] as $member) {
                if ($member['team_member_role']['label'] === $role) {
                    $user_id = $member['user_id'];
                    $user = ApiAccount::get("user/$user_id/profile");
                    if ($user) {
                        $value = $user[$field] ?? '';
                    }
                }
            }
        }
        return $value;
    }

    public function getProfessionalIndemnity(array $args = [])
    {
        $project = $this;
        $document = $args['document'] ?? null;

        // Try to get professional indemnity from document meta first
        $value = "";
        if ($document) {
            if (is_object($document) && method_exists($document, 'getMetaValue')) {
                try {
                    $value = $document->getMetaValue('professional_indemnity');
                } catch (\Exception $e) {
                }
            }
        }

        // Fallback to project data
        if (empty($value) && $project) {
            if (is_object($project) && method_exists($project, 'getData')) {
                $value = $project->getData('professional_indemnity') ?? $project->getData('professional_indemnity_insurance') ?? null;
            } elseif (is_array($project)) {
                $value = $project['professional_indemnity'] ?? $project['professional_indemnity_insurance'] ?? null;
            }
            // If we found a value on the project and have a document model, persist into document meta for future loads
            if (!empty($value) && $document && is_object($document) && method_exists($document, 'getMeta')) {
                $meta = $document->getMeta();
                if (!isset($meta['professional_indemnity']) || $meta['professional_indemnity'] === '') {
                    $meta['values']['professional_indemnity'] = $value;
                    if (method_exists($document, 'getId') && $document->getId()) {
                        try {
                            DocumentApi::patch('document/' . $document->getId(), ['meta' => json_encode($meta)]);
                        } catch (\Exception $e) {
                            Sns::send("failed_document_process", "Failed to update document meta for professional indemnity.for document ID: " . $document->getId() . "Error:" . $e->getMessage());
                        }
                    }
                }
            }
        }

        return $value;
    }

    /**
     * @param array $args
     * @return string
     * @throws \App\Api\Exception
     */
    public function getNoticePeriodCommence(array $args = []): string
    {
        $project = $this->getData();
        $noticePeriodCommence = $project["notice_period_commence_work_on_site"] ?? 0;
        $options = ProjectApi::getProjectConstants()['project']['notice_period_commence_work_on_site'] ?? [];
        return $options[$noticePeriodCommence] ?? '';
    }

    /**
     * @param array $args
     * @return mixed|string|null
     */
    public function entityRelationship(array $args = []): mixed
    {
        $result       = '';
        $document      = $args['models']['document'];
        $config        = $document->getConfig()['data'];
        $shortcodes    = [];
        foreach ($config as $values) {
            foreach ($values as $key => $value) {
                $shortcodes[$key] = $value;
            }
        }
        if ($shortcodes) {
            foreach ($args['relationship'] ?? [] as $relationship) {
                foreach ($relationship as $key => $value) {
                    $value_key = $value['key'] ?? '';
                    if ($value_key && isset($shortcodes[$key])) {
                        $shortcode_value = $shortcodes[$key]['value'] ?? '';
                        if ($shortcode_value !== '') {
                            $option = $shortcodes[$key]['options'][$shortcodes[$key]['value']] ?? [];
                            $result = $option[$value_key] ?? '';
                            break;
                        }
                    }
                }
                if ($result) {
                    break;
                }
            }
        }
        return $result;
    }
}
