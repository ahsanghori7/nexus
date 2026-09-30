<?php

namespace Api\Middleware\Pdf\tender;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\ServiceMiddleware;
use Core\Service\Manager;

class TenderRecommendationPdfMiddleware extends ServiceMiddleware
{
    public const SERVICE = 'pdf';
    public const ROLE_LABEL_PROJECT_MANAGER = 'Project Manager';
    private const ENTITY_TYPE    = 'tender_recommendation_document';

    public static function setOptions(): \Closure
    {
        return function ($action) {
            try {
                $saveDir = Config::get('tender_recommendation.pdf.save.tmp');
            } catch (\Exception $e) {
                $saveDir = getenv('TENDER_RECOMMENDATION_PDF_SAVE_TMP') ?: null;
            }
            if (!$saveDir) {
                $frameworkRoot = dirname(__DIR__, 7); // .../framework
                $default = $frameworkRoot . '/public/static/tender-recommendations';
                $saveDir = $default;
            }
            if ($saveDir && !is_dir($saveDir)) {
                mkdir($saveDir, 0775, true);
            }
            self::getService()->setPdfOptions([
                'files_location' => __DIR__ . '/files/tender_recommendation_report.php',
                'save_location'  => $saveDir,
                'parse_head_css' => true,
            ]);
        };
    }

    public static function generateReport(): \Closure
    {
        return function ($action) {
            try {
                $id = (int)$action->get('uriArgs.id');
                $projectId = (int)$action->get('uriArgs.project_id');

                // Generate dynamic data from services
                $pdfData = self::getDynamicData($id, $projectId);

                $pdfName = sprintf('tender-recommendation-report-%d', $id);
                $result = self::getService()->generatePDF($pdfData, $pdfName);

                if (!$result || !isset($result['path']) || !file_exists($result['path'])) {
                    throw new \Exception('PDF generation failed - no file created');
                }

                $action->set('pdf', $result);
            } catch (\Exception $e) {
                throw new MiddlewareException('pdfGenerationError', $e->getMessage(), 0, $e);
            }
        };
    }

    /**
     * Generate report with optional direct output for development
     */
    public static function generateReportWithPreview(): \Closure
    {
        return function ($action) {
            $id = (int)$action->get('uriArgs.id');
            $projectId = (int)$action->get('uriArgs.project_id');

            // Generate dynamic data from services
            $pdfData = self::getDynamicData($id, $projectId);

            $pdfName = sprintf('tender-recommendation-report-%d', $id);
            $result = self::getService()->generatePDF($pdfData, $pdfName);

            // Check if this is a preview request (you can add a query parameter or header)
            $request = $action->getRoute()->getRequest();
            $isPreview = $request->getArgs()->get('preview') ?? false;

            if ($isPreview) {
                // Output PDF directly to browser for development
                header('Content-Type: application/pdf');
                header('Content-Disposition: inline; filename="' . $result['name'] . '"');
                header('Content-Length: ' . $result['size']);
                readfile($result['path']);
                unlink($result['path']); // Clean up
                exit;
            }

            $action->set('pdf', $result);
        };
    }

    /**
     * Development mode - output PDF directly to browser
     */
    public static function outputPdfDirectly(): \Closure
    {
        return function ($action) {
            $id = (int)$action->get('uriArgs.id');
            $projectId = (int)$action->get('uriArgs.project_id');

            // Generate dynamic data from services
            $pdfData = self::getDynamicData($id, $projectId);

            $pdfName = sprintf('tender-recommendation-report-%d', $id);
            $result = self::getService()->generatePDF($pdfData, $pdfName);

            // Output PDF directly to browser
            header('Content-Type: application/pdf');
            header('Content-Disposition: inline; filename="' . $result['name'] . '"');
            header('Content-Length: ' . $result['size']);
            readfile($result['path']);
            exit;
        };
    }

    /**
     * Development mode: Return PDF URL for browser preview
     */
    public static function returnPdfUrl(): \Closure
    {
        return function ($action) {
            $id = (int)$action->get('uriArgs.id');
            $projectId = (int)$action->get('uriArgs.project_id');

            // Generate dynamic data from services
            $pdfData = self::getDynamicData($id, $projectId);

            $pdfName = sprintf('tender-recommendation-report-%d', $id);
            $result = self::getService()->generatePDF($pdfData, $pdfName);

            // Set headers for PDF output
            header('Content-Type: application/pdf');
            header('Content-Disposition: inline; filename="' . $pdfName . '.pdf"');
            header('Content-Length: ' . filesize($result['path']));

            // Output the PDF file
            readfile($result['path']);

            // Clean up the temporary file
            unlink($result['path']);
            exit;
        };
    }

