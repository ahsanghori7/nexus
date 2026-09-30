<?php
declare(strict_types=1);

namespace App\Application\Actions\Distance;


use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Domain\Distance\DistanceRepository;

/**
 * Class DistanceAction
 * @package App\Application\Actions\Distance
 */
class DistanceAction extends Action
{
    /**
     * Default content type for account action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * AccountAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new DistanceRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function addDistances (Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();
        foreach($data as $item){
            $this->repository->getModel('distance')->save([
                'origin'      => $item['origin'],
                'destination' => $item['destination'],
                'distance'    => json_encode($item['distance']),
            ]);
        }
        return $this->noContent($response);
    }

}
