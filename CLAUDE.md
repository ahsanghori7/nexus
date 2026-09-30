# CLAUDE.md

Guidance for working in the **Nexus** monorepo — the Construction Link (C-LINK) platform. This file covers system architecture, API communication workflow, commands, and operational references.

## The big picture

Nexus is one repo holding the whole platform: 3 backend microservices, 2 PHP projects the frontends call into (`app.c-link` and `framework`), and a React V2 frontend.

### The components

| Component | Role | Stack |
| --- | --- | --- |
| `account_service/` | Accounts, users, auth/sessions, roles, permissions, features | PHP 8 + **Slim 4** + RedBeanPHP/PDO |
| `project_service/` | Projects, BoQ, tenders, transactions, approvals, milestones | PHP 8 + Slim 4 + Illuminate DB + AWS |
| `document_service/` | Document/file ingestion, S3, templates, signatories | PHP 8 + Slim 4 + AWS SDK |
| `app.c-link/` | Legacy contractor portal; exposes a **`/relay`** endpoint that frontends call, then forwards to the microservices | PHP, custom bootstrap |
| `framework/` | Session-aware gateway that mounts multiple apps (admin, prosper, supply_chain, …); its own **relay** forwards frontend calls to the microservices | PHP 8, custom core (`src/core`) |
| `react-service/` | React 17 + Redux Toolkit + MUI frontend | pnpm + webpack |
| `document-creator/` | JSON templates + CLI that renders PDFs | PHP CLI |

The two "projects called from the frontend" are **`app.c-link`** and **`framework`** — both sit in front of the three microservices and never expose them to the browser directly.

---

## API communication workflow (read this first)

There are **three layers** to understand. Knowing which one a feature lives in is the key to navigating the code.

### Layer 1 — microservices: how an API is *defined*

Each service is a **Slim 4** app with an identical layout. A request flows:

```
public/index.php → app/middleware.php (TokenMiddleware) → app/routes.php
  → src/Application/Actions/<Resource>/<Resource>Action.php
  → src/Domain/<Resource>/<Resource>Repository.php
  → src/Domain/<Resource>/<Resource>.php (model, RedBeanPHP)
  → MySQL → JSON (ActionPayload: { statusCode, data })
```

- **Routes live in `app/routes.php`** — [account_service/app/routes.php](account_service/app/routes.php), [project_service/app/routes.php](project_service/app/routes.php), [document_service/app/routes.php](document_service/app/routes.php). Some also have `app/v2/routes.php`. Routes are grouped, versioned, regex-constrained, and mapped to an Action method.
- **Bootstrap order** (`public/index.php`): `settings.php` → `connections.php` → `dependencies.php` (PHP-DI) → `repositories.php` → `middleware.php` → `routes.php`.
- **Auth between services** is a shared API token (`TokenMiddleware`, `src/Application/Middleware/TokenMiddleware.php`) via the `api_token` header/query param, toggled by `API_TOKEN_ENABLED`. **No JWT/OAuth** between services.
- The three services are structurally near-identical — patterns learned in one transfer to the others.

### Layer 2 — `app.c-link` relay: `/relay?action=…&method=…`

Frontends hit a **single relay endpoint** on app.c-link, e.g.:

```
http://app.c-link.local/relay?action=sow&method=fetch&did=77570
```

This is dispatched entirely by **[app.c-link/app/controllers/RelayController.php](app.c-link/app/controllers/RelayController.php)**:

