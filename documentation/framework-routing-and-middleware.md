# Framework Routing & Middleware Pipeline (C-Link / Nexus)

This repository uses a small custom routing system that treats routes as **data** (PHP arrays) and handlers as **middleware pipelines** (lists of callables executed in order). This document explains the full request lifecycle, how route matching works, how middleware chains execute, how errors/responses are produced, and the patterns that are considered “idiomatic” in this codebase.

## Glossary

- **Incoming request**: A `Core\Layer\IncomingInterface` implementation (for API this is HTTP). See `framework/src/core/code/Layer/Http/Incoming.php`.
- **Route group**: A top-level entry registered into `Core\Router` (e.g. `"ai"`, `"account"`, `"project"`). These are loaded via `Core\Router::setRoutes(...)`.
- **Route**: A `Core\Router\Route` object constructed from a route group array (id/key/type/middleware/actions/onError/default_action). See `framework/src/core/code/Router/Route.php`.
- **Action**: A `Core\Router\Route\Action` that represents the matched endpoint (method + action key). It is also the shared data bag passed through middleware. See `framework/src/core/code/Router/Route/Action.php`.
- **Middleware**: Any PHP callable that accepts the `Action` and mutates it. Middleware are executed **sequentially** with no `next()` concept.
- **Shape**: `Core\Data\Shape` is the core “data container” used everywhere, supporting dot-path access like `package.id`. See `framework/src/core/code/Data/Shape.php`.
- **Middleware exception**: `Core\Middleware\Exception` carries an **id** (`getId()`), which is used to select an error handler. See `framework/src/core/code/Middleware/Exception.php`.

## High-level request lifecycle

### 1) App bootstraps routes

Each app’s `index.php` loads config/services, then calls:

- `Core\Router::setRoutes(require_once("config/routes.php"));`

For the API app this is in `framework/src/api/index.php` (see also admin: `framework/src/admin/index.php`).

### 2) Router finds the matching route group + action

Request handling starts at `Core\Router::exec(...)`: `framework/src/core/code/Router.php:69`.

**Step A — match a route group (first path segment):**

- Route matching is done in `Core\Router\Route::match(...)`: `framework/src/core/code/Router/Route.php:61`.
- It compares the request’s first path segment `getPathByIndex(0)` against the route group’s regex pattern (`route["key"]` or the route id).
  - Example: for `/account/supply-chain`, segment `0` is `account`.
- If the regex matches, route-level `rules` (if present) are evaluated next. Each rule is a callable that is invoked as `$rule($request, $route)` and must return `true` for the route to be considered a match. See `framework/src/core/code/Router/Route.php:75`.

**Step B — match an action (method + remaining path):**

- Action matching is done in `Core\Router\Route::matchAction()`: `framework/src/core/code/Router/Route.php:105`.
- It matches:
  - HTTP method (`action["method"]`, default `"GET"`)
  - action regex key (`action["key"]`) against `getPathByIndex(1, -1)` (everything *after* the first segment)
- Named regex captures become `uriArgs.*` on the Action.

Important nuance: `matchAction()` does not “break” when it finds a match; it keeps looping and overwrites `$match`. That means **the last matching action wins**. This makes action ordering significant.

### 3) Middleware pipeline executes

Once an action is chosen, `Action::exec()` runs:

- Route-level middleware first, then action-level middleware.
- Implementation: `framework/src/core/code/Router/Route/Action.php:32` and `:49`.

There is no “return value” chaining. Middleware communicate by reading/writing keys on the shared `Action` object:

- `Action` extends `Shape`, so `get("package.id")` and `set("json", ...)` work via `Shape`.

### 4) Error handling is exception-driven

If middleware throws `Core\Middleware\Exception`, `Core\Router::exec()` catches it and uses the exception id to select an error handler:

- catch: `framework/src/core/code/Router.php:76`
- handler lookup: `Action::getExceptionHandler(...)` merges route/action `onError` arrays: `framework/src/core/code/Router/Route/Action.php:75`

If no handler exists for that id, the router rethrows as a generic exception.

### 5) Response is built from `Action` keys

Finally, the incoming request builds the response object, which for HTTP is `Core\Layer\Http\Incoming\Response`.

- It chooses the response body from the action’s `html` or `json` key and sets `Content-Type` accordingly: `framework/src/core/code/Layer/Http/Incoming/Response.php:14`.
- It sends headers from `action["headers"]` (a map): same file.

## How route files are structured

Route files return a PHP array. At runtime, `Core\Router::setRoutes()` wraps each array into a `Core\Router\Route` object.

### Route group keys you’ll see

Common keys used by the router:

