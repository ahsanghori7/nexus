<?php

declare(strict_types=1);

namespace Tests\Unit\Action;

use App\Application\Actions\Token\TokenAction;
use App\Domain\Project\ProjectRepository;
use PHPUnit\Framework\TestCase;
use Tests\Helpers\Http;
use Tests\Helpers\Mocks;

class TokenActionTest extends TestCase
{
    public function testDisableMarksTokenInactive(): void
    {
        $repository = $this->getMockBuilder(ProjectRepository::class)
            ->addMethods(['verify', 'setTokenInactive'])
            ->getMock();
        $repository->expects(self::once())->method('verify')->with('abc')->willReturn(true);
        $repository->expects(self::once())->method('setTokenInactive')->with('abc');

        $action = new TokenAction(Mocks::logger());
        Mocks::setProperty($action, 'repository', $repository);

        $response = $action->disable(Http::jsonRequest('DELETE', '/token/abc'), Http::response(), ['token' => 'abc']);
        self::assertSame(200, $response->getStatusCode());
    }

    public function testDisableReturnsNotFoundForInvalidToken(): void
    {
        $repository = $this->getMockBuilder(ProjectRepository::class)
            ->addMethods(['verify', 'setTokenInactive'])
            ->getMock();
        $repository->expects(self::once())->method('verify')->with('missing')->willReturn(false);
        $repository->expects(self::never())->method('setTokenInactive');

        $action = new TokenAction(Mocks::logger());
        Mocks::setProperty($action, 'repository', $repository);

        $response = $action->disable(Http::jsonRequest('DELETE', '/token/missing'), Http::response(), ['token' => 'missing']);
        self::assertSame(404, $response->getStatusCode());
    }

    public function testDisableWithoutTokenIsNotFound(): void
    {
        $repository = $this->getMockBuilder(ProjectRepository::class)
            ->addMethods(['verify', 'setTokenInactive'])
            ->getMock();
        $repository->expects(self::once())->method('verify')->with(null)->willReturn(false);

        $action = new TokenAction(Mocks::logger());
        Mocks::setProperty($action, 'repository', $repository);

        $response = $action->disable(Http::jsonRequest('DELETE', '/token'), Http::response(), []);
        self::assertSame(404, $response->getStatusCode());
    }
}
