<?php
declare(strict_types=1);

namespace Tests\Application\Actions;

use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\Application\Actions\Support\InstrumentedAction;
use Tests\Application\Actions\Support\ModelDouble;
use Tests\Application\Actions\Support\RepositoryDouble;
use Tests\TestCase;

final class ActionRepositoryInteractionTest extends TestCase
{
    public function testListRespondsWithRepositoryDataAndPager(): void
    {
        $records = [
            ['id' => 1, 'name' => 'Alpha'],
            ['id' => 2, 'name' => 'Beta'],
        ];
        $model = new ModelDouble($records, 5);
        $repository = new RepositoryDouble($model, $records);

        $action = $this->makeAction($repository);
        $request = $this->createRequest('GET', '/items')->withQueryParams([
            'limit' => '2',
            'offset' => '1',
            'status' => 'active',
        ]);

        $response = $action->callList($request, new Response());

        self::assertSame(200, $response->getStatusCode());
        $decoded = json_decode((string) $response->getBody(), true);
        self::assertSame($records, $decoded['data']);
        self::assertSame(5, $decoded['links']['total']);
        self::assertSame('/items?limit=2&offset=3&status=active', $decoded['links']['next']);
        self::assertSame('', $decoded['links']['prev']);
        self::assertSame(['status' => 'active'], $repository->findAllCalls[0]['filters']);
        self::assertSame(2, $repository->findAllCalls[0]['limit']);
        self::assertSame(1, $repository->findAllCalls[0]['offset']);
    }

    public function testAllDelegatesToModelAll(): void
    {
        $records = [
            ['id' => 3, 'name' => 'Gamma'],
        ];
        $model = new ModelDouble($records, 1);
        $repository = new RepositoryDouble($model, $records);

        $action = $this->makeAction($repository);
        $request = $this->createRequest('GET', '/items')->withQueryParams(['status' => 'inactive']);

        $response = $action->callAll($request, new Response());

        self::assertSame(200, $response->getStatusCode());
        $decoded = json_decode((string) $response->getBody(), true);
        self::assertSame($records, $decoded['data']);
        self::assertSame([['status' => 'inactive']], $model->allCalls);
    }

    public function testGetByIdLoadsModelRecord(): void
    {
        $records = [
            5 => ['name' => 'Stored'],
        ];
        $model = new ModelDouble($records);
        $repository = new RepositoryDouble($model, $records);

        $action = $this->makeAction($repository);
        $request = $this->createRequest('GET', '/items/5');

        $response = $action->callGetById($request, new Response(), ['id' => 5]);

        self::assertSame(200, $response->getStatusCode());
        $decoded = json_decode((string) $response->getBody(), true);
        self::assertSame(5, $decoded['data']['id']);
        self::assertSame('Stored', $decoded['data']['name']);
    }

    public function testGetModelByIdReturnsPayloadWhenLoaded(): void
    {
        $records = [
            9 => ['name' => 'Resource'],
        ];
        $model = new ModelDouble($records);
        $repository = new RepositoryDouble($model, $records);

        $action = $this->makeAction($repository);
        $request = $this->createRequest('GET', '/resource/item/9');

        $response = $action->callGetModelById($request, new Response(), ['id' => 9]);

        self::assertSame(200, $response->getStatusCode());
        $decoded = json_decode((string) $response->getBody(), true);
        self::assertSame('Resource', $decoded['data']['name']);
        self::assertSame(9, $decoded['data']['id']);
    }

    public function testGetModelByIdReturnsNotFoundWhenModelMissing(): void
    {
        $model = new ModelDouble([]);
        $repository = new RepositoryDouble($model, []);

        $action = $this->makeAction($repository);
        $request = $this->createRequest('GET', '/resource/item/7');

        $response = $action->callGetModelById($request, new Response(), ['id' => 7]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetModelByIdReturnsBadRequestWhenRouteMismatch(): void
    {
        $records = [
            7 => ['name' => 'Mismatch'],
        ];
        $model = new ModelDouble($records);
        $repository = new RepositoryDouble($model, $records);

        $action = $this->makeAction($repository);
        $request = $this->createRequest('GET', '/resource/item/7');

        $response = $action->callGetModelById($request, new Response(), ['id' => 8]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testUpdateByIdPersistsDataWhenModelLoaded(): void
    {
        $records = [
            4 => ['name' => 'Original'],
        ];
        $model = new ModelDouble($records);
        $repository = new RepositoryDouble($model, $records);

        $action = $this->makeAction($repository);
        $action->withData(['name' => 'Updated']);

        $response = $action->callUpdateById(
            $this->createRequest('PUT', '/items/4'),
            new Response(),
            ['id' => 4]
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([['name' => 'Updated']], $model->savedPayloads);
    }

    public function testUpdateByIdReturnsNotFoundWhenModelMissing(): void
    {
        $model = new ModelDouble([]);
        $repository = new RepositoryDouble($model, []);

        $action = $this->makeAction($repository);
        $action->withData(['name' => 'Ignored']);

        $response = $action->callUpdateById(
            $this->createRequest('PUT', '/items/4'),
            new Response(),
            ['id' => 4]
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testDeleteByIdDelegatesToModel(): void
    {
        $records = [
            11 => ['name' => 'Removable'],
        ];
        $model = new ModelDouble($records);
        $repository = new RepositoryDouble($model, $records);

        $action = $this->makeAction($repository);
        $response = $action->callDeleteById(
            $this->createRequest('DELETE', '/items/11'),
            new Response(),
            ['id' => 11]
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([11], $model->deletedIds);
    }

    public function testListByModelReturnsAllRecordsWhenRequested(): void
    {
        $records = [
            ['id' => 1, 'label' => 'One'],
        ];
        $model = new ModelDouble($records);
        $repository = new RepositoryDouble($model, $records);

        $action = $this->makeAction($repository);
        $response = $action->callListByModel(new Response(), 'items', ['status' => 'any'], true);

        self::assertSame(200, $response->getStatusCode());
        $decoded = json_decode((string) $response->getBody(), true);
        self::assertSame($records, $decoded['data']);
        self::assertSame([['status' => 'any']], $model->allCalls);
    }

    public function testListByModelUsesFindAllWhenReturnAllFalse(): void
    {
        $records = [
            ['id' => 1, 'label' => 'One'],
            ['id' => 2, 'label' => 'Two'],
        ];
        $model = new ModelDouble($records);
        $repository = new RepositoryDouble($model, $records);

        $action = $this->makeAction($repository);
        $response = $action->callListByModel(new Response(), 'items', ['status' => 'filtered'], false);

        self::assertSame(200, $response->getStatusCode());
        $decoded = json_decode((string) $response->getBody(), true);
        self::assertSame($records, $decoded['data']);
        self::assertSame('filtered', $model->findAllCalls[0]['filters']['status']);
        self::assertSame(0, $model->findAllCalls[0]['limit']);
        self::assertSame(0, $model->findAllCalls[0]['offset']);
    }

    private function makeAction(object $repository): InstrumentedAction
    {
        $logger = $this->createMock(LoggerInterface::class);
        $action = new InstrumentedAction($logger);
        $action->withRepository($repository);
        $action->withResponse(new Response());
        $action->withArgs([]);

        return $action;
    }
}
