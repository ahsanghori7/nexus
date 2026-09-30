<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Distance;

use App\Application\Actions\Distance\DistanceAction;
use App\Application\Actions\Action;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class DistanceActionTest extends TestCase
{
    public function testAddDistancesPersistsEachEntry(): void
    {
        $repository = new DistanceRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, [
            [
                'origin' => 'A',
                'destination' => 'B',
                'distance' => ['km' => 10],
            ],
            [
                'origin' => 'C',
                'destination' => 'D',
                'distance' => ['km' => 25],
            ],
        ]);

        $response = $action->addDistances(
            $this->createRequest('POST', '/v1/distance'),
            new Response(),
            []
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(2, count($repository->distanceSaveCalls));
        self::assertSame(
            [
                [
                    'origin' => 'A',
                    'destination' => 'B',
                    'distance' => json_encode(['km' => 10], JSON_THROW_ON_ERROR),
                ],
                [
                    'origin' => 'C',
                    'destination' => 'D',
                    'distance' => json_encode(['km' => 25], JSON_THROW_ON_ERROR),
                ],
            ],
            $repository->distanceSaveCalls
        );
    }

    public function testAddDistancesIgnoresMissingPayload(): void
    {
        $repository = new DistanceRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, []);

        $response = $action->addDistances(
            $this->createRequest('POST', '/v1/distance'),
            new Response(),
            []
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([], $repository->distanceSaveCalls);
    }

    private function createAction(DistanceRepositoryStub $repository): DistanceActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new DistanceActionUnderTest($logger, $repository);
    }

    private function setActionData(Action $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class DistanceActionUnderTest extends DistanceAction
{
    public function __construct(LoggerInterface $logger, private DistanceRepositoryStub $repositoryStub)
    {
        parent::__construct($logger);
        $this->repository = $repositoryStub;
    }
}

final class DistanceRepositoryStub
{
    public array $distanceSaveCalls = [];

    public function getModel(string $name = '')
    {
        return new class($this) {
            public function __construct(private DistanceRepositoryStub $repository)
            {
            }

            public function save(array $data): void
            {
                $this->repository->distanceSaveCalls[] = $data;
            }
        };
    }
}