    public static function uploadToS3(): \Closure
    {
        return function ($action) {
            $id = (int)$action->get('uriArgs.id');
            $documentPath = 'tender-recommendations';
            Manager::getService('s3')->upload([
                'tmp_name' => $action->get('pdf.path'),
                'name'     => $action->get('pdf.name'),
                'type'     => 'application/pdf',
                'size'     => filesize($action->get('pdf.path')),
            ], 'document', $documentPath);
            $key = Manager::getService('s3')->getKey($action->get('pdf.name'), $documentPath);
            $action->set('s3_key', $key);
        };
    }

    public static function cleanTmpFile(): \Closure
    {
        return function ($action) {
            $path = $action->get('pdf.path');
            if ($path && file_exists($path)) {
                unlink($path);
                gc_collect_cycles();
            }
        };
    }

    public static function respondWithS3Url(): \Closure
    {
        return function ($action) {
            $key = $action->get('s3_key');
            $url = Manager::getService('s3')->getSignedURI('document', $key, 900);
            $action->set('json', json_encode([
                'url' => $url,
                'key' => $key,
                'is_approver' => $action->get('isApprover'),
                'tender_recommendation' => current($action->get('tender_recommendation')->get())
            ]));
        };
    }

    public static function getOrGenerateReport(): \Closure
    {
        return function ($action) {
            $id = (int)$action->get('uriArgs.id');
            $documentPath = 'tender-recommendations';
            $fileName = sprintf('tender-recommendation-report-%d.pdf', $id);

            // Check if file exists in S3
            $s3Service = Manager::getService('s3');
            $key = $s3Service->getKey($fileName, $documentPath);

            try {
                // Try to get a signed URL for the file
                $url = $s3Service->getSignedURI('document', $key, 900);
                $action->set('json', json_encode(["url" => $url, "key" => $key]));
                return; // Exit early if file exists
            } catch (\Exception $e) {
                // File doesn't exist, continue to generate
                $action->set('pdf_not_found', true);
            }
        };
    }

    public static function generateIfNotFound(): \Closure
    {
        return function ($action) {
            if (!$action->get('pdf_not_found')) {
                return; // Skip if PDF already exists
            }

            // Generate PDF using the existing methods (will use mock toggle from generateReport)
            self::setOptions()($action);
            self::generateReport()($action);
            self::uploadToS3()($action);
            self::cleanTmpFile()($action);
            self::respondWithS3Url()($action);
        };
    }

