<?php


namespace App\Application\Actions\Region;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Region\RegionRepository;

class RegionAction extends Action
{

    protected const REGION_ACCOUNT_TYPE_ID = 3;

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
        $this->repository = new RegionRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getRegions(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $params['account_id'] = (int)$args['id'];
        return $this->listByModel($response, "region_mapping", $params);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getRegionGroup(Request $request, Response $response, array $args): Response
    {
        return $this->listByModel($response, "region_group");
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \App\Domain\DomainException
     * @throws \ReflectionException
     */
    public function updateAccountRegions(Request $request, Response $response, array $args): Response
    {
        $region_type_id = self::REGION_ACCOUNT_TYPE_ID;
        $this->repository->getModel('region_mapping')->deleteWhere(['account_id' => (int) $args["id"], 'type_id' => $region_type_id]);

        foreach($this->getData() as $region){
            $this->repository->getModel("region_mapping")->save([
                'account_id' => (int)$args['id'],
                'region_id'  => (int)$region,
                'group_id'   => (int)$args['id'],
                'type_id'    => $region_type_id
            ]);
        }
        return $this->noContent($response);
    }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @throws \ReflectionException
   */
    public function createRegion(Request $request, Response $response, array $args): Response
    {
      $data = $this->getData();
      if(!$data) {
        return $this->badRequest($response);
      }

      $region = $this->repository->getModel()->save([
        'label' => $data['label']
      ]);

      /*
       * Sync the id with the legacy one
      */
      $this->repository->getModel()->getDB()::exec(
        sprintf('UPDATE %s SET %s = ? WHERE %s = ?', $this->repository->getModel()->getName(), $this->repository->getModel()::ID_FIELD, $this->repository->getModel()::ID_FIELD),
        [
          $data['region_id'],
          $region->getId()
        ]
      );

      return $this->respond(
        $response,
        new ActionPayload(200, ['success' => true])
      );

    }
}