1. **`action` → Api client class.** The `$actions` map in `RelayController` resolves the `action` query param to a class under [app.c-link/app/Api/](app.c-link/app/Api/) — e.g. `"sow" => Sow::class`, `"account" => Account::class`, `"project" => Project::class`, `"document" => Document::class`, … (~30 entries).
2. **`method` → a whitelisted method on that class.** Each Api class declares a static `$security` (returned by `getSecurity()`) mapping each callable method to its HTTP verb, `requires_session`, `required_args` (type-coerced from the query), and `pre_checks` (static methods run before the action). See [app.c-link/app/Api/Document/Sow.php](app.c-link/app/Api/Document/Sow.php) for the shape.
3. **`RelayController::index()`** validates the relay, extracts/validates args, enforces session + runs `pre_checks`, then dispatches to `$cls::$method($request, $user, $args)`. `pre_checks` (e.g. `Sow::loadSow`) often **call the microservice themselves** to load entities into `$args` first.
4. **The Api method talks to the microservice** through the HTTP client base class **[app.c-link/app/Api/Client.php](app.c-link/app/Api/Client.php)** via `self::get/post/patch(...)` — e.g. `self::get("document/{id}/children", [...])`. Base URLs are keyed by service in [app.c-link/app/config/config.php](app.c-link/app/config/config.php) (`'api' => ['account'|'project'|'document' => ['url' => …]]`), fed by `.env` (`ACCOUNT_SERVICE_URL`, etc., e.g. `http://account_service/v1/`). It returns a `JsonResponse` (or a forward/redirect), which `index()` emits.

**To add an app.c-link relay endpoint:** add/extend the Api class in `app/Api/`, declare the method in its `$security["methods"]` (verb, `requires_session`, `required_args`, `pre_checks`), register the class in `RelayController::$actions` if new, and have the method call `Client` to reach the service.

### Layer 3 — `framework` relay: the **`"key"` in `*.v1.php`** files

The React apps the framework mounts (admin, prosper, …) call the framework's own relay, and the framework forwards to the microservices. Each endpoint is identified by a **`"key"`** (a regex matched against the path) inside **`*.v1.php` route-config files**:

- **The v1 files** live in [framework/src/admin/config/routes/relay/](framework/src/admin/config/routes/relay/) and [framework/src/prosper/config/routes/relay/](framework/src/prosper/config/routes/relay/) (`account.v1.php`, `project.v1.php`, `tender.v1.php`, …). Each returns a group `key` plus `actions`, each action having its own `key` (regex), `method`, and `middleware` chain; registered via `config/relay.php`.
- **Matching**: [Router.php](framework/src/core/code/Router.php) `matchRoute()` walks the groups and matches each route/action `key`. **Forwarding**: the `Relay` middleware (`passthru()`/`resourceByKey()`) calls the service from `Core\Service\Manager` — a `RestService` whose URL + token come from `core/config/global.php` (`ACCOUNT_SERVICE_URL`, etc.). `public/index.php` selects the app via `$_SERVER["APP"]`.

**To add a framework relay endpoint:** add an `action` with a new `"key"` (+ `method` + `middleware`) to the relevant `*.v1.php` file; use `Relay::passthru`/`resourceByKey` to forward to a service, or custom middleware.

> **Mental model:** *`routes.php` in a service = where an API is **defined**. app.c-link `/relay?action=&method=` (RelayController + `Api/*` `$security`) and framework `/relay` (`*.v1.php` `"key"`s) = the two gateways through which frontends **reach** those services.*

---

## Commands

Run everything through the root [makefile](makefile) (`make help` for the full list).

### Docker (backend)
```bash
make docker_up             # build & start all backend containers
make docker_down
make docker_restart        # down + up
```

### DB (Phinx)
```bash
make db_migrate_all
make db_reset_all                                          # wipe + remigrate all DBs (destructive)
make db_new_migration service=project_service name=AddFooTable
make db_account_rollback                                   # also db_project_rollback / db_document_rollback
make db_diagram service=account_service                    # SchemaSpy → <service>/db/schema_diagrams/
docker exec -t project_service composer db_migrate         # directly inside container
docker exec -t account_service composer db_status
```

### PHP service tests
```bash
# From repo root (runs inside Docker testing containers):
make account_service_unittests          # unit suite + coverage enforcement (≥50%)
make project_service_unittests
make document_service_unittests
```

