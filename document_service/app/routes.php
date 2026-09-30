<?php
    declare(strict_types=1);

    use App\Application\Actions\Category\v1\CategoryAction;
    use App\Application\Actions\Category\v2\CategoryAction as CategoryActionV2;
    use App\Application\Actions\Document\v1\DocumentAction;
    use App\Application\Actions\Document\v2\DocumentAction as DocumentActionV2;
    use App\Application\Actions\Instruction\InstructionAction;
    use App\Application\Actions\Document\CertificatesAction;
    use App\Application\Actions\Template\TemplateAction;
    use Psr\Http\Message\ResponseInterface as Response;
    use Psr\Http\Message\ServerRequestInterface as Request;
    use Slim\App;
    use Slim\Interfaces\RouteCollectorProxyInterface as Group;

    return function (App $app) {

        $app->get('/', function (Request $request, Response $response) {
            $response->getBody()->write('OK!');
            return $response;
        });

        /** version 2 endpoints */
        $app->group('/v2/document', function (Group $group) {
            $group->post('', DocumentActionV2::class . ':create');
        });

        $app->group('/v2/category', function (Group $group) {
            $group->get('', CategoryActionV2::class . ':list');
        });


        /** version 1 endpoints */
        $app->group('/v1/template', function (Group $group) {
            $group->get('', TemplateAction::class . ':list');
            $group->get('/{user_id:[0-9]+}', TemplateAction::class . ':listByUser');
            $group->get('/type', TemplateAction::class . ':getTypes');
        });

        $app->group('/v1/document', function (Group $group) {
          $group->get('', DocumentAction::class . ':list');
          $group->get('/type', DocumentAction::class . ':listTypes');
          $group->get('/subtype', DocumentAction::class . ':listSubTypes');
          $group->get('/folder/provider/{provider: [0-9]+}/identifier/{identifier: [\\w-]+(?:,[\\w-]+)*}', DocumentAction::class . ':getProviderFolder');
          $group->get('/type/{type:[0-9]+}/unmapped', DocumentAction::class . ':unmappedDocuments');
          $group->get('/search/{term:.*}', DocumentAction::class . ':search');

          $group->get('/{id:[0-9]+}', DocumentAction::class . ':getById');
          $group->post('', DocumentAction::class . ':create');
          $group->patch('/{id:[0-9]+}', DocumentAction::class . ':updateById');
          $group->delete('/{id:[0-9]+}', DocumentAction::class . ':delete');
          $group->get('/{id:[0-9]+}/owner', DocumentAction::class . ':getOwner');
          $group->patch('/{id:[0-9]+}/owner', DocumentAction::class . ':updateOwner');
          $group->delete('/{id:[0-9]+}/owner', DocumentAction::class . ':removeOwner');

          $group->get('/{id:[0-9]+}/children', DocumentAction::class . ':getChildren');
          $group->get('/{id:[0-9]+}/category', DocumentAction::class . ':getCategories');

          $group->get('/{id:[0-9]+}/signatory', DocumentAction::class . ':getSignatoryByDocumentId');
          $group->get('/envelope/{token:.*}', DocumentAction::class . ':getSignatoryByEnvelopeId');
          $group->post('/{id:[0-9]+}/signatory', DocumentAction::class . ':createSignatory');
          $group->get('/{id:[0-9]+}/signers', DocumentAction::class . ':getSigners');
          $group->get('/{ids:\[[0-9,]+\]}/signers', DocumentAction::class . ':getSignersInGroups');
          $group->post('/{id:[0-9]+}/signatory/signer', DocumentAction::class . ':createSigner');

          $group->post('/{id:[0-9]+}/clone', DocumentAction::class . ':clone');

          /** Tender */
          $group->post('/{id:[0-9]+}/tender', DocumentAction::class . ':createTender');
          $group->delete('/{id:[0-9]+}/tender/{tid:[0-9]+}', DocumentAction::class . ':deleteTenderById');

          /** Constants */
          $group->get('/constants', DocumentAction::class . ':constants');

          /** Request */
          $group->get('/requested', DocumentAction::class . ':requested');
          $group->post('/request', DocumentAction::class . ':createRequest');
          $group->patch('/request/{id:[0-9]+}', DocumentAction::class . ':fullfillRequest');
          $group->get('/request/type', DocumentAction::class . ':listRequestTypes');
          $group->post('/request/mapping', DocumentAction::class . ':mapRequestDocument');

          /** Preq Certificates */
          $group->get('/preq_default_certificates', CertificatesAction::class . ':getDefaultCertificates');
        });


        $app->group('/v1/signatory', function (Group $group) {
            $group->get('', DocumentAction::class . ':getSignatory');
            $group->post('', DocumentAction::class . ':createSignatory');
            $group->post('/{id:[0-9a-z-]+}/signer', DocumentAction::class . ':createSigner');
            $group->patch('/{id:[0-9a-z-]+}/signer', DocumentAction::class . ':updateSigner');
            $group->get('/status', DocumentAction::class . ':getStatus');
        });

        /**
         * Instruction
         */
        $app->group('/v1/instruction', function (Group $group) {
            $group->get('/{id:[0-9]+}', InstructionAction::class . ':getInstructionById');
        });

        $app->group('/v1/category', function (Group $group) {
          $group->get('', CategoryAction::class . ':list');

          $group->post('', CategoryAction::class . ':create');
          $group->post('/default', CategoryAction::class . ':createDefaults');
          $group->get('/{id:[0-9]+}', CategoryAction::class . ':getById');
          $group->patch('/{id:[0-9]+}', CategoryAction::class . ':updateById');

          $group->get('/search/{term:.*}', CategoryAction::class . ':search');

          $group->patch('/{id:[0-9]+}/mapping/clone/{clone:[0-9]+}', CategoryAction::class . ':cloneMapping');

          $group->delete('/entity/{id:[0-9]+}', CategoryAction::class . ':deleteByEntityId');
          $group->delete('/{id:[0-9]+}', CategoryAction::class . ':deleteById');

          $group->get('/{id:[0-9]+}/document', CategoryAction::class . ':documents');
          $group->get('/document/{did:[0-9]+}', CategoryAction::class . ':getDocumentCategories');
          $group->patch('/{id:[0-9]+}/document/{did:[0-9]+}', CategoryAction::class . ':addDocument');
          $group->delete('/{id:[0-9]+}/document/{did:[0-9]+}', CategoryAction::class . ':removeDocument');

          $group->post('/{id:[0-9]+}/document/bulk', CategoryAction::class . ':addBulkDocuments');


          /** Constants */
          $group->get('/constants', CategoryAction::class . ':constants');
        });


    };
