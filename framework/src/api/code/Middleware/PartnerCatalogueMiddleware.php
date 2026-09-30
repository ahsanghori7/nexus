<?php

namespace Api\Middleware;

use Api\Util\PartnerAudit;
use Api\Util\PartnerError;
use Api\Util\PartnerResponse;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Router\Route\Action;
use Core\Service\Exception\RestException;
use Core\Service\Manager;
use Core\Util\StructuredLogger;

class PartnerCatalogueMiddleware
{
    const LOG_PREFIX = "PARTNER";
    const ENDPOINT_PROJECTS = "/api/partner/v1/projects";
    const ENTITY_TYPE = "partner_project_catalogue";

    const DEFAULT_PER_PAGE = 100;
    const MAX_PER_PAGE = 200;

    const ALLOWED_FIELDS = ["external_id", "project_code", "project_name", "business_unit"];

    const ALLOWED_BUSINESS_UNIT_FIELDS = ["code", "name"];

    const FIELD_LIMITS = [
        "external_id" => 150,
        "project_code" => 100,
        "project_name" => 150,
    ];

    const BUSINESS_UNIT_LIMITS = [
        "code" => 50,
        "name" => 150,
    ];

    /**
     * @return callable
     */
    public static function listProjects(): callable
    {
        return function (Action $action) {
            $clientId = (int) $action->get("partner.partner_client_id");
            $args = $action->getRoute()->getRequest()->getArgs()->toArray();

            $page = self::positiveIntArg($args, "page", 1);
            $perPage = self::positiveIntArg($args, "per_page", self::DEFAULT_PER_PAGE);
            if ($perPage > self::MAX_PER_PAGE) {
                throw self::validationError(
                    "per_page",
                    "invalid_value",
                    sprintf("The per_page field must not exceed %d", self::MAX_PER_PAGE)
                );
            }

            $params = [
                "api_client_id" => $clientId,
                "limit" => $perPage,
                "offset" => ($page - 1) * $perPage,
            ];
            if (isset($args["business_unit_code"]) && $args["business_unit_code"] !== "") {
                $params["business_unit_code"] = (string) $args["business_unit_code"];
            }
            if (isset($args["linked"]) && $args["linked"] !== "") {
                $params["linked"] = self::boolArg($args, "linked") ? "1" : "0";
            }

            try {
                $res = Manager::getService("project")->fetch("partner_catalogue", $params);
            } catch (\Throwable $e) {
                throw self::serviceFailure("projects", "catalogue list failed", $clientId);
            }

            $data = $res->getShape("data");
            $rows = $data->get("records", []);
            $records = [];
            foreach (is_array($rows) ? $rows : [] as $row) {
                $records[] = self::present((array) $row, true);
            }

            PartnerResponse::emit($action, 200, $records, [
                "page" => $page,
                "per_page" => $perPage,
                "total" => (int) $data->get("total", 0),
            ]);
        };
    }

    /**
     * @return callable
     */
    public static function getProject(): callable
    {
        return function (Action $action) {
            $clientId = (int) $action->get("partner.partner_client_id");
            $externalId = trim((string) $action->get("uriArgs.external_id", ""));
            if ($externalId === "") {
                throw new MiddlewareException("not_found", "Project not found");
            }

            try {
                $res = Manager::getService("project")->fetch(
                    sprintf("partner_catalogue/%s", rawurlencode($externalId)),
                    ["api_client_id" => $clientId]
                );
            } catch (RestException $e) {
                if ((int) $e->getCode() === 404) {
                    throw new MiddlewareException("not_found", "Project not found");
                }
                throw self::serviceFailure("projects", "catalogue fetch failed", $clientId);
            } catch (\Throwable $e) {
                throw self::serviceFailure("projects", "catalogue fetch failed", $clientId);
            }

            PartnerResponse::emit($action, 200, self::present($res->getShape("data")->toArray(), true));
        };
    }

    /**
     * @return callable
     */
    public static function createProject(): callable
    {
        return function (Action $action) {
            $clientId = (int) $action->get("partner.partner_client_id");
            $body = $action->getRoute()->getRequest()->getJson()->toArray();
            $externalId = is_scalar($body["external_id"] ?? null) ? (string) $body["external_id"] : null;

            try {
                $payload = self::validateCreatePayload($body);
                $externalId = $payload["external_id"];

                $mapping = self::resolveBusinessUnit($clientId, $payload["business_unit"]["code"]);

                [$status, $record] = self::store($clientId, (int) ($mapping["id"] ?? 0), $payload);

                if ($status === 409) {
                    throw new MiddlewareException("external_project_conflict", (string) json_encode([
                        "message" => "The external project already exists with different immutable data",
                        "errors" => [[
                            "field" => "external_id",
                            "code" => "external_project_conflict",
                            "message" => "The external_id is already registered with different project metadata",
                        ]],
                    ]));
                }

                if ($status === 400) {
                    throw new MiddlewareException("project_name_exists", (string) json_encode([
                        "message" => "A C-Link project with this name already exists",
                        "errors" => [[
                            "field" => "project_name",
                            "code" => "project_name_exists",
                            "message" => "A C-Link project with this name already exists",
                        ]],
                    ]));
                }

                self::audit($action, $clientId, $body, $externalId, $status, $record["id"] ?? null);
                PartnerResponse::emit($action, $status, self::present($record, false));
            } catch (MiddlewareException $e) {
                self::audit($action, $clientId, $body, $externalId, PartnerError::statusFor($e->getId()), null);
                throw $e;
            }
        };
    }

