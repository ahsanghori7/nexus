<?php
declare(strict_types=1);

namespace App\Application\Actions\Instruction;

use App\Domain\Document\DocumentRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;

/**
 * Class InstructionAction
 * @package App\Application\Actions\Instruction
 */
class InstructionAction extends Action
{

    public const DOCUMENT_UPLOAD_KEY = 'document';

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
        $this->repository = new DocumentRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param $args
     * @return Response
     * @throws \Exception
     */
    public function getInstructionById(Request $request, Response $response, $args): Response
    {
        $model = $this->repository->getModel('category')
            ->with("documents")
            ->where(["parent_id" => (int)$args['id'], 'entity_type' => 'instruction']);

        $model = $model->exists() ? $model->get()->toArray() : [];

        $documents = [];
        foreach($model as $items) {
            if ( isset($items['documents']) ) {
                foreach ($items['documents'] as $document) {
                    $meta = json_decode($document['meta'], true);
                    if ( isset($meta['instruction_id']) ) {
                        $document['instruction_id'] = $meta['instruction_id'];
                        $document['category_id'] = $items['id'];
                        $documents[] = $document;
                    }
                }
                unset($items['documents']);
                $items['documents'] = $documents;
            }
            unset($model['documents']);
            $model['documents'] = $documents;
        }


        return $this->respond(
            $response,
            new ActionPayload(200, $items ?? [])
        );
    }

}
