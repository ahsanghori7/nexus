<?php
    declare(strict_types=1);

    namespace App\Application\Actions\Trade;

    use App\Domain\Trade\CategoryRepository;
    use Psr\Http\Message\ResponseInterface as Response;
    use Psr\Http\Message\ServerRequestInterface as Request;
    use Psr\Log\LoggerInterface;

    use App\Application\Actions\Action;
    use App\Application\Actions\ActionPayload;
    use App\Domain\Trade\TradeRepository;

    /**
     * Class TradeAction
     * @package App\Application\Actions\Account
     */
    class CategoryAction extends TradeAction
    {
        /**
         * AccountAction constructor.
         * @param LoggerInterface $logger
         */
        public function __construct(LoggerInterface $logger)
        {
            parent::__construct($logger);
            $this->repository = new CategoryRepository();
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         * @throws \App\Domain\DomainException
         * @throws \ReflectionException
         */
        public function createPackage(Request $request, Response $response, array $args)
        {
          $data = $this->getData();
          if(!$data) {
            $this->badRequest($response);
          }

          $tradeModel = (new TradeRepository())->getModel();
          $category = (new CategoryRepository())->getModel()->load($data["id"]);

          if($category->isLoaded()) {

            $trade = $tradeModel->save([
              'label' => $data['label']
            ]);

            /*
             * Sync the id with the legacy one
             */
              if(method_exists($tradeModel->getDB(), 'exec')) {
                  $tradeModel->getDB()->exec(
                      sprintf('UPDATE %s SET %s = ? WHERE %s = ?', $tradeModel->getName(), $tradeModel::ID_FIELD, $tradeModel::ID_FIELD),
                      [
                          $data['trade_id'],
                          $trade->getId()
                      ]
                  );
              }

            (new TradeRepository())->getModel('tradeCategoryMapping')->save([
              'trade_id' => $data['trade_id'],
              'category_id' => $data["id"]
            ]);
          }

          return $this->respond(
            $response,
            new ActionPayload(200, ['success' => true])
          );

        }
    }
