<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions\Account;

use App\Application\Actions\Account\ProviderAction;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Response;

final class ProviderActionTest extends TestCase
{
    public function testGetProviderAccountMappingReturnsResponse(): void
    {
        $logger = $this->createMock(LoggerInterface::class);

        $action = new ProviderAction($logger);

        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/provider/1/google');

        $response = new Response();

        $result = $action->getProviderAccountMapping(
            $request,
            $response,
            [
                'id' => 1,
                'provider' => 'google',
            ]
        );

        $this->assertSame(200, $result->getStatusCode());
    }

}