    /**
     * @return callable
     */
    public static function listBusinessUnits(): callable
    {
        return function (Action $action) {
            $clientId = (int) $action->get("partner.partner_client_id");

            try {
                $res = Manager::getService("account")->fetch(sprintf("api_client/%d/business_unit", $clientId));
            } catch (\Throwable $e) {
                throw self::serviceFailure("business-units", "mapping list failed", $clientId);
            }

            $data = [];
            foreach ($res->getShape("data")->toArray() as $row) {
                $row = (array) $row;
                $data[] = [
                    "external_code" => $row["external_code"] ?? null,
                    "external_name" => $row["external_name"] ?? null,
                    "mapping_status" => ((int) ($row["active"] ?? 0) === 1) ? "mapped" : "inactive",
                ];
            }

            PartnerResponse::emit($action, 200, $data);
        };
    }

    /**
     * @param array $body
     * @return array
     * @throws MiddlewareException
     */
    private static function validateCreatePayload(array $body): array
    {
        if (!$body) {
            throw self::validationError("body", "required", "A JSON request body is required");
        }

        foreach (array_keys($body) as $field) {
            if (!in_array($field, self::ALLOWED_FIELDS, true)) {
                throw self::validationError((string) $field, "unknown_field", "The {$field} field is not permitted");
            }
        }

        $payload = [];
        foreach (self::FIELD_LIMITS as $field => $limit) {
            $payload[$field] = self::requireString($body, $field, $limit);
        }

        $businessUnit = $body["business_unit"] ?? null;
        if (!is_array($businessUnit)) {
            throw self::validationError("business_unit", "required", "The business_unit field is required");
        }
        foreach (array_keys($businessUnit) as $field) {
            if (!in_array($field, self::ALLOWED_BUSINESS_UNIT_FIELDS, true)) {
                throw self::validationError(
                    "business_unit.{$field}",
                    "unknown_field",
                    "The business_unit.{$field} field is not permitted"
                );
            }
        }

        $payload["business_unit"] = [];
        foreach (self::BUSINESS_UNIT_LIMITS as $field => $limit) {
            $payload["business_unit"][$field] = self::requireString($businessUnit, $field, $limit, "business_unit.");
        }

        return $payload;
    }

    /**
     * @param array $source
     * @param string $field
     * @param int $limit
     * @param string $prefix
     * @return string
     * @throws MiddlewareException
     */
    private static function requireString(array $source, string $field, int $limit, string $prefix = ""): string
    {
        $label = $prefix . $field;
        $value = $source[$field] ?? null;

        if (!is_scalar($value) || trim((string) $value) === "") {
            throw self::validationError($label, "required", "The {$label} field is required");
        }

        $value = trim((string) $value);
        if (mb_strlen($value) > $limit) {
            throw self::validationError(
                $label,
                "invalid_value",
                "The {$label} field must not exceed {$limit} characters"
            );
        }

        return $value;
    }

    /**
     * @param int $clientId
     * @param string $code
     * @return array
     * @throws MiddlewareException
     */
    private static function resolveBusinessUnit(int $clientId, string $code): array
    {
        try {
            $res = Manager::getService("account")->fetch(
                sprintf("api_client/%d/business_unit/%s", $clientId, rawurlencode($code))
            );
        } catch (RestException $e) {
            if ((int) $e->getCode() === 404) {
                throw new MiddlewareException("business_unit_not_mapped", (string) json_encode([
                    "message" => "Validation failed",
                    "errors" => [[
                        "field" => "business_unit.code",
                        "code" => "business_unit_not_mapped",
                        "message" => "The business unit is not mapped to a C-Link group",
                    ]],
                ]));
            }
            throw self::serviceFailure("projects", "business unit resolution failed", $clientId);
        } catch (\Throwable $e) {
            throw self::serviceFailure("projects", "business unit resolution failed", $clientId);
        }

        $mapping = $res->getShape("data")->toArray();
        if (empty($mapping["id"])) {
            throw self::serviceFailure("projects", "business unit resolution returned no mapping", $clientId);
        }

        return $mapping;
    }

