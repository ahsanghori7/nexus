<?php


namespace App\Application\Actions\Account;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpNotFoundException;
use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Application\Actions\Account\SupplyChainAction;
use App\Domain\Account\Account;
use App\Domain\User\User;
use App\Application\Actions\Account\SupplyChain\Paginator;
use App\Domain\Supplychain\Collection as SupplyChainCollection;
class SupplyChainV2Action extends SupplyChainAction
{
    /**
     * Get paginator
     * @param Request $request
     * @param int|null $accountId
     * @return Paginator
     */
    public function getPaginator(Request $request, SupplyChainCollection $collection)
    {
        return new Paginator($request, $collection);
    }

    /**
     * Get all supply chain accounts
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getSupplyChain(Request $request, Response $response, array $args)
    {
        $queryParams = $request->getQueryParams();
        $limit  = $queryParams['limit'] ?? 0;
        $offset = $queryParams['offset'] ?? 0;
        $order   = (int) ($queryParams['desc'] ?? 0);
        $orderBy = $queryParams['order'] ?? "created_at";
        $term   = $queryParams['term'] ?? "";
        $activated   = $queryParams['activated'] ?? null;
        $pqq_status   = $queryParams['pqq_status'] ?? null;
        $accountId = intval($args['account_id']);
        $attributes = [];
        foreach(["trades", "regions", "attributes"] as $key) {
            if(isset($queryParams[$key])) {
                foreach(explode(",", $queryParams[$key]) as $value) {
                    $attributes[$key][] = intval($value);
                }
            }
        }

        $collection = new SupplyChainCollection(
            $accountId, $attributes, $this->repository->getModel('account_user_mapping'), $limit, $offset, $term, $orderBy, $order, $activated, $pqq_status
        );

        try{
            $account = $this->checkEntityExists($accountId, $request);
        } catch(HttpNotFoundException $e) {
            return $this->respond(
                $response,
                new ActionPayload(404, ["message" => "Account ($accountId) not found"])
            );
        }

        $paginator = $this->getPaginator($request, $collection);
        return $this->respond(
            $response,
            (new ActionPayload(200,
                $collection->getCollectionData(),
            ))->setPager($paginator)
        );
    }

    /**
     * Get a single supply chain account
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getSupplyChainAccount(Request $request, Response $response, array $args)
    {
        $accountId = intval($args['account_id']);
        $group_id = intval($args['group_id']);

        try{
            $account  = $this->checkEntityExists($accountId, $request);
            $data     = (new SupplyChainCollection(
                $accountId,  [], $this->repository->getModel('account_user_mapping')
            ))->getCollectionData([$group_id], true);

            $subcontractor = $data[$group_id] ?? [];
            return $this->respond(
                $response,
                new ActionPayload(200, $subcontractor)
            );
        } catch(HttpNotFoundException $e) {
            return $this->respond(
                $response,
                new ActionPayload(404, ["message" => "Supply Chain Account ($group_id) not found"])
            );
        }
    }

    /**
     * Create a new supply chain account
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createSupplyChainAccount(Request $request, Response $response, array $args)
    {
        $this->repository->getModel("supply_chain")->save([
            "parent_id" => (int)$args['account_id'],
            "child_id"  => (int)$this->getData("id"),
        ]);
        return $this->respond(
            $response,
            new ActionPayload(200, ['message' => 'Success'])
        );
    }

    public function updateSupplyChainAccount(Request $request, Response $response, array $args)
    {
        // This method would typically handle updates to the mapping,
        // such as changing the user or other attributes.
        // For now, it's a placeholder.
        return $this->respond(
            $response,
            new ActionPayload(501, ['message' => 'Not Implemented'])
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getSupplyChainAccountUserMapping(Request $request, Response $response, array $args)
    {
        // Implement the logic to get the user data for the supply chain account
        // This is a placeholder implementation
        $accountId = intval($args['account_id']);
        $group_id = intval($args['group_id']);
        $user_id = intval($args['user_id']);
        try{
            $this->checkEntityExists($accountId, $request);
            $data = (new SupplyChainCollection(
                $accountId,  [], $this->repository->getModel('account_user_mapping')
            ))->getCollectionData([$group_id], true);
            $subcontractor = $data[$group_id] ?? [];
            $user_contact = ($filtered = array_values(array_filter($subcontractor['users'] ?? [], fn($user) => isset($user['id']) && $user['id'] == $user_id))) ? $filtered[0] : null;
            return $this->respond(
                $response,
                new ActionPayload(200, $user_contact)
            );
        } catch(HttpNotFoundException $e) {
            return $this->respond(
                $response,
                new ActionPayload(404, ["message" => "Supply Chain Account ($group_id) not found"])
            );
        }
    }

    /**
     * Create a new user mapping for the supply chain account
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createSupplyChainAccountUserMapping(Request $request, Response $response, array $args)
    {
        $model = $this->repository->getModel('account_user_mapping');

        $data = [
            'account_id'          => (int)$args['account_id'],
            'user_id'             => (int)$args['user_id'],
            'user_firstname'      => $this->getData("firstname"),
            'user_lastname'       => $this->getData("lastname"),
            'user_contact_number' => $this->getData("contact_number"),
            'mapping_type_id'     => (int)$this->getMappingType()->getId(),
        ];
        try{
            $mappingExists = $model->findOne($data);
            $id = $mappingExists->getId();
        }catch (\Exception $e){

            $id = $model->save($data)->getId();
        }
        return $this->respond(
            $response,
            new ActionPayload(200, [['id' => $id] + $data])
        );
    }

    public function updateSupplyChainAccountUser(Request $request, Response $response, array $args)
    {
        // Implement the logic to update the user data for the supply chain account
        // This is a placeholder implementation
        return $this->respond(
            $response,
            new ActionPayload(501, ['message' => 'Not Implemented'])
        );
    }

    /**
     * Update account user mapping including main contact designation
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updateSupplyChainAccountUserMapping(Request $request, Response $response, array $args)
    {
        $accountId = intval($args['account_id']);
        $subcontractorAccountId = intval($args['group_id']);
        $userId = intval($args['user_id']);

        $model = $this->repository->getModel('account_user_mapping');
        $type = $this->getMappingType();

        try {
            $mapping = $model->findOne([
                'account_id' => $accountId,
                'user_id' => $userId,
                'mapping_type_id' => $type->getId(),
            ]);

            if (!$mapping) {
                return $this->respond(
                    $response,
                    new ActionPayload(404, ['message' => 'User mapping not found'])
                );
            }


            $data = [];
            $data['user_firstname'] = $this->getData("firstname");
            $data['user_lastname'] = $this->getData("lastname");
            $data['user_contact_number'] = $this->getData("contact_number");

            if ($this->getData("is_main_contact") !== null) {
                $isMainContact = (bool) $this->getData("is_main_contact");
                $data['is_main_contact'] = $isMainContact;

                // If setting as main contact, unset all other main contacts for this account
                if ($isMainContact) {
                    $sql = ("
                        UPDATE account_user_mapping aum
                        JOIN user u ON u.id = aum.user_id
                        SET aum.is_main_contact = false
                        WHERE aum.account_id = {$accountId}
                        AND aum.mapping_type_id = {$type->getId()}
                        AND aum.user_id != {$userId}
                        AND u.account_id = {$subcontractorAccountId}
                    ");
                    $result = $model->getDB()::exec($sql);
                }
            }

            if (empty($data)) {
                return $this->respond(
                    $response,
                    new ActionPayload(400, ['message' => 'No data provided for update'])
                );
            }

            if($mapping->save($data) === false) {
                $error_data = $mapping->getErrors();
                throw new \Exception("Failed to update user mapping: " . json_encode($error_data));
            }

            return $this->respond(
                $response,
                new ActionPayload(200, ['message' => 'User mapping updated successfully'])
            );

        } catch (\Exception $e) {
            return $this->respond(
                $response,
                new ActionPayload(500, ['message' => 'Error updating user mapping: ' . $e->getMessage()])
            );
        }
    }

    /**
     * Delete a user from the supply chain account
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deleteSupplyChainAccountUserMapping(Request $request, Response $response, array $args)
    {
        $accountId = intval($args['account_id']);
        $subcontractorAccountId = intval($args['group_id']);
        $userId = intval($args['user_id']);

        $model = $this->repository->getModel('account_user_mapping');
        $type = $this->getMappingType();
        $model->deleteWhere([
            'account_id' => $accountId,
            'user_id' => $userId,
            'mapping_type_id' => $type->getId(),
        ]);

        // If removing this contact leaves the subcontractor with no account_holder
        // contact for this main contractor, promote the main contact to account_holder
        $this->promoteMainContactIfNoAccountHolder($accountId, $subcontractorAccountId);

        return $this->noContent($response);
    }

    /**
     * After a supply-chain contact is removed, ensure the subcontractor still has an
     * account_holder contact for this main contractor. If none remains, promote the
     * current main contact to account_holder,
     * falling back to the first remaining contact when no main contact is designated.
     *
     * @param int $accountId
     * @param int $subcontractorAccountId
     * @return void
     */
    private function promoteMainContactIfNoAccountHolder(int $accountId, int $subcontractorAccountId): void
    {
        $mappingModel = $this->repository->getModel('account_user_mapping');
        $mappings     = $mappingModel->getAccountUserMappings($accountId, 'supply_chain', [$subcontractorAccountId]);
        $users        = $mappings[$subcontractorAccountId] ?? [];

        if (empty($users)) {
            return;
        }

        $userModel           = $this->repository->getModel('user');
        $accountHolderTypeId = (int) $userModel->getTypeModel()->getLabelId(User::ACCOUNT_HOLDER_TYPE);

        $mainContactUserId = null;
        $fallbackUserId    = null;
        foreach ($users as $user) {
            if ((int) $user['type_id'] === $accountHolderTypeId) {
                return; // an account_holder is still mapped, nothing to do
            }
            if ($fallbackUserId === null) {
                $fallbackUserId = (int) $user['id'];
            }
            if ((int) $user['is_main_contact'] === 1) {
                $mainContactUserId = (int) $user['id'];
            }
        }

        $promoteUserId = $mainContactUserId ?? $fallbackUserId;
        if ($promoteUserId === null) {
            return; // no contact available to promote
        }

        $userModel->getDB()::exec(
            sprintf('UPDATE %s SET type_id = %d WHERE id = %d', $userModel->getName(), $accountHolderTypeId, $promoteUserId)
        );
    }

    /**
     * Get the mapping type for the supply chain account
     */
    public function getMappingType()
    {
        return $this->repository->getModel('account_user_mapping_type')->findOne(['label' => 'supply_chain']);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deleteSupplyChainAccount(Request $request, Response $response, array $args)
    {
        $this->repository->getModel("supply_chain")->deleteWhere([
            "parent_id" => (int)$args['account_id'],
            "child_id"  => (int)$args['group_id']
        ]);
        // Do we need to also remove the account user mapping? because if not that means that if the main contractor re-adds the subcontractor then the old user mapping will be again active
        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getMainContractorsBySubcontractor(Request $request, Response $response, array $args)
    {
        $supplyChain = $this->repository->getModel("supply_chain")->findAll(['child_id' => (int)$args['account_id']]);
        $mainContractors = array_column($supplyChain, 'parent_id');
        return $this->respond(
            $response,
            new ActionPayload(200, $mainContractors)
        );
    }
}
