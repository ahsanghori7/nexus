<?php
declare(strict_types=1);

namespace App\Application\Actions\Category\v2;

use App\Application\Actions\Category\v1\CategoryAction as PreviousVersion;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;

/**
 * Class ProjectAction
 * @package App\Application\Actions\Project
 */
class CategoryAction extends PreviousVersion
{

  /**
   * @param Request $request
   * @param Response $response
   * @return Response
   */
  public function list(Request $request, Response $response): Response
  {
      $params = $request->getQueryParams();
      $model = $this->repository->getModel()->with("documents");
      if(isset($params['entity_id'])) {
          $model->where(function ($query) use ($params) {
              $query->where('entity_id', '=', $params['entity_id'])
                  ->orWhere('parent_id', '=', $params['entity_id']);
          });
          unset($params['entity_id']);
      }

      $model->where($params);

      return $this->respond(
          $response,
          (new ActionPayload(200,$model->get()->toArray()))
      );
  }
}