    /**
     * @param int $clientId
     * @param int $mappingId
     * @param array $payload
     * @return array [status, record]
     * @throws MiddlewareException
     */
    private static function store(int $clientId, int $mappingId, array $payload): array
    {
        try {
            $res = Manager::getService("project")->write("partner_catalogue", new Shape([
                "data" => [
                    "api_client_id" => $clientId,
                    "group_id" => $mappingId,
                    "external_id" => $payload["external_id"],
                    "project_code" => $payload["project_code"],
                    "project_name" => $payload["project_name"],
                    "business_unit_code" => $payload["business_unit"]["code"],
                    "business_unit_name" => $payload["business_unit"]["name"],
                ],
            ]));
        } catch (\Throwable $e) {
            throw self::serviceFailure("projects", "catalogue write failed", $clientId);
        }

        $status = (int) $res->get("info.http_code");
        $decoded = json_decode((string) $res->get("content"), true);
        $record = is_array($decoded) ? ($decoded["data"] ?? null) : null;

        // A 400 carries no record: the project name collides with an existing C-Link project.
        if ($status === 400) {
            return [400, []];
        }

        if (!in_array($status, [200, 201, 409], true) || !is_array($record)) {
            throw self::serviceFailure("projects", "unexpected catalogue write response", $clientId);
        }

        return [$status, $record];
    }

    /**
     * @param array $row
     * @param bool $includeProjectId
     * @return array
     */
    private static function present(array $row, bool $includeProjectId): array
    {
        $data = [
            "external_id" => $row["external_id"] ?? null,
            "project_code" => $row["project_code"] ?? null,
            "project_name" => $row["project_name"] ?? null,
            "business_unit" => [
                "code" => $row["business_unit_code"] ?? null,
                "name" => $row["business_unit_name"] ?? null,
            ],
            "linked" => !empty($row["c_link_project_id"]),
            "created_at" => self::iso8601($row["created_at"] ?? null),
        ];

        if ($includeProjectId) {
            $data["c_link_project_id"] = empty($row["c_link_project_id"])
                ? null
                : (int) $row["c_link_project_id"];
        }

        return $data;
    }

    /**
     * @param mixed $value
     * @return string|null
     */
    private static function iso8601($value): ?string
    {
        if (!is_scalar($value) || (string) $value === "") {
            return null;
        }

        $timestamp = strtotime((string) $value);

        return $timestamp ? gmdate("Y-m-d\TH:i:s\Z", $timestamp) : null;
    }

    /**
     * @param Action $action
     * @param int $clientId
     * @param array $snapshot
     * @param string|null $externalId
     * @param int $status
     * @param mixed $entityId
     * @return void
     */
    private static function audit(
        Action $action,
        int $clientId,
        array $snapshot,
        ?string $externalId,
        int $status,
        $entityId = null
    ): void {
        PartnerAudit::record($clientId, [
            "jti" => $action->get("partner.jti"),
            "method" => "POST",
            "endpoint" => self::ENDPOINT_PROJECTS,
            "entity_type" => self::ENTITY_TYPE,
            "entity_id" => $entityId === null ? null : (int) $entityId,
            "external_id" => $externalId,
            "request_snapshot" => $snapshot,
            "response_code" => $status,
        ]);
    }

    /**
     * @param string $context
     * @param string $message
     * @param int $clientId
     * @return MiddlewareException
     */
    private static function serviceFailure(string $context, string $message, int $clientId): MiddlewareException
    {
        StructuredLogger::log(self::LOG_PREFIX, "ERROR", $context, $message, ["cid" => $clientId]);

        return new MiddlewareException("internal_error", "");
    }

    /**
     * @param array $args
     * @param string $field
     * @param int $default
     * @return int
     * @throws MiddlewareException
     */
    private static function positiveIntArg(array $args, string $field, int $default): int
    {
        if (!isset($args[$field]) || $args[$field] === "") {
            return $default;
        }

        $raw = $args[$field];
        if (!is_numeric($raw) || (int) $raw < 1) {
            throw self::validationError($field, "invalid_value", "The {$field} field must be a positive integer");
        }

        return (int) $raw;
    }

    /**
     * @param array $args
     * @param string $field
     * @return bool
     * @throws MiddlewareException
     */
    private static function boolArg(array $args, string $field): bool
    {
        $raw = strtolower(trim((string) $args[$field]));

        if (in_array($raw, ["true", "1"], true)) {
            return true;
        }
        if (in_array($raw, ["false", "0"], true)) {
            return false;
        }

        throw self::validationError($field, "invalid_value", "The {$field} field must be true or false");
    }

    /**
     * @param string $field
     * @param string $code
     * @param string $message
     * @return MiddlewareException
     */
    private static function validationError(string $field, string $code, string $message): MiddlewareException
    {
        return new MiddlewareException("validation_failed", (string) json_encode([
            "message" => "Validation failed",
            "errors" => [[
                "field" => $field,
                "code" => $code,
                "message" => $message,
            ]],
        ]));
    }
}