### React service
```bash
make react_init                          # pnpm install
make react_start                         # pnpm start (webpack-dev-server)
pnpm test                                # Jest (all)
pnpm test --watch                        # watch mode
pnpm test -- --testPathPattern=MyComponent  # single file/pattern
pnpm lint                                # ESLint
pnpm prettier --write src
pnpm run build --env analyzer=true       # webpack-bundle-analyzer
```

**Ports:** account 8081, project 8082, document 8083, app.c-link 8085 (`app.c-link.local`), framework 8086 (`framework.local`), React 3002, MySQL 3306, phpMyAdmin 8100.

---

## PHP Services Architecture

**Layout (identical across all three).** `app/` holds `routes.php` (+ optional `app/v2/routes.php`), `middleware.php`, `dependencies.php` (PHP-DI), `repositories.php`, `settings.php`, `connections.php`. `src/Application/Actions/` has one Action class per resource returning an `ActionPayload { statusCode, data, error, pager }`; `src/Domain/<Entity>/` holds each model + repository; `src/Infrastructure/` holds DB/AWS adapters. Routes use regex-constrained params (`{id:[0-9]+}`).

**Endpoints (route groups).**
- **account_service:** `/v1/account`, `/v1/user`, `/v1/token`(`_history`), `/v1/email`, `/v1/permissions`, `/v1/feature` + `/v1/thresholds`, `/v1/prequalification`.
- **project_service:** `/v1/project`, `/v1/boq`, `/v1/milestone`, `/v1/approvals` + `/v1/order_approver`, `/v1/tender_recommendation`, `/v1/instruction`, `/v2/transaction`.
- **document_service:** `/v1/document`, `/v1/category`, `/v1/template`, `/v2/document` + `/v2/category`.

**Domain layer.** Each service has `AbstractModel` + `AbstractRepository` base classes (plus `AbstractTypedModel`/`AbstractTypeModel` for type & lookup tables). account_service uses RedBeanPHP (`$columns` schema, inline validation, `getDB()::store/load`); project_service and document_service use Eloquent (`illuminate/database` ^10, document_service also uses the AWS SDK for S3). Repositories carry the non-trivial logic — e.g. `ProjectRepository::summary()` (profit/loss), document `DocumentRepository`/`CategoryRepository` mapping helpers. Key entities: account = `User`, `Token`, `Permission`, `Website`; project = `Project`, `BoQ`, `Milestone`, `Approval`; document = `Document`, `Category`, `Template`, `DocumentSignatory`, plus `CategoryMapping` / `DocumentOwnerMapping` join tables (a document M:N categories and M:N owners).

**Testing.** `tests/Unit/` (no MySQL — `composer test:unit` runs with `SKIP_DB=1` and enforces a 50% coverage floor via `tests/CoverageThreshold.php`) + `tests/Integration/`. DB faking follows the ORM: account_service = hand-written static fakes (`tests/TestDoubles/`); project_/document_service = `getMockBuilder` doubles for Eloquent query builders (document_service also uses inheritance fakes overriding `getModel()` and reflection resets for singletons). project_service Integration bootstraps a real DB via `tests/SetupDatabase.php`.

---

## Framework Architecture

The `framework` is a custom PHP 8 **session gateway** — not Slim, not Laravel.

**Request lifecycle.** `public/index.php` bootstraps config and routes; `Core\Router` matches the first path segment to a route group `key`, then the HTTP method + remaining path to an action (**last matching action wins** — ordering matters). Route then action middleware run as callables that **mutate** a shared `Action` object (no `next()`); the response is built from its `html`/`json` keys. `Core\Middleware\Exception` throws are dispatched via the merged `onError` maps.

