<?php

declare(strict_types=1);

namespace App\Application\Actions\Document;

use App\Domain\Document\DocumentRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;

/**
 * Class CertificatesAction
 * @package App\Application\Actions\Document
 */
class CertificatesAction extends Action
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
    public function __construct(LoggerInterface $logger)
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
    public function getDefaultCertificates(Request $request, Response $response, $args): Response
    {
        $model = $this->repository->getModel('documentDefaultCertificates')
            ->with("documentSubType");
        $certificates = $model->exists() ? $model->get()->toArray() : [];

        $result = [];
        foreach (array_filter($certificates, function ($cert) {
            return $cert['parent_id'] === null;
        }) as $item) {
            $key = $item["document_sub_type"]["uid"];
            if (!isset($result[$key])) {
                $result[$key] = $item["document_sub_type"];
            }

            if (!isset($result[$key]["documents"])) {
                $result[$key]["documents"] = [];
            }
            unset($item["parent_id"], $item["document_sub_type"]);
            $result[$key]["documents"][] = $item;
        }

        foreach (array_filter($certificates, function ($cert) {
            return $cert['parent_id'] !== null;
        }) as $section => $item) {
            $section = $item["document_sub_type"]['uid'];
            $parentIndex = array_search($item['parent_id'], array_column($result[$section]["documents"], 'id'));
            if ($parentIndex !== false) {
                unset($item["parent_id"], $item["document_sub_type"]);
                $result[$section]["documents"][$parentIndex]['extra'][] = $item;
            }
        }

        $subtype = $this->repository->getModel('documentSubType')->where(['uid' => 'custom-certificate']);
        if ($subtype->exists()) {
            $customCertificate = $subtype->get()->toArray();
            $customCertificate = array_shift($customCertificate);
            $customCertificate["documents"] = [];
            $result[$customCertificate['uid']] = $customCertificate;
        }

        return $this->respond(
            $response,
            new ActionPayload(200, $result)
        );
    }
}