- `type`: request type (usually `"http"` for the API).
- `key`: regex for matching the first path segment.
- `middleware`: array of callables run for *every* action in the group.
- `onError`: mapping `exceptionId => callable($exception, $action)`.
- `default_action`: action config used when no action matches.
- `actions`: list of action configs.

### Action keys you’ll see

- `key`: regex for matching the path after the first segment (`getPathByIndex(1, -1)`).
- `method`: HTTP method (default is `"GET"` if omitted).
- `middleware`: ordered array of callables for the endpoint.
- Optional conventions used across the API:
  - `id`, `description`: documentation/metadata
  - `response_keys`: used by the API app to auto-render JSON (see next section)

## API conventions: `response_keys` and templates

### Auto-render JSON via `response_keys`

The API app registers a global `PostActionMiddleware` hook which builds `action["json"]` when `response_keys` is present:

- `framework/src/api/index.php:26`

This is the most common “framework-style” pattern for API endpoints:

1. Middleware sets keys on the Action (e.g. `collection`, `data`, `info`, etc.).
2. The action declares `response_keys`, and the framework emits JSON automatically.

Best practice: prefer this over manually setting `action["json"]` unless you are proxying opaque content (or returning non-JSON).

### Use route templates instead of re-implementing boilerplate

Templates are registered via `Core\Router\Route\Helper::registerTemplate(...)` and used via `Helper::getTemplate("api", ...)`.

- The API app registers the `"api"` template in `framework/src/api/index.php:10`.
- The template itself is `framework/src/api/code/Route/Template/Api.php`.

The `"api"` template:

- adds standard `onError` handlers (e.g. invalid token, validation errors)
- adds standard route-level middleware:
  - session validation (skips OPTIONS)
  - payload extraction into `action["payload"]` for JSON bodies

Best practice: for normal API route groups, use `Helper::getTemplate("api", $actions, ...)` rather than manually copying session/CORS/error logic.

## Discovering reusable middleware (so you don’t reinvent it)

This codebase has a lot of reusable middleware factories already. The fastest way for a new developer to discover them is:

1. **Start from the catalog**: see `documentation/middleware-catalog.md` (generated list of middleware factories across `framework/src/**/code/Middleware`).
2. **Search by intent** in the codebase:
   - Service calls: `Rest::fetch(` / `Rest::fetchDynamic(` / `Rest::write(`
   - Common helpers: `Generic::set(` / `Generic::collectUrlArguments(` / `Conditional::switched(`
   - Domain helpers: `Api\\Middleware\\*` (e.g. `TenderMiddleware`, `ProjectMiddleware`, `DocumentMiddleware`)
3. **Search for middleware factories by signature**:
   - `rg -n 'public static function .*\\)\\s*:\\s*(callable|Callable|\\\\Closure)' framework/src`

To regenerate the catalog after adding new middleware, run:

- `php scripts/generate_framework_middleware_catalog.php`

If you don’t have PHP locally, run it via Docker:

- `make framework_middleware_catalog`

## Middleware: how to write it well

Middleware is the unit of composition in this framework. Good middleware tends to be:

- **Single-purpose**: one responsibility (load a package, validate access, normalize data, call a service, etc.).
- **Explicit in I/O**:
  - reads well-known keys from the Action (`uriArgs.*`, `payload`, `request_args.*`, etc.)
  - writes well-known keys back to the Action (`package`, `collection`, `json`, etc.)
- **Fail-fast** with `Core\Middleware\Exception` using an id that routes can handle.

### Where data comes from

- `uriArgs.*`: named regex groups from the action key (path params).
- `request_args.*`: query string (`?x=y`) attached by the router: `framework/src/core/code/Router/Route.php:131`.
- JSON body:
  - if you used the `"api"` template: it sets `action["payload"]` (see `framework/src/api/code/Route/Template/Api.php:33`)
  - otherwise: read via `$action->getRoute()->getRequest()->getJson()`
- Session/user data:
  - API routes typically populate `account.*`, `user.*` via the session handler middleware (e.g. `ApiSession::validate()`).

### Control flow rules (important)

- Returning a value from middleware does **not** affect routing or the pipeline.
- The only standard way to stop the chain is to **throw**:
  - `throw new MiddlewareException("someId", "message")`
- If you need branching, use existing helpers (e.g. `Core\Middleware\Conditional`) or write a small branching middleware that calls other middleware internally.

### Prefer reusable middleware factories over inline closures

Inline closures are fine for very small glue steps, but large chunks of logic in route files tend to be hard to test, hard to reuse, and harder to reason about.

Best practice in this repo:

- put reusable logic into a middleware class (e.g. `Api\Middleware\TenderMiddleware`, `Api\Middleware\ProjectMiddleware`)
- keep route files mostly declarative “pipelines”

