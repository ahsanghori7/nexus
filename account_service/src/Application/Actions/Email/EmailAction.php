<?php

declare(strict_types=1);

namespace App\Application\Actions\Email;

use App\Domain\Email\EmailRepository;
use App\Domain\Email\EmailStatusEnum;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;

/**
 * Class EmailAction
 * @package App\Application\Actions\Email
 */
class EmailAction extends Action
{

    /**
     * Default content type for account action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * AccountAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new EmailRepository();
    }


    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function unsubscribe(Request $request, Response $response, array $args): Response
    {
        $hash     = base64_decode($args['token'] ?? '');
        $email_id = $args['email_id'] ?? null;

        if (!$hash) {
            return $this->badRequest($response);
        }

        $user = $this->repository->getModel('user')->load($hash, 'email');
        if ($user->isLoaded()) {

            try {
                /*
                 * Add user to blacklist
                */
                $this->repository->getModel('emailBlacklist')->save([
                    'user_id'  => $user->getId(),
                    'email_id' => $email_id
                ]);

                return $this->respond(
                    $response,
                    new ActionPayload(200, [
                        'user'  => $user
                    ])
                );
            } catch (\Exception $e) {
                return $this->notFound($response);
            }
        }

        return $this->notFound($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \ReflectionException
     */
    public function listBlacklist(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $blacklist = $this->repository->getModel('emailBlacklist')->all($params);
        return $this->respond(
            $response,
            new ActionPayload(200, $blacklist)
        );
    }

    public function listTypes(Request $request, Response $response, array $args): Response
    {
        $data = $this->repository->getModel('email')->findAll();

        return $this->respond(
            $response,
            new ActionPayload(200, $data)
        );
    }

    public function logEvent(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();
        if ($data) {
            $id = $this->repository->getModel('emailLog')->save($data)->getId();
        } else {
            return $this->badRequest($response);
        }

        return $this->respond(
            $response,
            new ActionPayload(200, array('id' => $id))
        );
    }

    public function listEmailLogs(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $emails = $this->repository->getModel('emailLog')->all($params);

        return $this->respond(
            $response,
            new ActionPayload(200, $emails)
        );
    }

    public function listEmailLogsByEntity(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();

        $sql = sprintf("SELECT * FROM email_log el WHERE user_id IN (%s) AND JSON_UNQUOTE(JSON_EXTRACT(el.meta, '$.entity_type')) = '%s' AND JSON_UNQUOTE(JSON_EXTRACT(el.meta, '$.entity_id')) = '%s';", $params['user_ids'], $params['entity_type'], $params['entity_id']);
        $res = $this->repository->getModel('emailLog')->getDB()::getAll($sql);

        return $this->respond(
            $response,
            new ActionPayload(200, $res)
        );
    }

    public function listEmailLogsByEntityAccount(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();

        $conditions = [
            sprintf("JSON_UNQUOTE(JSON_EXTRACT(el.meta, '$.entity_type')) = '%s'", $params['entity_type']),
        ];

        if (!empty($params['enquiry_ids'])) {
            $ids = implode(',', array_map('intval', explode(',', $params['enquiry_ids'])));
            $conditions[] = sprintf("JSON_UNQUOTE(JSON_EXTRACT(el.meta, '$.enquiry')) IN (%s)", $ids);
        } elseif (!empty($params['enquiry'])) {
            $conditions[] = sprintf("JSON_UNQUOTE(JSON_EXTRACT(el.meta, '$.enquiry')) = '%s'", $params['enquiry']);
        }

        if (!empty($params['account_ids'])) {
            $ids = implode(',', array_map('intval', explode(',', $params['account_ids'])));
            $conditions[] = sprintf("JSON_UNQUOTE(JSON_EXTRACT(el.meta, '$.account_id')) IN (%s)", $ids);
        } elseif (!empty($params['account_id'])) {
            $conditions[] = sprintf("JSON_UNQUOTE(JSON_EXTRACT(el.meta, '$.account_id')) = '%s'", $params['account_id']);
        }

        if (!empty($params['user_ids'])) {
            $conditions[] = sprintf("user_id IN (%s)", $params['user_ids']);
        }

        if (!empty($params['email_id'])) {
            $conditions[] = sprintf("el.email_id = %d", $params['email_id']);
        }

        $sql = sprintf(
            "SELECT * FROM email_log el WHERE %s",
            implode(' AND ', $conditions)
        );

        $res = $this->repository->getModel('emailLog')->getDB()::getAll($sql);

        if (empty($params['include_status']) || !filter_var($params['include_status'], FILTER_VALIDATE_BOOLEAN)) {
            return $this->respond(
                $response,
                new ActionPayload(200, $res)
            );
        }

        $grouped = [];

        foreach ($res as $log) {
            $meta      = json_decode($log['meta'] ?? '{}', true);
            $enquiryId = $meta['enquiry'] ?? null;
            $accountId = $meta['account_id'] ?? null;

            if (!$enquiryId || !$accountId) continue;

            $key = "{$enquiryId}_{$accountId}";

            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'enquiry_id'    => $enquiryId,
                    'account_id'    => $accountId,
                    'email_logs'    => [],
                    'email_sent_to' => [],
                    'sent_count'    => 0,
                    'final_status'  => 'Failed',
                ];
            }

            $emailId     = (int) ($log['email_id'] ?? 0);
            $statusLabel = EmailStatusEnum::getLabel($emailId);

            if ($emailId === EmailStatusEnum::SENT->value) {
                $grouped[$key]['sent_count']++;
            }

            $grouped[$key]['email_logs'][]    = $log;
            $grouped[$key]['email_sent_to'][] = [
                'user_id'   => $log['user_id'],
                'email_id'  => $emailId,
                'email'     => $meta['email'] ?? null,
                'status'    => $statusLabel,
                'sent_date' => $log['sent_date'] ?? null,
                'meta'      => $meta,
            ];
        }

        foreach ($grouped as &$group) {
            $totalUsers = isset($group['email_sent_to']) ? count($group['email_sent_to']) : 0;
            $sentCount  = (int) ($group['sent_count'] ?? 0);

            if ($sentCount === 0) {
                $group['final_status'] = 'Failed';
            } elseif ($sentCount < $totalUsers) {
                $group['final_status'] = 'Partially Sent';
            } else {
                $group['final_status'] = 'Sent';
            }

            $group['total_users'] = $totalUsers;
        }
        unset($group);

        return $this->respond(
            $response,
            new ActionPayload(200, $grouped)
        );
    }
}
