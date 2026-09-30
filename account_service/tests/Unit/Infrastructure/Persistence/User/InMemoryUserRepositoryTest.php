<?php
declare(strict_types=1);

namespace Tests\Infrastructure\Persistence\User;

use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use App\Domain\AbstractModel;
use App\Infrastructure\Action\Paginator;
use Tests\TestCase;

class InMemoryUserRepositoryTest extends TestCase
{
    public function testActionPayloadIncludesPaginationLinks(): void
    {
        $payload = new ActionPayload(200, [['id' => 1]]);
        $request = $this->createRequest('GET', '/v1/user')
            ->withQueryParams(['limit' => 1]);

        $model = new class extends AbstractModel {
            public function getCount(array $where = []): int
            {
                return 1;
            }
        };

        $payload->setPager(new Paginator($request, $model));

        $this->assertSame(
            [
                'data' => [['id' => 1]],
                'links' => [
                    'next' => '',
                    'prev' => '',
                    'page' => 0,
                    'pages' => 1,
                    'total' => 1,
                ],
            ],
            json_decode(json_encode($payload), true)
        );
    }

    public function testActionPayloadSerializesErrorWhenNoData(): void
    {
        $error = new ActionError(ActionError::RESOURCE_NOT_FOUND, 'missing');
        $payload = new ActionPayload(404, null, $error);

        $this->assertSame(
            [
                'error' => [
                    'type' => ActionError::RESOURCE_NOT_FOUND,
                    'description' => 'missing',
                    'friendly' => 'An error has occured',
                ],
            ],
            json_decode(json_encode($payload), true)
        );
    }
}
