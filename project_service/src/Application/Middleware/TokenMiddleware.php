<?php
    declare(strict_types=1);

    namespace App\Application\Middleware;

    use Psr\Http\Message\ResponseInterface as Response;
    use Psr\Http\Message\ResponseFactoryInterface;
    use Psr\Http\Server\MiddlewareInterface as Middleware;
    use Psr\Http\Message\ServerRequestInterface as Request;
    use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
    use App\Infrastructure\Environment;
    use Slim\Psr7\Factory\ResponseFactory;

    class TokenMiddleware implements Middleware
    {
        /**
         * @var ResponseFactoryInterface
         */
        private $responseFactory;

        public function __construct(?ResponseFactoryInterface $responseFactory = null)
        {
            $this->responseFactory = $responseFactory ?: new ResponseFactory();
        }

        /**
         * @param Request $request
         * @param RequestHandler $handler
         * @return Response
         */
        public function process(Request $request, RequestHandler $handler): Response
        {
            if (Environment::getValue("API_TOKEN_ENABLED", false)) {
                $apiToken = Environment::getValue("API_TOKEN", false);
                if (!$apiToken) {
                    throw new \Exception("Missing Api token in config");
                }

                $token = $this->getTokenFromRequest($request);
                if (!$token) {
                    return $this->responseFactory->createResponse(403);
                } elseif ($token !== $apiToken) {
                    return $this->responseFactory->createResponse(401);
                }
            }
            return $handler->handle($request);
        }

        /**
         * @param Request $request
         * @return false|mixed|string
         */
        public function getTokenFromRequest(Request $request)
        {
            $token = $request->getHeader("api_token");
            if (!$token) {
                $params = $request->getQueryParams();
                $token = $params["api_token"] ?? false;
            } else {
                $token = $token[0];
            }
            return $token;
        }
    }
