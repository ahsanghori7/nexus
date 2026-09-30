<?php

declare(strict_types=1);

namespace App\Application\Actions\Model;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Account\AccountRepository;
use App\Domain\User\UserRepository;

/**
 * Class AccountAction
 * @package App\Application\Actions\Account
 */
class ModelAction extends Action
{
    /**
     * Default content type for account action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";


    protected $resources = [];


    /**
     * AccountAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->resources["account"] = new AccountRepository();;
        $this->resources["user"] = new UserRepository();;
    }

    /**
     *  Describe a models columns
     */
    public function describe(Request $request, Response $response, array $args) {

        $resource  = $args["resource"];
        $modelName = $args["model"] ?? $resource;

        if(isset($this->resources[$resource])) {
            try{
                $model = $this->resources[$resource]->getModel($modelName);
            }
            catch(\Exception $e) {
                return $this->notFound($response);
            }

            $columns = $model->getColumns();
            return $this->respond(
                $response,
                new ActionPayload(200, ["fields" => $columns])
            );
        }

        return $this->notFound($response);
    }
}
