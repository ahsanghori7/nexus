<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use App\Application\Actions\User\UserAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

class ListUserActionTest extends TestCase
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

    public function testListUsersByIdReturnsExpectedPayload(): void
    {
        $users = [
            1 => ['id' => 1, 'email' => 'bill.gates@example.com', 'firstname' => 'Bill', 'lastname' => 'Gates'],
            2 => ['id' => 2, 'email' => 'steve.jobs@example.com', 'firstname' => 'Steve', 'lastname' => 'Jobs'],
        ];

        $action = $this->createAction($users);

        $request = $this->createRequest('GET', '/v1/user/[1,2]');
        $response = $action->listUsersById($request, new Response(), ['ids' => '[1,2]']);

        $this->assertSame(200, $response->getStatusCode());

        $payload = json_decode((string) $response->getBody(), true);

        $this->assertSame(
            [
                'data' => array_values($users),
            ],
            $payload
        );
    }

    public function testListUsersByIdSkipsUnknownIdentifiers(): void
    {
        $users = [
            1 => ['id' => 1, 'email' => 'bill.gates@example.com', 'firstname' => 'Bill', 'lastname' => 'Gates'],
        ];

        $action = $this->createAction($users);

        $request = $this->createRequest('GET', '/v1/user/[1,99]');
        $response = $action->listUsersById($request, new Response(), ['ids' => '[1,99]']);

        $payload = json_decode((string) $response->getBody(), true);

        $this->assertSame(['data' => [$users[1]]], $payload);
    }
}