**`Core\Data\Shape`** — the universal data container and base of `Action`. API: `get`/`set` (dot-path, `set` invokes custom setters like `setEmail()`), `has`, `getShape`/`setShape` (nested), `modify`/`merge`/`extract`/`append`/`setItems`, `toArray`, typed accessors (`string`/`int`/`getArray`/`json`/`jsonEncode`/`jsonDecode`), and `setMixins()` to intercept `get`/`set` per key.

**Middleware** (`framework/src/core/code/Middleware/`): `Generic` (args/validation/redirects), `Rest` (call backend services), `Session` (token verify + user fetch), `Data`, `Collection`, `Form`, `Validator`, `Conditional` (if/else), `Procedure` (multi-step), `File`, `Exception`, `TemplateLoader`, `Hubspot`, `GoogleMaps`, `Stripe`, and `Service/{Account,User,Feature,Prequalification}Middleware` (fetch from account_service). Catalog: [documentation/middleware-catalog.md](documentation/middleware-catalog.md).

**Apps** live under `framework/src/{admin,clink,prosper,api}/`, each with its own `index.php`, `config/app.php`, `config/routes.php`, `code/Middleware/`. Always read config via `Core\System\Environment::get()` — never hardcode.

---

## React Service Architecture

React 17 + Redux Toolkit + MUI 5 (webpack + pnpm). Source splits into `src/v1/` (legacy feature-per-directory apps, still maintained) and `src/v2/` (modular: `apps/{clink,prosper,admin,shared,widgets}`, `store/reducers/` Redux slices namespaced by app, `services/relay/`, `hooks/`). All API calls go through the single `Relay` client (`src/v2/services/relay/index.js`: `get`/`getJson`/`post`/`patch`/`postForm`/`deleter`; `postForm`/`patchForm` auto-trim emails and append multi-files as `key[]`).

**MUI is mandatory for new V2 components** — no custom CSS frameworks, no duplicating MUI. Design tokens live in theme files at `src/v2/apps/shared/components/muiTheme/` (via the `useTheme(appName)` hook), not inline `sx`. Color constants come from `clink-components` (`CONSTANTS.colors.*`).

---

## Database Migrations (Phinx)

All three services use Phinx; migrations live under `<service>/db/migrations/` with `phinx.php` at the service root. Always run them via the Makefile targets (which wrap `docker exec`) — not `vendor/bin/phinx` directly.

---

## Pre-commit & CI

Pre-commit (`.pre-commit-config.yaml`): file-hygiene hooks (large files, merge markers, EOF, private keys, no direct commits to `develop`/`main`), PHP-CS-Fixer + PHPStan on changed files, plus `check-composer-lock` (composer.json needs a matching lock update) and `check-env-vars` (`scripts/check_env.py`). CI runs service unit tests, migration tests, React Jest/lint, and build/deploy workflows under `.github/workflows/`.

---

## Useful references

- [C-LINK_ROUTE_INVENTORY.md](C-LINK_ROUTE_INVENTORY.md) — inventory of app.c-link relay actions/routes
- [documentation/framework-routing-and-middleware.md](documentation/framework-routing-and-middleware.md) — deep dive on the framework routing/middleware pipeline
- [documentation/middleware-catalog.md](documentation/middleware-catalog.md) — reusable middleware factories (`make framework_middleware_catalog`)
- [documentation/postman/](documentation/postman/) — Postman collections per service API
- [documentation/prosper-enquiries-system.md](documentation/prosper-enquiries-system.md) — Prosper enquiries DB architecture
- Per-component READMEs: [account_service/README.md](account_service/README.md), [project_service/README.md](project_service/README.md), [document_service/README.md](document_service/README.md), [app.c-link/README.md](app.c-link/README.md), [framework/README.md](framework/README.md), [react-service/README.md](react-service/README.md)

---

# Working Conventions

- Follow PSR-12 and use strict typing.
- Ask before making edits or running terminal commands, and wait for explicit approval.
- Don't add new libraries/dependencies or change the DB schema unless requested.
- Codex reviews your output once you're done.
