<?php

declare(strict_types=1);

namespace App\Application\Actions\Prequalification;

use App\Application\Actions\ActionPayload;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Domain\Account\AccountRepository;

/**
 * Class PrequalificationAction
 * @package App\Application\Actions\Account
 */
class PrequalificationAction extends Action
{
    /**
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * PrequalificationAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new AccountRepository();
    }

    /**
     * Deprecated use: App\Application\Actions\Account::updateMeta;
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function updateCompanyById(Request $request, Response $response, array $args): Response
    {
        $id = (int)($args["id"] ?? null);
        $model = $this->repository->getModel("account_meta");
        $meta_keys = $model->loadMetaKeys();
        foreach ($this->getData() as $key => $value) {
            if ($model->isValidMetaKey($key)) {
                $meta_data = [
                    'account_id'  => $id,
                    'meta_key_id' => $meta_keys[$key],
                    'value'       => $value,
                ];
                try {
                    /*
                     * Update existing meta keys
                     */
                    $meta = $model->findOne(['account_id' => $id, 'meta_key_id' => $meta_keys[$key]]);
                    $meta_model = $model->load($meta->getId(), 'id');
                    $meta_model->save($meta_data);
                } catch (\Exception $e) {
                    /*
                     * Insert new meta key values
                     */
                    $this->repository->getModel("account_meta")->save($meta_data);
                }
            }
        }

        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function updateOrganisationById(Request $request, Response $response, array $args): Response
    {
        $id = (int)($args["id"] ?? null);
        $model = $this->repository->getModel("account_organisation");
        foreach ($this->getData() as $key => $value) {
            $model_data = $model->load($value['id'], 'id');
            $data = [
                'account_id' => $id,
                'title'      => $value['title'],
                'user_firstname'  => $value['firstname'],
                'user_lastname'   => $value['lastname'],
                'email'      => $value['email'],
            ];
            if ($model_data->isLoaded()) {
                $model_data->save($data);
            } else {
                $model->save($data);
            }
        }
        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function updateTurnoverById(Request $request, Response $response, array $args): Response
    {
        $id = (int)($args["id"] ?? null);

        //set active trading to false for every entries for the account id
        $this->repository->updateModelByConditions("account_turnover", ["active_trading" => 'false'], ['account_id' => $id]);

        //update each entries for a specific set of years for the account id
        foreach ($this->getData() as $key => $value) {
            $model = $this->repository->getModel("account_turnover");
            if (!$this->repository->updateModelByConditions("account_turnover", [
                'value'          => $value['value'],
                'active_trading' => true,
                'profit_before_tax' => $value['profit_before_tax']
            ], ['year' => $value['year'], 'account_id' => $id])) {
                $value['account_id'] = $id;
                $model->save($value);
            }
        }

        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function updateReferencesById(Request $request, Response $response, array $args): Response
    {
        $model = $this->repository->getModel("account_references");
        $data = $this->getData();
        $data['account_id'] = (int)($args["id"] ?? null);
        $model->save($data);
        return $this->respond(
            $response,
            new ActionPayload(200, [
                'id' => $model->getId()
            ])
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function updateReferenceById(Request $request, Response $response, array $args): Response
    {
        $model = $this->repository->getModel("account_references");
        $data = $this->getData();
        $data['account_id'] = (int)($args["id"] ?? null);
        $data['id'] = (int)($args["rid"] ?? null);

        $reference = $model->findOne(['account_id' =>  $data['account_id'], 'id' => $data['id']]);
        $reference_model = $model->load($reference->getId(), 'id');
        if ($reference_model->isLoaded()) {
            $reference_model->save($data);
        }

        return $this->noContent($response);
    }


    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function updateStatusesById(Request $request, Response $response, array $args): Response
    {
        $id = (int)($args["id"] ?? null);
        $data = $this->getData();
        $model = $this->repository->getModel("account_prequalification_status");

        if (isset($data['status']['sections']) && is_array($data['status']['sections'])) {
            foreach ($data['status']['sections'] as $key => $value) {
                $save_data = [
                    'account_id'      => $id,
                    'section_id'      => $value['id'],
                    'status'          => (bool)$value['status'],
                    'section_message' => $value['message']
                ];
                try {
                    $model_loaded = $model->findOne(['account_id' => $id, 'section_id' => $value['id']]);
                    if ($model_loaded->isLoaded()) {
                        $model_loaded->save([
                            'status'          => (bool)$value['status'],
                            'section_message' => $value['message']
                        ]);
                    } else {
                        $model->save($save_data);
                    }
                } catch (\Exception $e) {
                    $model->save($save_data);
                }
            }
        }

        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getPrequalificationById(Request $request, Response $response, array $args): Response
    {
        $id = (int)($args["id"] ?? null);

        try {
            $references = $this->repository->getModel('account_references')->findAll(['account_id' => $id]);
        } catch (\Exception $e) {
            $references = [];
        }

        try {
            $statuses = $this->repository->getModel('account_prequalification_status')->findAll(['account_id' => $id]);
        } catch (\Exception $e) {
            $statuses = [];
        }

        return $this->respond(
            $response,
            new ActionPayload(200, [
                'organisation' => $this->repository->getModel('userOrganisation')->findAll(['ur.account_id' => $id]),
                'references'   => $references,
                'turnover'     => $this->repository->getModel('account_turnover')->findAll(['account_id' => $id]),
                'meta'         => $this->repository->getModel('account_meta')->loadMetaById($id),
                'statuses'     => $statuses
            ])
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getPrequalificationSectionsById(Request $request, Response $response, array $args): Response
    {
        $id = (int)($args["id"] ?? null);
        $model = $this->repository->getModel("account_prequalification_status");
        if ($id) {
            $model->findAll(["account_id" => $id]);
        }
        $result = $id ? $model->findAll(["account_id" => $id]) : $model->findAll();
        return $this->respond(
            $response,
            new ActionPayload(200, $result)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getPrequalificationSectionStatuses(Request $request, Response $response, array $args): Response
    {
        $id = (int)($args["id"] ?? null);
        $model = $this->repository->getModel("prequalification_section_mapping");
        $result = $id ? $model->all(["account_id" => $id]) : $model->all();

        return $this->respond(
            $response,
            new ActionPayload(200, $result)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createPrequalificationSectionStatuses(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();
        if ($data) {
            $id = $this->repository->getModel('prequalification_section_mapping')->save($data)->getId();
        } else {
            return $this->badRequest($response);
        }

        return $this->respond(
            $response,
            new ActionPayload(200, array('id' => $id))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updatePrequalificationSectionStatuses(Request $request, Response $response, array $args): Response
    {
        $id = (int)($args["id"] ?? null);
        $data = $this->getData();
        $model = $this->repository->getModel("prequalification_section_mapping");
        $model_data = $model->load($id, 'id');

        if ($model_data->isLoaded()) {
            $model_data->save($data);
        }

        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getPrequalificationSections(Request $request, Response $response, array $args): Response
    {
        $model = $this->repository->getModel("account_prequalification_sections");
        return $this->respond(
            $response,
            new ActionPayload(200, $model->findAll())
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getPrequalificationSectionList(Request $request, Response $response, array $args): Response
    {
        $model = $this->repository->getModel("prequalification_section");
        return $this->respond(
            $response,
            new ActionPayload(200, $model->findAll())
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \App\Domain\DomainException
     */
    public function updateSection(Request $request, Response $response, array $args): Response
    {
        $id = (int)($args["id"] ?? null);
        $data = $this->getData();
        $model = $this->repository->getModel("account_prequalification_status");

        $save_data = [
            'account_id' => $id,
            'section_id' => $data['id'],
            'status'     => (bool)$data['status'],
            'section_message'    => $data['section_message']
        ];

        try {
            $model_loaded = $model->findOne(['account_id' => $id, 'section_id' => $data['id']]);
            if ($model_loaded->isLoaded()) {
                $model_loaded->save([
                    'status' => (bool)$data['status'],
                    'section_message' => $data['section_message']
                ]);
            } else {
                $model->save($save_data);
            }
        } catch (\Exception $e) {
            $model->save($save_data);
        }

        return $this->noContent($response);
    }
}
