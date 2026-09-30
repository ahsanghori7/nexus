<?php
declare(strict_types=1);

namespace App\Application\Actions\Template;

use App\Domain\Template\TemplateRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Infrastructure\Environment as Env;


/**
 * Class DocumentAction
 * @package App\Application\Actions\Document
 */
class TemplateAction extends Action {

    const DEFAULT_USER_ID = 0;

  /**
   * Default content type for account action data is json
   * @var string
   */
  protected $defaultContentType = "application/json";

  /**
   * AccountAction constructor.
   * @param LoggerInterface $logger
   */
  public function __construct (LoggerInterface $logger)
  {
    parent::__construct($logger);
    $this->repository = new TemplateRepository();
  }

  /**
   * @param Request $request
   * @param Response $response
   * @return Response
   */
  public function list(Request $request, Response $response): Response
  {
    $params = $request->getQueryParams();
    $template = $this->repository
      ->getModel()
      ->where($params);

    return $this->respond(
      $response,
      (new ActionPayload(200, $template->get()->toArray()))
    );
  }

  /**
   * @return \Illuminate\Database\Eloquent\Builder
   * @throws \Exception
   */
  public function getDefaultTemplates(): \Illuminate\Database\Eloquent\Builder
  {
    $defaultUserId = $this::DEFAULT_USER_ID;
    return $this->repository
      ->getModel("mapping")
      ->with("templates")
      ->where(function($query) use($defaultUserId) {
        $query->where("user_id", $defaultUserId);
      });
  }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
  public function listByUser(Request $request, Response $response, $args): Response {

      $params = $request->getQueryParams();

      $mappings = $this->repository
        ->getModel("mapping")
        ->with("templates")
        ->where(function($query) use($args) {
          $query->where("user_id", (int) $args["user_id"]);
        });

      if(!$mappings->get()->toArray()){
        $mappings = $this->getDefaultTemplates();
      }

      $data = [];
      foreach ($mappings->get()->toArray() as $row) {
          foreach($row["templates"] as $template) {
              if(isset($params["type_id"])) {
                  if((int)$params["type_id"] !== $template["type_id"]) {
                      continue;
                  }
              }
              $data[] = $template;
          }
      }
      return $this->respond(
          $response,
          (new ActionPayload(200, $data))
      );
  }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
  public function getTypes(Request $request, Response $response, $args) {
      $model = $this->repository->getModel("type");
      $types = [];
      foreach($model->get()->toArray() as $type) {
          $types[$type["id"]] = $type["label"];
      }
      return $this->respond(
          $response,
          (new ActionPayload(200, $types))
      );
  }
}
