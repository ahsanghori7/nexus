<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use App\Application\Actions\User\UserAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

class ViewUserActionTest extends TestCase
{
    private function createAction(array $users): UserAction
    {
        $logger = $this->createMock(LoggerInterface::class);

        $repository = new class($users) {
            public function __construct(private array $users)
            {
            }

            public function getUsersByArray(array $ids): array
            {
                $selected = [];
                foreach ($ids as $id) {
                    $id = (int) $id;
                    if (isset($this->users[$id])) {
                        $selected[] = $this->users[$id];
                    }
                }

                return $selected;
            }
        };

        return new class($logger, $repository) extends UserAction {
            public function __construct(LoggerInterface $logger, private $testRepository)
            {
                parent::__construct($logger);
                $this->repository = $this->testRepository;
            }
        };
    }

    public function testListUsersByIdReturnsSingleUser(): void
    {
        $users = [
            1 => ['id' => 1, 'email' => 'bill.gates@example.com', 'firstname' => 'Bill', 'lastname' => 'Gates'],
        ];

        $action = $this->createAction($users);
        $request = $this->createRequest('GET', '/v1/user/[1]');

        $response = $action->listUsersById($request, new Response(), ['ids' => '[1]']);

        $this->assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertSame(['data' => [$users[1]]], $payload);
    }

    public function testListUsersByIdReturnsEmptyArrayWhenUserMissing(): void
    {
        $action = $this->createAction([]);
        $request = $this->createRequest('GET', '/v1/user/[99]');

        $response = $action->listUsersById($request, new Response(), ['ids' => '[99]']);

        $this->assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertSame(['data' => []], $payload);
    }

    public function testListUsersByFieldRequiresQueryParameters(): void
    {
        $action = $this->createAction([]);
        $request = $this->createRequest('GET', '/v1/user/search');

        $response = $action->listUsersByField($request, new Response(), []);

        $this->assertSame(400, $response->getStatusCode());

        $payload = json_decode((string) $response->getBody(), true);
        $this->assertSame(
            [
                'error' => 'Bad Request',
                'message' => ['missing_field' => ['field', 'value']],
            ],
            $payload
        );
    }
}
