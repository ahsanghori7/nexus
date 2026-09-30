<?php
declare(strict_types=1);

namespace App\Application\Actions\Document\v2;

use App\Application\Actions\ActionPayload;
use App\Application\Actions\Document\v1\DocumentAction as PreviousVersion;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Class DocumentAction
 * @package App\Application\Actions\Document
 */
class DocumentAction extends PreviousVersion {

    /**
     * @param Request $request
     * @param Response $response
     * @return Response
     */
    public function create(Request $request, Response $response): Response
    {
        $data = $this->getData();

        if(!isset($data['owner_id'])) {
            throw new \Exception("Missing owner id");
        }

        $id = $this->repository->create($data);
        if($id) {
            if(isset($data["category"])) {
                $this->repository->createCategoryMapping([
                    'document_id' => $id,
                    'category_id' => $data['category']
                ]);
            }
            $this->repository->createDocumentOwnerMapping([
                'document_id' => $id,
                'owner_id' => $data['owner_id']
            ]);
            return $this->respond(
                $response,
                new ActionPayload(200, ['id' => $id])
            );
        }
        return $this->badRequest($response);
    }
}
