<?php

namespace Api\Middleware\Relay;

use Api\Middleware\QsaiMiddleware;
use Api\Middleware\TenderInsightsMiddleware;
use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Manager;

/**
 * Plan My Project relay (AI2-516)
 *
 * What this actually does: BoQ/pricing spreadsheets in → suggested package
 * names + trades per tab out. "Plan My Project" is the FE assistant these
 * suggestions serve, and the name of the QSAI API relayed to
 * (/api/project-plan) — the relay does nothing broader than the above.
 *
 * The C-LINK project id is the external id QSAI keys submissions on, so
 * polling needs no local state.
 */
class ProjectPlanMiddleware
{
    public const QSAI_ENDPOINT = '/api/project-plan';

    /**
     * Submit pricing documents to QSAI for package/trade suggestions.
     *
     * Expects the project to be loaded on the action (ProjectMiddleware::fetchProject)
     * and files uploaded under the multipart field "files[]". File type/count
     * validation is QSAI's responsibility — its structured 400/422 responses
     * flow back through the qsai* error handlers.
     *
     * @return \Closure
     */
    public static function relayToQsai(): \Closure
    {
        return function (Shape $action) {
            $files = $_FILES['files'] ?? [];

            if (empty($files) || empty($files['tmp_name'])) {
                throw new MiddlewareException("qsaiBadRequestError", "No pricing document provided");
            }

            try {
                $payload = [
                    'external_project_id'   => $action->get("uriArgs.project_id"),
                    'external_project_name' => $action->get("project.name"),
                    'external_metadata'     => self::buildExternalMetadata($action),
                ];

                // A multi-file field arrives as one array per attribute
                // (['name' => [...], 'tmp_name' => [...], ...]); a single
                // file without "[]" arrives as scalars.
                $names = is_array($files['tmp_name']) ? $files['name'] : [$files['name']];
                $types = is_array($files['tmp_name']) ? $files['type'] : [$files['type']];
                $tmpNames = is_array($files['tmp_name']) ? $files['tmp_name'] : [$files['tmp_name']];

                foreach ($tmpNames as $i => $tmpName) {
                    $payload["files[{$i}]"] = new \CURLFile(
                        $tmpName,
                        $types[$i],
                        $names[$i]
                    );
                }

                $res = Manager::getService("qsai")->write(self::QSAI_ENDPOINT, new Shape([
                    "data" => $payload,
                    "headers" => [
                        "Content-Type" => "multipart/form-data"
                    ],
                    "options" => [
                        CURLOPT_TIMEOUT => Config::get('qsai.timeout', TenderInsightsMiddleware::QSAI_DEFAULT_TIMEOUT)
                    ]
                ]));

                // Store response for error handler
                $action->set("qsai_response", $res);

                // Handle QSAI response (expects 202, handles all error types)
                QsaiMiddleware::handleTenderAnalysisPostResponse($res, $action);
            } catch (MiddlewareException $e) {
                throw $e;
            } catch (\Exception $e) {
                self::throwRelayError($e, $action, "project-plan-post");
            }
        };
    }

    /**
     * Poll QSAI for the latest project-plan submission of a project.
     *
     * Passes the QSAI body through verbatim: 200 with a status field
     * (PENDING/STARTED/SUCCESS/FAILURE/UNPROCESSABLE); 404 means no
     * submission exists yet for this project.
     *
     * @return \Closure
     */
    public static function fetchFromQsai(): \Closure
    {
        return function (Shape $action) {
            try {
                $res = Manager::getService("qsai")
                    ->fetch(self::QSAI_ENDPOINT . "/" . $action->get("uriArgs.project_id"));

                // Store response for error handler
                $action->set("qsai_response", $res);

                // Handle QSAI response (always returns 200 once a submission exists)
                QsaiMiddleware::handleTenderAnalysisGetResponse($res, $action);
            } catch (MiddlewareException $e) {
                throw $e;
            } catch (\Exception $e) {
                self::throwRelayError($e, $action, "project-plan-get");
            }
        };
    }

    /**
     * Opaque passthrough sent to QSAI for audit/debugging of submissions.
     *
     * @param Shape $action
     * @return string JSON object
     */
    public static function buildExternalMetadata(Shape $action): string
    {
        return json_encode([
            'source'       => 'framework-api',
            'environment'  => Config::get('environment'),
            'account_id'   => $action->get('account.id'),
            'account_name' => $action->get('account.name'),
            'user_id'      => $action->get('user.id'),
            'user_email'   => $action->get('user.email'),
            'project_name' => $action->get('project.name'),
        ]);
    }

    /**
     * Normalise an unexpected relay exception (e.g. RestException, whose
     * message is JSON: {type, url, code, message}) into a qsaiServerError
     * with client-safe response data.
     *
     * @param \Exception $e
     * @param Shape $action
     * @param string $context Label for the server-side log entry
     * @throws MiddlewareException Always
     */
    private static function throwRelayError(\Exception $e, Shape $action, string $context): void
    {
        $raw = json_decode($e->getMessage(), true);
        $raw = is_array($raw) ? $raw : [];
        $code = intval($raw["code"] ?? 500);
        $rawMessage = $raw["message"] ?? "";
        $qsaiResponse = is_array($rawMessage) ? $rawMessage : (json_decode(strval($rawMessage), true) ?? []);
        $qsaiResponse = is_array($qsaiResponse) ? $qsaiResponse : [];
        error_log("QSAI {$context} error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
        $action->setItems([
            "code" => ($code >= 400 && $code < 600) ? $code : 503,
            "qsai_response" => $qsaiResponse,
            "raw_response" => $e->getMessage()
        ]);
        throw new MiddlewareException("qsaiServerError", is_string($rawMessage) ? $rawMessage : "");
    }
}