## Error handling patterns (and a common proxy pattern)

### Standard error ids

Routes/templates commonly handle ids like:

- `authError`, `invalidToken`, `noEntityFound`, `serviceError`, `badRequest`, `tooManyRequests`, etc.

See the default HTTP template in `framework/src/core/code/Router/Route/Template/Http.php`.

### Proxying upstream services (common pattern)

When a route is mostly a proxy to another service, you’ll often see this pattern:

1. Call upstream
2. If upstream HTTP code is not 200:
   - set `action["code"]` and `action["response"]`
   - throw `new MiddlewareException("error")`
3. An `onError["error"]` handler sets the HTTP status and returns the upstream body directly

You’ll see variants of this in route groups that act as a thin façade over another backend. This is intentionally different from the normal `response_keys` pattern because it wants to “bubble up” upstream payloads/status codes.

## Case studies

This section uses established routes as examples of the intended patterns in this repo.

### Case 1 — Template-based REST “fetch + response_keys”: `attributes/v1.php`

Routes in `framework/src/api/config/routes/attributes/v1.php` use the API template (`Helper::getTemplate("api", ...)`) and the `response_keys` convention.

Example endpoint:

- `GET /attribute/category/:category` matches `key => "category\/(?<category>[a-zA-Z_-]+)$"` and captures `uriArgs.category`. See `framework/src/api/config/routes/attributes/v1.php:43`.

Middleware pipeline style:

1. (Optional) small “setup” middleware that sets a derived key (e.g. `region_code`). See `framework/src/api/config/routes/attributes/v1.php:49`.
2. A service call via `Core\Middleware\Rest::fetchDynamic(...)` which:
   - interpolates `{uriArgs.category}` and other `{...}` placeholders from the Action
   - performs the REST fetch and stores the result in a known key (here: `collection`)
   - optionally applies a `postProcessor` to normalize/sort. See `framework/src/api/config/routes/attributes/v1.php:52` and `framework/src/core/code/Middleware/Rest.php:100`.
3. No explicit JSON response middleware is needed because the API app builds JSON from `response_keys` in `framework/src/api/index.php:26`.

Takeaway: keep route files declarative (“set a couple keys, call a service middleware, declare `response_keys`”) and rely on the API template + app-level response rendering.

### Case 2 — Branching with `Conditional` + custom action error handlers: `account/v1.php`

Routes in `framework/src/api/config/routes/account/v1.php` also use `Helper::getTemplate("api", ...)`, but show more complex real-world composition.

Example endpoint:

- `POST /account/supply-chain` matches `key => "^supply-chain"` and uses the template-provided `payload` (JSON body). See `framework/src/api/config/routes/account/v1.php:91`.

Patterns shown here:

- **Payload access**: middleware reads `$a->get("payload")->get("email")` (payload is set by the API template). See `framework/src/api/config/routes/account/v1.php:99`.
- **Service composition**: middleware combines `Rest::fetch(...)`, `AccountMiddleware::*`, and small inline validators.
- **Custom per-action errors**: the action defines an `onError` map for ids like `duplicateSubcontractorEmail` and sets headers/body explicitly. See `framework/src/api/config/routes/account/v1.php:305`.

Takeaway: when you introduce a new custom exception id, add a handler either in the template/route group `onError`, or at least on the action that can throw it.

### Case 3 — Route-level `rules` for “secondary matching”: admin relay routes

Some route groups use `rules` to further constrain a match beyond “first path segment equals X”.

Example:

- `framework/src/admin/config/routes/relay/project.v1.php` declares:
  - `key => "^relay$"` (so the first segment must be `relay`)
  - `rules => [Rest::isResource("project")]` which checks additional path segments (e.g. `/relay/v1/project...`). See `framework/src/admin/config/routes/relay/project.v1.php:12` and `framework/src/core/code/Middleware/Rest.php:214`.

Takeaway: use `rules` when multiple route groups share a prefix and you need a clean, testable way to disambiguate at the route-group level.

## Best practices checklist (for new endpoints)

1. Prefer `Helper::getTemplate("api", ...)` for standard API routes.
2. Prefer `response_keys` over setting `action["json"]` directly (unless you’re proxying opaque upstream responses).
3. Keep middleware small and composable; move heavy logic into middleware classes/services, not route files.
4. Be explicit about data keys (what you read/write) and keep naming consistent across routes.
5. Throw `Core\Middleware\Exception` with an id that your route/template actually handles.
6. Be careful with regex + ordering:
   - action keys match the *remaining path*, not the full path
   - **last matching action wins**, so order actions intentionally
