<?php

namespace App\Application\Actions\Account;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Application\Actions\ActionPayload;
use App\Domain\Attribute\Collection;
use App\Domain\Attribute\TypeCollection;
use App\Domain\Attribute\CategoryCollection;
use App\Domain\Attribute\CategoryMappingCollection;
use App\Domain\Attribute\AttributeMappingCollection;

class AttributeV2Action extends SupplyChainAction
{

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \ReflectionException
     */
    public function getAttributes(Request $request, Response $response, array $args)
    {
        $queryParams = $request->getQueryParams();
        return $this->respond(
            $response,
            (new ActionPayload(200,
                (new Collection())->getCollectionData($queryParams),
            ))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \ReflectionException
     */
    public function getAttributesType(Request $request, Response $response, array $args)
    {
        return $this->respond(
            $response,
            (new ActionPayload(200,
                (new TypeCollection())->getCollectionData(),
            ))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \ReflectionException
     */
    public function getAttributesCategory(Request $request, Response $response, array $args)
    {
        return $this->respond(
            $response,
            (new ActionPayload(200,(new CategoryCollection())->getCollectionData($args)))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getAttributesCategoryValues(Request $request, Response $response, array $args)
    {
        return $this->respond(
            $response,
            (new ActionPayload(200,
                (new CategoryCollection())->getModel()->getCategoryMappings($args),
            ))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getAttributesCategoryAttributes(Request $request, Response $response, array $args)
    {
        return $this->respond(
            $response,
            (new ActionPayload(200,
                (new CategoryCollection())->getModel()->getCategoryMappings($args, true),
            ))
        );
    }



    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getAttributeMappings(Request $request, Response $response, array $args): Response
    {
        $accountId = (int)$args['parent_id'];
        $groupId   = (int)$args['group_id'];
        $type      = $args['attribute_type'] ?? null;
        $collection = new AttributeMappingCollection($accountId, $groupId, $this->repository->getModel('account_attribute_mapping'), $type);
        return $this->respond(
            $response,
            (new ActionPayload(200,
                $collection->getCollectionData(),
            ))
        );
    }

    /**
     * Create attribute mappings for a group
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createMapping(Request $request, Response $response, array $args): Response
    {
        $accountId  = (int)$args['parent_id'];
        $groupId    = (int)$args['group_id'];
        $data       = $this->getData();
        $collection = new AttributeMappingCollection($accountId, $groupId, $this->repository->getModel('account_attribute_mapping'));
        $existing_aids = $collection->getAttributeIds($groupId, $collection);
        $locations_ids = array_unique($data["locations"] ?? []);
        $trades_ids    = array_unique($data["trades"] ?? []);
        $new_ids       = array_unique(array_diff(array_merge($locations_ids, $trades_ids), $existing_aids));
        $delete_ids    = array_diff($existing_aids, array_merge($locations_ids, $trades_ids));

        if($delete_ids) {
            foreach ($delete_ids as $attribute_id) {
                $this->repository->getModel('account_attribute_mapping')->deleteWhere([
                    'account_id' => $accountId,
                    'group_id' => $groupId,
                    'attribute_id' => $attribute_id,
                ]);
            }
        }

        if($new_ids) {
            foreach ($new_ids as $attribute_id) {
                $this->repository->getModel('account_attribute_mapping')->save([
                    'account_id'   => $accountId,
                    'group_id'     => $groupId,
                    'attribute_id' => $attribute_id,
                ]);
            }
        }
        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deleteMapping(Request $request, Response $response, array $args): Response
    {
        $this->repository->getModel('account_attribute_mapping')->deleteWhere(
            [
                'account_id'   => (int)$args['parent_id'],
                'group_id'     => (int)$args['group_id'],
                'attribute_id' => (int)$args['id'],
            ]
        );
        return $this->noContent($response);
    }
}
