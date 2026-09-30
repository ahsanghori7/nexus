<?php


use Slim\App;
use Slim\Interfaces\RouteCollectorProxyInterface as Group;

use App\Application\Actions\Account\SupplyChainV2Action;
use App\Application\Actions\Account\AttributeV2Action;


class V2Routes
{
    public static function register(App $app)
    {
        $app->group('/v2/account', function (Group $group) {

            /** Account Supply Chain */
            $group->get('/{account_id:[0-9]+}/supply-chain', SupplyChainV2Action::class . ':getSupplyChain');
            $group->get('/{account_id:[0-9]+}/supply-chain/{group_id:[0-9]+}', SupplyChainV2Action::class . ':getSupplyChainAccount');
            $group->post('/{account_id:[0-9]+}/supply-chain', SupplyChainV2Action::class . ':createSupplyChainAccount');
            $group->patch('/{account_id:[0-9]+}/supply-chain/{group_id:[0-9]+}', SupplyChainV2Action::class . ':updateSupplyChainAccount');
            $group->delete('/{account_id:[0-9]+}/supply-chain/{group_id:[0-9]+}', SupplyChainV2Action::class . ':deleteSupplyChainAccount');


            $group->get('/{account_id:[0-9]+}/supply-chain/{group_id:[0-9]+}/user/{user_id:[0-9]+}', SupplyChainV2Action::class . ':getSupplyChainAccountUserMapping');
            $group->post('/{account_id:[0-9]+}/supply-chain/{group_id:[0-9]+}/user/{user_id:[0-9]+}', SupplyChainV2Action::class . ':createSupplyChainAccountUserMapping');
            $group->patch('/{account_id:[0-9]+}/supply-chain/{group_id:[0-9]+}/user/{user_id:[0-9]+}', SupplyChainV2Action::class . ':updateSupplyChainAccountUserMapping');
            $group->delete('/{account_id:[0-9]+}/supply-chain/{group_id:[0-9]+}/user/{user_id:[0-9]+}', SupplyChainV2Action::class . ':deleteSupplyChainAccountUserMapping');


            $group->get('/{account_id:[0-9]+}/supply-chain/main-contractors', SupplyChainV2Action::class . ':getMainContractorsBySubcontractor');

            /** Account Attribute */
            $group->get('/{parent_id:[0-9]+}/attribute/{group_id:[0-9]+}', AttributeV2Action::class . ':getAttributeMappings');
            $group->get('/{parent_id:[0-9]+}/attribute/{group_id:[0-9]+}/type/{attribute_type}', AttributeV2Action::class . ':getAttributeMappings');
            $group->post('/{parent_id:[0-9]+}/attribute/{group_id:[0-9]+}', AttributeV2Action::class . ':createMapping');
            $group->delete('/{parent_id:[0-9]+}/attribute/{group_id:[0-9]+}/id/{id:[0-9]+}', AttributeV2Action::class . ':deleteMapping');

        });

        /** Attribute */
        $app->group('/v2/attribute', function (Group $group) {
            $group->get('', AttributeV2Action::class . ':getAttributes');

            $group->get('/category', AttributeV2Action::class . ':getAttributesCategory');
            $group->get('/category/values', AttributeV2Action::class . ':getAttributesCategoryValues');

            $group->get('/category/{type:\w+}', AttributeV2Action::class . ':getAttributesCategory');
            $group->get('/category/{type:\w+}/values', AttributeV2Action::class . ':getAttributesCategoryValues');
            $group->get('/category/{type:\w+}/attributes', AttributeV2Action::class . ':getAttributesCategoryAttributes');


            $group->get('/category/{type:\w+}/region/{region_code:\w+}', AttributeV2Action::class . ':getAttributesCategory');
            $group->get('/category/{type:\w+}/region/{region_code:\w+}/values', AttributeV2Action::class . ':getAttributesCategoryValues');
            $group->get('/category/{type:\w+}/region/{region_code:\w+}/attributes', AttributeV2Action::class . ':getAttributesCategoryAttributes');


            $group->get('/category/{type:\w+}/group_id/{group_id:[0-9]+}', AttributeV2Action::class . ':getAttributesCategory');
            $group->get('/category/{type:\w+}/group_id/{group_id:[0-9]+}/values', AttributeV2Action::class . ':getAttributesCategoryValues');
            $group->get('/category/{type:\w+}/group_id/{group_id:[0-9]+}/attributes', AttributeV2Action::class . ':getAttributesCategoryAttributes');

            $group->get('/category/group_id/{group_id:[0-9]+}', AttributeV2Action::class . ':getAttributesCategory');
            $group->get('/category/group_id/{group_id:[0-9]+}/values', AttributeV2Action::class . ':getAttributesCategoryValues');


            $group->get('/type', AttributeV2Action::class . ':getAttributesType');

        });
    }
}