    /**
     * Generate dynamic data from services
     */
    private static function getDynamicData(int $tenderRecommendationId, int $projectId): Shape
    {
        try {
            $projectSvc = Manager::getService('project');
            $accountSvc = Manager::getService('account');

            $recMeta = self::fetchTenderRecommendationMeta($projectSvc, $projectId, $tenderRecommendationId);
            $transactionId = $recMeta['transaction_id'];
            $tenderId = $recMeta['tender_id'];
            $authorId = $recMeta['author_id'];

            // Fetch tender details
            $tenderResponse = $projectSvc->fetch("tender/$tenderId");
            $tender = $tenderResponse->get('data');

            // Fetch project details
            $projectResponse = $projectSvc->fetch("project", ['id' => $projectId]);
            $project = $projectResponse->getCollection('data')->first();
            $projectData = $project ? $project->toArray() : [];

            $projectManagers = [];
            try {
                $teamResponse = $projectSvc->fetch("project/$projectId/team");
                $teamMembers = $teamResponse->getCollection('data');

                foreach ($teamMembers as $member) {
                    $memberData = $member->toArray();

                    // Extract role label from possible structures
                    $roleLabel = $memberData['team_member_role']['label']?? null;

                    if ($roleLabel === self::ROLE_LABEL_PROJECT_MANAGER) {
                        $userId = (int)($memberData['user_id'] ?? $memberData['member']['id'] ?? 0);
                        if ($userId > 0) {
                            try {
                                $userResponse = $accountSvc->fetch("user", ['id' => $userId]);
                                $user = $userResponse->getCollection('data')->first();
                                if ($user) {
                                    $displayName =
                                        $user->get('display_name')
                                        ?: trim(($user->get('firstname') ?? '') . ' ' . ($user->get('lastname') ?? ''))
                                        ?: 'N/A';
                                    $projectManagers[] = $displayName;
                                }
                            } catch (\Exception $e) {
                                throw new MiddlewareException('projectManagerFetchError', 'Failed to fetch project manager user: ' . $e->getMessage(), 0, $e);
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                throw new MiddlewareException('projectTeamFetchError', 'Failed to fetch project team: ' . $e->getMessage(), 0, $e);
            }

            if (empty($projectManagers)) {
                $projectManagers = ['N/A'];
            }

            // Fetch selected transaction using v1 endpoint
            $selectedTransactionResponse = $projectSvc->fetch('transaction', ['id' => $transactionId]);
            $selectedTransaction = $selectedTransactionResponse->getCollection('data')->first();
            $selectedTransactionData = $selectedTransaction ? $selectedTransaction->toArray() : null;

            // Fetch quotes for this project/package (tender) via v2 endpoint
            $quotesResponse = $projectSvc->fetch("project/$projectId/package/$tenderId/quotes");
            $quotes = [];
            try {
                $quotes = $quotesResponse->getCollection('data');
            } catch (\Exception $e) {
                $quotes = [];
            }

            // Map quotes into unified transactions structure expected by the PDF
            $allTransactionsData = [];
            $accountName = [];
            foreach ($quotes as $quote) {
                $row = is_object($quote) && method_exists($quote, 'toArray') ? $quote->toArray() : (array)$quote;

                $accountId = (int)($row['subcontractor_id'] ?? 0);
                $subcontractorName = 'N/A';

                if ($accountId > 0) {
                    $accountResponse = $accountSvc->fetch("account", ['id' => $accountId]);
                    $account = $accountResponse->getCollection('data')->first();
                    if ($account) {
                        $subcontractorName = $account->get('name');
                    }
                }

                $price = self::normalizeMoney($row['quoted_price'] ?? 0);
                $forecast = self::normalizeMoney($row['forecast'] ?? 0);
                $budget = self::normalizeMoney($row['package_budget'] ?? 0);

                $profit = (int)$budget - (int)$forecast;

                $allTransactionsData[] = [
                    'subcontractor_name' => $subcontractorName,
                    'subcontractor_id'   => $accountId,
                    'price' => $price,
                    'forecast' => $forecast,
                    'budget' => $budget,
                    'profit' => $profit,
                ];
            }

            // Fetch subcontractor details
            $subcontractorId = $selectedTransactionData ? (int)$selectedTransactionData['subcontractor_id'] : null;
            $subcontractor = null;
            if ($subcontractorId) {
                try {
                    $subcontractorResponse = $accountSvc->fetch("account", ['id' => $subcontractorId]);
                    $subcontractor = $subcontractorResponse->getCollection('data')->first();
                } catch (\Exception $e) {
                    throw new MiddlewareException('subcontractorFetchError', 'Failed to fetch subcontractor: ' . $e->getMessage(), 0, $e);
                }
            }

            // Fetch author details
            $author = null;
            if ($authorId) {
                try {
                    $authorResponse = $accountSvc->fetch("user", ['id' => $authorId]);
                    $author = $authorResponse->getCollection('data')->first();
                } catch (\Exception $e) {
                    throw new MiddlewareException('authorFetchError', 'Failed to fetch author: ' . $e->getMessage(), 0, $e);
                }
            }

            // Fetch subcontractor contact details
            $contact = null;
            $contactUserId = (int)($recMeta['subcontractor_user_id'] ?? 0);
            if ($contactUserId > 0) {
                try {
                    $contactResponse = $accountSvc->fetch("user", ['id' => $contactUserId]);
                    $contact = $contactResponse->getCollection('data')->first();
                } catch (\Exception $e) {
                    throw new MiddlewareException('subcontractorContactFetchError', 'Failed to fetch subcontractor contact: ' . $e->getMessage(), 0, $e);
                }
            }

            // Fetch trade_category for the tender/package
            // Following the pattern from framework/src/api/config/routes/project/tender_recommendation/v1.php
            $tradeCategoryLabel = 'Multiple Trade Categories';
            try {
                // Fetch trade_category data from account service
                $tradeCategoryResponse = $accountSvc->fetch("trade_category", []);
                $packages = $tradeCategoryResponse->getCollection('data');

                // Build packages_groups mapping: trade_id => trade_category_label
                $packages_groups = [];
                if (is_array($packages) || $packages instanceof \Traversable) {
                    foreach ($packages as $package) {
                        $packageData = is_object($package) && method_exists($package, 'toArray')
                            ? $package->toArray()
                            : (array)$package;

                        if (isset($packageData['trades']) && is_array($packageData['trades'])) {
                            foreach ($packageData['trades'] as $trade) {
                                $packages_groups[$trade] = $packageData['label'] ?? null;
                            }
                        }
                    }
                }

                // Get tender data to find service/trade ID
                $tenderData = $tender->get($tenderId);
                // Map tender's service/trade ID to trade_category label
                if (isset($packages_groups[$tenderData['label']])) {
                    $tradeCategoryLabel = $packages_groups[$tenderData['label']];
                }
            } catch (\Exception $e) {
                throw new MiddlewareException('tradeCategoryFetchError', 'Failed to fetch trade_category: ' . $e->getMessage(), 0, $e);
            }

            // Format all transactions for display (adds defaults)
            $allTransactionsFormatted = self::formatAllTransactions($allTransactionsData, $subcontractorId ?? 0);

            return new Shape([
                'tender_recommendation' => [
                    'exec_summary' => $recMeta['exec_summary'] ?? 'N/A',
                    'final_comment' => $recMeta['final_comment'] ?? 'N/A',
                    'created_at' => $recMeta['created_at'] ?? 'N/A',
                ],
                'project' => [
                    'name' => $projectData['name'] ?? 'N/A',
                    'end' => $projectData['end'] ?? 'N/A',
                    'total_value' => $projectData['total_value'] ?? 0,
                    'project_manager' => implode(', ', $projectManagers),
                    'project_managers' => $projectManagers,
                ],
                'tender' => [
                    'label' => $tender->get($tenderId)['label'] ?? 'N/A',
                    'tender_return' => $tender->get($tenderId)['tender_return'] ?? 'N/A',
                    'start_date' => $tender->get($tenderId)['start_on_site'] ?? 'N/A',
                    'completion_date' => $tender->get($tenderId)['subcontract_work_finish'] ?? 'N/A',
                    'budget' => $tender->get($tenderId)['budget'] ?? (isset($allTransactionsFormatted[0]['budget']) ? $allTransactionsFormatted[0]['budget'] : 0),
                    'trade_category' => $tradeCategoryLabel,
                ],
                'subcontractor' => $subcontractor ? [
                    'name' => $subcontractor->get('name') ?? $subcontractor->get('display_name') ?? 'N/A',
                    'registration_number' => $subcontractor->get('reg_number') ?? 'N/A',
                    'business_address' => $subcontractor->get('address') ?? 'N/A',
                    'mobile' => $subcontractor->get('mobile') ?? 'N/A',
                    'landline' => $subcontractor->get('landline') ?? 'N/A',
                    'email' => $subcontractor->get('email') ?? 'N/A',
                    'trade_category' => $subcontractor->get('trade_category') ?? 'N/A',
                ] : [
                    'name' => 'N/A',
                    'registration_number' => 'N/A',
                    'business_address' => 'N/A',
                    'mobile' => 'N/A',
                    'landline' => 'N/A',
                    'email' => 'N/A',
                    'trade_category' => 'N/A',
                ],
                'author' => $author ? [
                    'display_name' => $author->get('display_name') ?? $author->get('name') ?? 'N/A',
                ] : [
                    'display_name' => 'N/A',
                ],
                'subcontractor_contact' => $contact ? [
                    'display_name' => $contact->get('display_name') ?? $contact->get('name') ?? 'N/A',
                    'job_title' => $contact->get('job_title') ?? 'N/A',
                    'phone' => $contact->get('contact_number') ?? 'N/A',
                    'email' => $contact->get('email') ?? 'N/A',
                ] : [
                    'display_name' => 'N/A',
                    'job_title' => 'N/A',
                    'phone' => 'N/A',
                    'email' => 'N/A',
                ],
                'all_transactions' => $allTransactionsFormatted,
                'tender_recommendation_attachments' => self::appendAttachments($tenderRecommendationId, $projectId),
            ]);

        } catch (\Exception $e) {
            throw new MiddlewareException('dynamicDataFetchError', 'Dynamic data fetch error: ' . $e->getMessage(), 0, $e);
        }
    }

    private static function fetchTenderRecommendationMeta($projectSvc, int $projectId, int $tenderRecommendationId): array
    {
        $recResponse = $projectSvc->fetch("project/$projectId/tender_recommendation/$tenderRecommendationId");
        $rec = $recResponse->getCollection('data')->first();
        if (!$rec) {
            throw new \Exception('Tender recommendation not found');
        }
        return $rec->toArray();
    }

    private static function fetchTender($projectSvc, int $tenderId)
    {
        $tenderResponse = $projectSvc->fetch("tender/$tenderId");
        return $tenderResponse->get('data');
    }

    private static function fetchProject($projectSvc, int $projectId): array
    {
        $projectResponse = $projectSvc->fetch('project', ['id' => $projectId]);
        $project = $projectResponse->getCollection('data')->first();
        return $project ? $project->toArray() : [];
    }

    private static function collectProjectManagers($projectSvc, $accountSvc, int $projectId): array
    {
        $projectManagers = [];
        try {
            $teamResponse = $projectSvc->fetch("project/$projectId/team", ['include_user' => 1]);
            $teamMembers = $teamResponse->getCollection('data');
            foreach ($teamMembers as $member) {
                $memberData = $member->toArray();
                $roleLabel = $memberData['team_member_role']['label'] ?? null;
                if ($roleLabel !== self::ROLE_LABEL_PROJECT_MANAGER) {
                    continue;
                }
                $embeddedUser = $memberData['user'] ?? null;
                if (is_array($embeddedUser)) {
                    $name = $embeddedUser['display_name'] ?? $embeddedUser['name'] ?? null;
                    if ($name) { $projectManagers[] = $name; continue; }
                }
                $userId = (int)($memberData['user_id'] ?? 0);
                if ($userId > 0) {
                    try {
                        $userResponse = $accountSvc->fetch('user', ['id' => $userId]);
                        $user = $userResponse->getCollection('data')->first();
                        if ($user) {
                            $name = $user->get('display_name') ?? $user->get('name');
                            if ($name) { $projectManagers[] = $name; }
                        }
                    } catch (\Exception $e) {
                        throw new MiddlewareException('projectManagerFetchError', 'Failed to fetch project manager user: ' . $e->getMessage(), 0, $e);
                    }
                }
            }
        } catch (\Exception $e) {
            throw new MiddlewareException('projectTeamFetchError', 'Failed to fetch project team: ' . $e->getMessage(), 0, $e);
        }
        return $projectManagers;
    }

    private static function fetchSelectedTransactionData($projectSvc, int $transactionId): ?array
    {
        $selectedTransactionResponse = $projectSvc->fetch('transaction', ['id' => $transactionId]);
        $selectedTransaction = $selectedTransactionResponse->getCollection('data')->first();
        return $selectedTransaction ? $selectedTransaction->toArray() : null;
    }

    private static function fetchAllTransactionsForTender($projectSvc, $accountSvc, int $tenderId): array
    {
        $allTransactionsResponse = $projectSvc->fetch('transaction', ['tender_id' => $tenderId]);
        $allTransactions = $allTransactionsResponse->getCollection('data');
        $allTransactionsData = [];
        foreach ($allTransactions as $transaction) {
            $transactionData = $transaction->toArray();
            $subcontractorId = (int)($transactionData['subcontractor_id'] ?? 0);
            if ($subcontractorId && $subcontractorId !== -1) {
                try {
                    $subcontractorResponse = $accountSvc->fetch('account', ['id' => $subcontractorId]);
                    $subcontractor = $subcontractorResponse->getCollection('data')->first();
                    if ($subcontractor) {
                        $transactionData['subcontractor_name'] = $subcontractor->get('name') ?? $subcontractor->get('display_name') ?? 'N/A';
                        $transactionData['subcontractor_ref'] = $subcontractor->get('reg_number') ?? 'N/A';
                    }
                } catch (\Exception $e) {
                    throw new MiddlewareException('subcontractorTransactionFetchError', 'Failed to fetch subcontractor for transaction: ' . $e->getMessage(), 0, $e);
                }
            } else {
                $meta = json_decode($transactionData['meta'] ?? '{}', true);
                $transactionData['subcontractor_name'] = $meta['subcontractor_name'] ?? 'N/A';
                $transactionData['subcontractor_ref'] = 'N/A';
            }
            $allTransactionsData[] = $transactionData;
        }
        return $allTransactionsData;
    }

    private static function fetchSubcontractorForSelected($accountSvc, ?array $selectedTransactionData)
    {
        $subcontractorId = $selectedTransactionData ? (int)($selectedTransactionData['subcontractor_id'] ?? 0) : null;
        $subcontractor = null;
        if ($subcontractorId) {
            try {
                $subcontractorResponse = $accountSvc->fetch('account', ['id' => $subcontractorId]);
                $subcontractor = $subcontractorResponse->getCollection('data')->first();
            } catch (\Exception $e) {
                throw new MiddlewareException('subcontractorFetchError', 'Failed to fetch subcontractor: ' . $e->getMessage(), 0, $e);
            }
        }
        return $subcontractor;
    }

    private static function fetchAuthor($accountSvc, int $authorId)
    {
        $author = null;
        if ($authorId) {
            try {
                $authorResponse = $accountSvc->fetch('user', ['id' => $authorId]);
                $author = $authorResponse->getCollection('data')->first();
            } catch (\Exception $e) {
                throw new MiddlewareException('authorFetchError', 'Failed to fetch author: ' . $e->getMessage(), 0, $e);
            }
        }
        return $author;
    }


    /**
     * Format all transactions for comparison
     */
    private static function formatAllTransactions($allTransactions, int $recommendedSubcontractorId): array
    {
        $formatted = [];

        foreach ($allTransactions as $transaction) {
            $formatted[] = [
                'subcontractor_name' => $transaction['subcontractor_name'] ?? 'N/A',
                'subcontractor_ref'  => $transaction['subcontractor_ref'] ?? 'N/A',
                'price'              => (int)self::normalizeMoney($transaction['price'] ?? 0),
                'forecast'           => (int)self::normalizeMoney($transaction['forecast'] ?? 0),
                'budget'             => (int)self::normalizeMoney($transaction['budget'] ?? 0),
                'profit'             => (int)($transaction['profit'] ?? ((int)self::normalizeMoney($transaction['budget'] ?? 0) - (int)self::normalizeMoney($transaction['forecast'] ?? 0))),
                'is_recommended'     => $recommendedSubcontractorId > 0 && (int)($transaction['subcontractor_id'] ?? 0) === $recommendedSubcontractorId,
            ];
        }

        return $formatted;
    }

    /**
     * Normalize money coming from APIs that may provide either integer pence
     * or string pounds with decimals (e.g., "99.00"). Returns integer pence.
     */
    private static function normalizeMoney($value): int
    {
        if ($value === null || $value === '') {
            return 0;
        }
        if (is_string($value)) {
            // If it contains a decimal point, treat as pounds
            if (strpos($value, '.') !== false) {
                return (int)round(((float)$value) * 100);
            }
            // If numeric string without decimal, cast to int (assume already pence)
            if (is_numeric($value)) {
                return (int)$value;
            }
            return 0;
        }
        if (is_float($value)) {
            // Floats represent pounds
            return (int)round($value * 100);
        }
        // Integers assumed to already be pence
        return (int)$value;
    }

    private static function appendAttachments(int $tenderRecommendationId, int $projectId): Shape
    {
        try {

            $tenderRecommendationData  = Manager::getService('project')
                        ->fetch("project/{$projectId}/tender_recommendation/{$tenderRecommendationId}")
                        ->getShape('data')
                        ->toArray();

            $tenderRecommendationArray = reset($tenderRecommendationData);

            $documentCategoryMapping = Manager::getService('document')
            ->fetch("category",
                    [
                        'entity_id'  => $tenderRecommendationId,
                        'entity_type'=> self::ENTITY_TYPE,
                        'parent_id'  => $tenderRecommendationArray['tender_id']
                    ])
            ->getShape('data')
            ->get();

            $documentCategoryMapping = reset($documentCategoryMapping);
            if (empty($documentCategoryMapping) || empty($documentCategoryMapping['documents'])) {
                return new Shape([
                    "tender_recommendation_attachment" => [
                        'document_count' => 0,
                        'documents'      => [],
                    ]
                ]);
            }

            $documents = array_column($documentCategoryMapping['documents'], 'name');

            return new Shape([
                "tender_recommendation_attachment" => [
                    'base_url'                  => rtrim(Config::get('clink.site_url') ?: 'https://app.c-link.com', '/'),
                    'document_count'            => count($documents),
                    'documents'                 => $documents,
                    'id'                        => $tenderRecommendationId,
                    'pid'                       => $projectId // needed to use on frontend
                ]
            ]);
        }
        catch (\Exception $e) {
            throw new MiddlewareException('dynamicDataFetchError', 'Dynamic data fetch error: ' . $e->getMessage(), 0, $e);
        }
    }
}
