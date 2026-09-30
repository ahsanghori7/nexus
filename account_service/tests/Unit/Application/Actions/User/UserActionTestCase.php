<?php
declare(strict_types=1);

namespace Tests\Application\Actions\User;

use App\Application\Actions\User\UserAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

abstract class UserActionTestCase extends TestCase
{
    protected function createActionWithRepository(object $repository): UserAction
    {
        $logger = $this->createMock(LoggerInterface::class);
        $action = new UserAction($logger);
        $this->injectRepository($action, $repository);
        return $action;
    }

    protected function injectRepository(UserAction $action, object $repository): void
    {
        $ref = new \ReflectionClass($action);
        $prop = $ref->getParentClass()->getProperty('repository');
        $prop->setAccessible(true);
        $prop->setValue($action, $repository);
    }

    protected function setActionData(UserAction $action, array $data): void
    {
        $ref = new \ReflectionClass($action);
        $prop = $ref->getParentClass()->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }

    protected function decodeResponse(Response $response): array
    {
        return json_decode((string) $response->getBody(), true);
    }
}
