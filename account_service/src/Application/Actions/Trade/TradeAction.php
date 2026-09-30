<?php
    declare(strict_types=1);

    namespace App\Application\Actions\Trade;

    use Psr\Http\Message\ResponseInterface as Response;
    use Psr\Http\Message\ServerRequestInterface as Request;
    use Psr\Log\LoggerInterface;

    use App\Application\Actions\Action;
    use App\Application\Actions\ActionPayload;
    use App\Domain\Trade\TradeRepository;

    /**
     * Class TradeAction
     * @package App\Application\Actions\Trade
     */
    class TradeAction extends Action
    {
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
            $this->repository = new TradeRepository();
        }

      /**
       * @param Request $request
       * @param Response $response
       * @param array $args
       * @return Response
       * @throws \Exception
       */
        public function deleteById(Request $request, Response $response, array $args): Response
        {
          $this->repository->getModel('tradeCategoryMapping')->deleteWhere(['trade_id' => (int) $args["id"]]);
          $this->repository->getModel()->delete((int) $args["id"]);
          return $this->noContent($response);
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         * @throws \Exception
         */
        public function getTradeGroup(Request $request, Response $response, array $args): Response
        {
          $trades = $this->repository->getTradeGroup(["type_id" => (int) $args["type"]]);
          return $this->respond($response,new ActionPayload(200, $trades));
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         */
        public function getTrades(Request $request, Response $response, array $args): Response
        {
            return $this->listByModel($response, "tradeMapping", [
                'account_id' => (int)$args['id']
            ], true);
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         * @throws \App\Domain\DomainException
         * @throws \ReflectionException
         */
        public function updateTrades(Request $request, Response $response, array $args): Response
        {
            $this->repository->getModel('tradeMapping')->deleteWhere(['account_id' => (int) $args["id"]]);
            foreach($this->getData() as $trade){
                $this->repository->getModel("tradeMapping")->save(['account_id' => (int)$args['id'], 'trade_id' => (int)$trade]);
            }
            return $this->noContent($response);
        }

        /**
         * @param Request $request
         * @param Response $response
         * @param array $args
         * @return Response
         */
        public function listtAll(Request $request, Response $response, array $args): Response
        {
            return $this->listByModel($response, "tradeMapping", [
                'account_id' => (int)$args['id']
            ]);
        }

    }
