<?php
declare(strict_types=1);

namespace Tests\Unit\Application\Actions\Document;

use App\Application\Actions\Document\CertificatesAction;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;

final class CertificatesActionTest extends TestCase
{
    public function testGetDefaultCertificatesGroupsBySubtype(): void
    {
        $repository = new CertificatesRepositoryStub(
            [
                [
                    'id' => 1,
                    'parent_id' => null,
                    'document_sub_type' => ['uid' => 'type-a', 'name' => 'Type A'],
                    'label' => 'Parent A',
                ],
                [
                    'id' => 2,
                    'parent_id' => 1,
                    'document_sub_type' => ['uid' => 'type-a', 'name' => 'Type A'],
                    'label' => 'Child A',
                ],
                [
                    'id' => 3,
                    'parent_id' => null,
                    'document_sub_type' => ['uid' => 'type-b', 'name' => 'Type B'],
                    'label' => 'Parent B',
                ],
            ],
            [
                ['uid' => 'custom-certificate', 'label' => 'Custom'],
            ]
        );

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends CertificatesAction {
            public function __construct(LoggerInterface $logger, private CertificatesRepositoryStub $stub)
            {
                $this->logger = $logger;
                $this->repository = $this->stub;
            }
        };

        $response = $action->getDefaultCertificates($this->createMock(Request::class), new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        $data = $payload['data'];

        self::assertArrayHasKey('type-a', $data);
        self::assertArrayHasKey('type-b', $data);
        self::assertArrayHasKey('custom-certificate', $data);

        self::assertSame('Type A', $data['type-a']['name']);
        self::assertSame('Parent A', $data['type-a']['documents'][0]['label']);
        self::assertSame(2, $data['type-a']['documents'][0]['extra'][0]['id']);

        self::assertSame('Type B', $data['type-b']['name']);
        self::assertSame([], $data['custom-certificate']['documents']);
    }
}

final class CertificatesRepositoryStub
{
    public function __construct(private array $certificates, private array $subTypes)
    {
    }

    public function getModel(string $name = 'documentDefaultCertificates'): CertificatesModelStub
    {
        if ($name === 'documentDefaultCertificates') {
            return new CertificatesModelStub($this->certificates);
        }

        if ($name === 'documentSubType') {
            return new CertificatesModelStub($this->subTypes);
        }

        return new CertificatesModelStub([]);
    }
}

final class CertificatesModelStub
{
    public function __construct(private array $rows)
    {
    }

    public function with(string $relation): self
    {
        return $this;
    }

    public function where(array $filter): self
    {
        $filtered = array_filter($this->rows, static function (array $row) use ($filter) {
            foreach ($filter as $key => $value) {
                if (!array_key_exists($key, $row) || $row[$key] !== $value) {
                    return false;
                }
            }
            return true;
        });

        return new self(array_values($filtered));
    }

    public function exists(): bool
    {
        return (bool) count($this->rows);
    }

    public function get(): object
    {
        return new class($this->rows) {
            public function __construct(private array $rows)
            {
            }

            public function toArray(): array
            {
                return $this->rows;
            }
        };
    }
}
