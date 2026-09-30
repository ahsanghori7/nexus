<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Email;

use App\Application\Actions\Action;
use App\Application\Actions\Email\EmailAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class EmailActionTest extends TestCase
{
    public function testUnsubscribeAddsUserToBlacklist(): void
    {
        $repository = new EmailRepositoryStub();

        $action = $this->createAction($repository);
        $response = $action->unsubscribe(
            $this->createRequest('GET', '/v1/email/unsubscribe/'),
            new Response(),
            [
                'token' => base64_encode('alice@example.com'),
                'email_id' => '14',
            ]
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(1, $payload['data']['user']['id']);
        self::assertSame(
            [
                [
                    'user_id' => 1,
                    'email_id' => '14',
                ],
            ],
            $repository->blacklistSaves
        );
    }

    public function testUnsubscribeWithoutTokenReturnsBadRequest(): void
    {
        $action = $this->createAction(new EmailRepositoryStub());
        $response = $action->unsubscribe(
            $this->createRequest('GET', '/v1/email/unsubscribe/'),
            new Response(),
            ['token' => '']
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testUnsubscribeReturnsNotFoundWhenUserMissing(): void
    {
        $repository = new EmailRepositoryStub();
        $repository->userLoaded = false;

        $action = $this->createAction($repository);
        $response = $action->unsubscribe(
            $this->createRequest('GET', '/v1/email/unsubscribe/'),
            new Response(),
            [
                'token' => base64_encode('nobody@example.com'),
                'email_id' => '3',
            ]
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testUnsubscribeReturnsNotFoundWhenBlacklistSaveFails(): void
    {
        $repository = new EmailRepositoryStub();
        $repository->blacklistSaveThrows = true;

        $action = $this->createAction($repository);
        $response = $action->unsubscribe(
            $this->createRequest('GET', '/v1/email/unsubscribe/'),
            new Response(),
            [
                'token' => base64_encode('alice@example.com'),
                'email_id' => '8',
            ]
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testListEmailLogsPassesQueryParamsToRepository(): void
    {
        $repository = new EmailRepositoryStub();
        $repository->emailLogRecords = [['id' => 9]];

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/email/logs')
            ->withQueryParams(['type' => 'marketing', 'limit' => '5']);
        $response = $action->listEmailLogs($request, new Response(), []);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->emailLogRecords, $payload['data']);
        self::assertSame([
            ['type' => 'marketing', 'limit' => '5'],
        ], $repository->emailLogAllCalls);
    }

    public function testLogEventPersistsDataAndReturnsGeneratedId(): void
    {
        $repository = new EmailRepositoryStub();
        $repository->emailLogSavedId = 55;

        $action = $this->createAction($repository);
        $this->setActionData($action, ['event' => 'delivered']);

        $response = $action->logEvent(
            $this->createRequest('POST', '/v1/email/log'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['id' => 55], $payload['data']);
        self::assertSame([
            ['event' => 'delivered'],
        ], $repository->emailLogSaveCalls);
    }

    public function testListEmailLogsByEntityAccountReturnsFlatLogsWithoutIncludeStatus(): void
    {
        $repository = new EmailRepositoryStub();
        $repository->emailLogRecords = [
            [
                'id'        => 1,
                'email_id'  => 4,
                'user_id'   => 1,
                'sent_date' => '2026-02-17 07:08:46',
                'meta'      => '{"enquiry":75638,"entity_type":"Enquiry Sent","account_id":17466,"email":"test@example.com"}',
            ]
        ];

        $action  = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/email/logs-by-entity-account')
            ->withQueryParams([
                'enquiry'     => '75638',
                'entity_type' => 'Enquiry Sent',
                'account_id'  => '17466',
            ]);

        $response = $action->listEmailLogsByEntityAccount($request, new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->emailLogRecords, $payload['data']);
    }

    public function testListEmailLogsByEntityAccountReturnsGroupedDataWithIncludeStatus(): void
    {
        $repository = new EmailRepositoryStub();
        $repository->emailLogRecords = [
            [
                'id'        => 1,
                'email_id'  => 4,
                'user_id'   => 1,
                'sent_date' => '2026-02-17 07:08:46',
                'meta'      => '{"enquiry":75638,"entity_type":"Enquiry Sent","account_id":17466,"email":"test@example.com"}',
            ]
        ];

        $action  = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/email/logs-by-entity-account')
            ->withQueryParams([
                'enquiry'        => '75638',
                'entity_type'    => 'Enquiry Sent',
                'account_id'     => '17466',
                'include_status' => 'true',
            ]);

        $response = $action->listEmailLogsByEntityAccount($request, new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        $key = '75638_17466';
        self::assertArrayHasKey($key, $payload['data']);
        self::assertSame('Sent', $payload['data'][$key]['final_status']);
        self::assertSame(1, $payload['data'][$key]['sent_count']);
        self::assertSame(1, $payload['data'][$key]['total_users']);
        self::assertSame('test@example.com', $payload['data'][$key]['email_sent_to'][0]['email']);
        self::assertSame('Sent', $payload['data'][$key]['email_sent_to'][0]['status']);
    }

    public function testListEmailLogsByEntityAccountFinalStatusIsFailedWhenNoSentEmails(): void
    {
        $repository = new EmailRepositoryStub();
        $repository->emailLogRecords = [
            [
                'id'        => 2,
                'email_id'  => 2,
                'user_id'   => 1,
                'sent_date' => '2026-02-17 07:08:46',
                'meta'      => '{"enquiry":75638,"entity_type":"Enquiry Sent","account_id":17466,"email":"test@example.com"}',
            ]
        ];

        $action  = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/email/logs-by-entity-account')
            ->withQueryParams([
                'enquiry'        => '75638',
                'entity_type'    => 'Enquiry Sent',
                'account_id'     => '17466',
                'include_status' => 'true',
            ]);

        $response = $action->listEmailLogsByEntityAccount($request, new Response(), []);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        $key = '75638_17466';
        self::assertSame('Failed', $payload['data'][$key]['final_status']);
        self::assertSame(0, $payload['data'][$key]['sent_count']);
    }

    public function testListEmailLogsByEntityAccountFinalStatusIsPartiallySent(): void
    {
        $repository = new EmailRepositoryStub();
        $repository->emailLogRecords = [
            [
                'id'        => 1,
                'email_id'  => 4,
                'user_id'   => 1,
                'sent_date' => '2026-02-17 07:08:46',
                'meta'      => '{"enquiry":75638,"entity_type":"Enquiry Sent","account_id":17466,"email":"sent@example.com"}',
            ],
            [
                'id'        => 2,
                'email_id'  => 2,
                'user_id'   => 2,
                'sent_date' => '2026-02-17 07:09:00',
                'meta'      => '{"enquiry":75638,"entity_type":"Enquiry Sent","account_id":17466,"email":"bounce@example.com"}',
            ],
        ];

        $action  = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/email/logs-by-entity-account')
            ->withQueryParams([
                'enquiry'        => '75638',
                'entity_type'    => 'Enquiry Sent',
                'account_id'     => '17466',
                'include_status' => 'true',
            ]);

        $response = $action->listEmailLogsByEntityAccount($request, new Response(), []);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        $key = '75638_17466';
        self::assertSame('Partially Sent', $payload['data'][$key]['final_status']);
        self::assertSame(1, $payload['data'][$key]['sent_count']);
        self::assertSame(2, $payload['data'][$key]['total_users']);
    }

    public function testListEmailLogsByEntityAccountBulkEnquiryIdsGroupsCorrectly(): void
    {
        $repository = new EmailRepositoryStub();
        $repository->emailLogRecords = [
            [
                'id'        => 1,
                'email_id'  => 4,
                'user_id'   => 1,
                'sent_date' => '2026-02-17 07:08:46',
                'meta'      => '{"enquiry":75638,"entity_type":"Enquiry Sent","account_id":17466,"email":"a@example.com"}',
            ],
            [
                'id'        => 2,
                'email_id'  => 4,
                'user_id'   => 1,
                'sent_date' => '2026-02-17 07:09:00',
                'meta'      => '{"enquiry":75639,"entity_type":"Enquiry Sent","account_id":17466,"email":"b@example.com"}',
            ],
        ];

        $action  = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/email/logs-by-entity-account')
            ->withQueryParams([
                'enquiry_ids'    => '75638,75639',
                'entity_type'    => 'Enquiry Sent',
                'account_ids'    => '17466',
                'include_status' => 'true',
            ]);

        $response = $action->listEmailLogsByEntityAccount($request, new Response(), []);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertArrayHasKey('75638_17466', $payload['data']);
        self::assertArrayHasKey('75639_17466', $payload['data']);
        self::assertSame('Sent', $payload['data']['75638_17466']['final_status']);
        self::assertSame('Sent', $payload['data']['75639_17466']['final_status']);
    }

    public function testListEmailLogsByEntityAccountSkipsLogsWithMissingEnquiryOrAccount(): void
    {
        $repository = new EmailRepositoryStub();
        $repository->emailLogRecords = [
            [
                'id'        => 1,
                'email_id'  => 4,
                'user_id'   => 1,
                'sent_date' => '2026-02-17 07:08:46',
                'meta'      => '{"entity_type":"Enquiry Sent"}',
            ]
        ];

        $action  = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/email/logs-by-entity-account')
            ->withQueryParams([
                'enquiry'        => '75638',
                'entity_type'    => 'Enquiry Sent',
                'account_id'     => '17466',
                'include_status' => 'true',
            ]);

        $response = $action->listEmailLogsByEntityAccount($request, new Response(), []);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertEmpty($payload['data']);
    }

    public function testListEmailLogsByEntityAccountEmailIsReadFromMeta(): void
    {
        $repository = new EmailRepositoryStub();
        $repository->emailLogRecords = [
            [
                'id'        => 1,
                'email_id'  => 4,
                'user_id'   => 5,
                'sent_date' => '2026-02-17 08:00:00',
                'meta'      => '{"enquiry":75640,"entity_type":"Enquiry Sent","account_id":17470,"email":"meta@example.com"}',
            ]
        ];

        $action  = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/email/logs-by-entity-account')
            ->withQueryParams([
                'enquiry'        => '75640',
                'entity_type'    => 'Enquiry Sent',
                'account_id'     => '17470',
                'include_status' => 'true',
            ]);

        $response = $action->listEmailLogsByEntityAccount($request, new Response(), []);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        $key = '75640_17470';
        self::assertArrayHasKey($key, $payload['data']);
        self::assertSame('meta@example.com', $payload['data'][$key]['email_sent_to'][0]['email']);
        self::assertSame(5, $payload['data'][$key]['email_sent_to'][0]['user_id']);
    }

    private function createAction(EmailRepositoryStub $repository): EmailActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new EmailActionUnderTest($logger, $repository);
    }

    private function setActionData(EmailAction $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class EmailActionUnderTest extends EmailAction
{
    public function __construct(LoggerInterface $logger, private EmailRepositoryStub $repositoryStub)
    {
        parent::__construct($logger);
        $this->repository = $repositoryStub;
    }
}

final class EmailRepositoryStub
{
    public array $blacklistSaves = [];
    public bool $userLoaded = true;
    public bool $blacklistSaveThrows = false;
    public array $emailLogRecords = [];
    public array $emailLogAllCalls = [];
    public array $emailLogSaveCalls = [];
    public int $emailLogSavedId = 42;

    public function getModel(string $name = '')
    {
        return match ($name) {
            'user' => new EmailUserModelStub($this),
            'emailBlacklist' => new EmailBlacklistModelStub($this),
            'emailLog' => new EmailLogModelStub($this),
            default => new class {
                public function __call(string $name, array $arguments)
                {
                    return [];
                }
            },
        };
    }
}

final class EmailLogModelStub
{
    public function __construct(private EmailRepositoryStub $repository)
    {
    }

    public function all(array $params = []): array
    {
        $this->repository->emailLogAllCalls[] = $params;
        return $this->repository->emailLogRecords;
    }

    public function save(array $data): EmailLogEntryStub
    {
        $this->repository->emailLogSaveCalls[] = $data;
        return new EmailLogEntryStub($this->repository->emailLogSavedId);
    }

    public function getDB(): EmailLogDbStub
    {
        EmailLogDbStub::$records = $this->repository->emailLogRecords;
        return new EmailLogDbStub();
    }
}

final class EmailLogDbStub
{
    public static array $records = [];

    public static function getAll(string $sql): array
    {
        return self::$records;
    }
}

final class EmailLogEntryStub
{
    public function __construct(private int $id)
    {
    }

    public function getId(): int
    {
        return $this->id;
    }
}

final class EmailUserModelStub
{
    public function __construct(private EmailRepositoryStub $repository)
    {
    }

    public function load(string $value, string $field = 'email'): EmailUserStub
    {
        return new EmailUserStub($this->repository->userLoaded ? 1 : 0, $this->repository->userLoaded);
    }
}

final class EmailBlacklistModelStub
{
    public function __construct(private EmailRepositoryStub $repository)
    {
    }

    public function save(array $data): void
    {
        if ($this->repository->blacklistSaveThrows) {
            throw new \Exception('failed');
        }
        $this->repository->blacklistSaves[] = $data;
    }

    public function all(array $filters = []): array
    {
        return $this->repository->blacklistSaves;
    }
}

final class EmailUserStub implements \JsonSerializable
{
    public function __construct(private int $id, private bool $loaded)
    {
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function jsonSerialize(): array
    {
        return ['id' => $this->id];
    }
}
