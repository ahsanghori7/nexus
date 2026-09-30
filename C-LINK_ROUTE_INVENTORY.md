# Versioning

Taken from develop branch at 19th November 2025

> commit e3b9b4610fa24b588ea731e664f31da8755b42bc (HEAD -> develop, origin/develop, origin/HEAD)
> Merge: d04309f25 f998eb1d8
> Author: alamdar007 <alamdar.mehdi@xynotech.com>
> Date:   Tue Nov 18 18:42:53 2025 +0500
>
>     Merge pull request #3857 from construction-link/bug/CLP-2973/delete-entra-session-after-logout-develop
>
>     Bug/clp 2973/delete entra session after logout develop

# C-Link Route Inventory

Below is an end-to-end catalog of every route, page, and screen declared under `framework/`, `app.c-link/`, and `react-service/`. Each entry lists the path, owning controller/component, source file, and HTTP method (if applicable). Dynamic parameters appear as `:param`.

---

## Dashboard & Authentication

- `/`
  - Controller: `HomeController::index` – `app.c-link/app/controllers/HomeController.php:705` – GET landing/login gate.
- `/login`
  - Controller: `HomeController::login` – `app.c-link/app/controllers/HomeController.php:275` – GET render, POST authenticate.
  - React page: `Login` – `react-service/src/v2/apps/clink/router/v2.jsx:45-55`.
- `/logout`
  - Controller: `HomeController::logout` – `app.c-link/app/controllers/HomeController.php:359` – POST.
- `/reset_password`
  - Controller: `HomeController::reset_password` – `app.c-link/app/controllers/HomeController.php:387` – GET form + POST email send.
- `/new_password`
  - Controller: `HomeController::new_password` – `app.c-link/app/controllers/HomeController.php:437` – GET/POST (token-based).
  - React page: `ResetPassword` – `react-service/src/v2/apps/clink/router/v2.jsx:66-74`.
- `/reset_success` – `HomeController::reset_success` – `app.c-link/app/controllers/HomeController.php:556` – GET.
- `/sign_up` – `HomeController::sign_up` – `app.c-link/app/controllers/HomeController.php:596` – GET/POST onboarding.
- `/sign_up_from_team` – `HomeController::sign_up_from_team` – `app.c-link/app/controllers/HomeController.php:104` – GET/POST invite accept.
- `/sign_up_check` – `HomeController::sign_up_check` – `app.c-link/app/controllers/HomeController.php:196` – GET.
- `/sign_up_success` – `HomeController::sign_up_success` – `app.c-link/app/controllers/HomeController.php:582` – GET.
- `/upgrade_success` – `HomeController::upgrade_success` – `app.c-link/app/controllers/HomeController.php:575` – GET.
- `/free_trial` – `HomeController::free_trial` – `app.c-link/app/controllers/HomeController.php:658` – GET/POST.
- `/pricing` – `HomeController::pricing` – `app.c-link/app/controllers/HomeController.php:700` – GET.
- `/maintenance` – `HomeController::maintenance` – `app.c-link/app/controllers/HomeController.php:589` – GET.
- `/auth` – `HomeController::auth` – `app.c-link/app/controllers/HomeController.php:567` – GET (fallback for SSO).
  - React SSO login: `/auth` → `SosLogin` – `react-service/src/v2/apps/clink/router/v2.jsx:56-64`.
- `/sso_login/:provider` – `HomeController::sso_login` – `app.c-link/app/controllers/HomeController.php:235` – GET redirect.
- `/auto_loader` – `HomeController::auto_loader` – `app.c-link/app/controllers/HomeController.php:710` – GET autologin target.
- `/user_auth` – `HomeController::user_auth` – `app.c-link/app/controllers/HomeController.php` (within same file) – GET API callback.
- `/error_page` – served by both `HomeController::error_page` (`app.c-link/app/controllers/HomeController.php:96`) and `MainContractorController::error_page` (`app.c-link/app/controllers/MainContractorController.php:207`) – GET.

## Main Contractor Dashboard & Project Delivery

All server controllers live in `app.c-link/app/controllers/MainContractorController.php:82-435`; React routes aggregate in `react-service/src/v2/apps/clink/router/index.jsx` (v2 + legacy v1).

- `/main-contractor`
  - Controller: `MainContractorController::index|dashboard` – GET loads React shell.
  - React default route: `${BASE_URLS.CLINK}` root → `Projects` (`react-service/src/v2/apps/clink/router/v2.jsx:77-87`).
- `/main-contractor/add_team`
  - Controller: `MainContractorController::add_team` – GET.
  - React: `TeamManager` wrapped in `Layout` – `react-service/src/v2/apps/clink/router/v2.jsx:89-95`.
- `/main-contractor/profile` (conditional ACL)
  - Controller: `MainContractorController::profile` – GET/POST.
  - React: `UpdateProfile` – `react-service/src/v2/apps/clink/router/v2.jsx:97-104`.
- `/main-contractor/project_dashboard/:slug`
  - Controller: `MainContractorController::project_dashboard` – GET.
  - React: `ProjectDashboardTabs` – `react-service/src/v2/apps/clink/router/v2.jsx:106-113`.
- `/main-contractor/project/:slug/instructions_variations`
  - Controller: `MainContractorController::instructions_variations` – GET.
  - React: `InstructionsVariations` – `react-service/src/v2/apps/clink/router/v2.jsx:115-130`.
- `/main-contractor/project/:slug/ncr`
  - Controller: `MainContractorController::ncr` – GET.
  - React: `NCR` – `react-service/src/v2/apps/clink/router/v2.jsx:133-148`.
- `/main-contractor/project/:slug/forecast_final`
  - Controller: `MainContractorController::forecast_final` – GET.
  - React: `ForecastFinal` – `react-service/src/v2/apps/clink/router/v2.jsx:151-159`.
- `/main-contractor/project/:slug/tender_recommendations` *(flag-dependent)*
  - Controller: `MainContractorController::tender_recommendations` – GET.
  - React: `TenderRecommendations` – `react-service/src/v2/apps/clink/router/v2.jsx:161-179`.
- `/main-contractor/project/:slug/tender_recommendation/:packageId/:recommendationId`
  - Controller: `MainContractorController::tender_recommendation` – GET.
  - React: `TenderRecommendationForm` – `react-service/src/v2/apps/clink/router/v2.jsx:181-197`.
- `/main-contractor/project/:slug/form_instruction`
  - Controller: `MainContractorController::form_instruction` – GET (renders React).
  - React wrapper: `InstructionsWrapper` – `react-service/src/v2/apps/clink/router/InstructionsWrapper.jsx:7-31` (uses `FormInstruction`).
- `/main-contractor/project/:slug/orders`
  - Controller: `MainContractorController::orders` – GET.
  - React: `Orders` – `react-service/src/v2/apps/clink/router/v2.jsx:200-210`.
- `/main-contractor/project/:slug/boq` and `/main-contractor/project/:slug/boq/:tid`
  - Controller: `MainContractorController::boq` – GET.
  - React: `BOQ` – `react-service/src/v2/apps/clink/router/v2.jsx:214-261`.
- `/main-contractor/project/:slug/boq/:tid/tender_analysis[/summary|/quote/:quote_id]`
  - Controller: `MainContractorController::tender_analysis` – GET.
  - React: `TenderAnalysis` – `react-service/src/v2/apps/clink/router/v2.jsx:263-327`.
- `/main-contractor/project/:slug/issue_enquiry`
  - Controller: `MainContractorController::issue_enquiry` – GET.
  - React (legacy v1): `EnquiriesIssued` – `react-service/src/v2/apps/clink/router/v1/index.jsx:121-130`.
- `/main-contractor/project/:slug/quotes_tender`
  - Controller: `MainContractorController::quotes_tender` – GET.
  - React: `QuotesAndTender` – `react-service/src/v2/apps/clink/router/v1/index.jsx:133-142`.
- `/main-contractor/project/:slug/procurement_schedule`
  - Controller: `MainContractorController::procurement_schedule` – GET.
  - React (legacy) `ProcurementSchedule` – `react-service/src/v2/apps/clink/router/v1/index.jsx:71-80`.
- `/main-contractor/project/:slug/edit_project` and `/main-contractor/project/:slug/edit_project/...`
  - Controller: `MainContractorController::edit_project` – GET.
  - React: `PMP` wizard steps – `react-service/src/v2/apps/clink/router/v1/index.jsx:145-189`.
- `/main-contractor/project/:slug/file_manager[/... ]`
  - Controller: `MainContractorController::file_manager` – GET.
  - React: `FileManager` – `react-service/src/v2/apps/clink/router/v1/index.jsx:96-119`.
- `/main-contractor/project/:slug/add_project`
  - Controller: `MainContractorController::add_project` – GET; legacy React handles creation.
- `/main-contractor/project/:slug/project`
  - Controller: `MainContractorController::project($slug, $method, $params)` – `app.c-link/app/controllers/MainContractorController.php:278` – dynamic sub-dispatcher.
- `/main-contractor/project/:slug/project_dashboard`
  - Controller: `project_dashboard` – GET (React stub).
- `/main-contractor/project/:slug/orders/*` – React-driven as above.
- `/main-contractor/draft_orders`
  - Controller: `MainContractorController::draft_orders` – GET – renders `react_app` "draft-orders" (no matching React bundle → **orphaned**).
- `/main-contractor/supply_chain`
  - Controller: `MainContractorController::supply_chain` – GET.
  - React supply-chain page in v1 router: `SupplyChain` – `react-service/src/v2/apps/clink/router/v1/index.jsx:61-68`.
- `/main-contractor/supply_chain/:id`
  - React-only detail view: `SPWrapper` → `SupplyChainProfile` – `react-service/src/v2/apps/clink/router/SPWrapper.jsx:7-44` (reads query `slug`).
- `/main-contractor/back_to_admin` – `MainContractorController::back_to_admin` – GET redirect to `/admin`.
- `/main-contractor/inbox`, `/main-contractor/suggestion`, `/main-contractor/project_dashboard`, `/main-contractor/tender_templates`, `/main-contractor/company_assets`, `/main-contractor/company_assets/*`, `/main-contractor/issue_order`, `/main-contractor/add_project` – all handled by respective controller methods (lines 213-373) and front-end pages described across v1/v2 routers.
- `/cost-planning-tool`
  - Controller: `MainContractorController::cost_planning_tool` – GET renders React or POST handles export – `app.c-link/app/controllers/MainContractorController.php:113-194`.
  - React legacy route: `Layout` placeholder – `react-service/src/v2/apps/clink/router/v1/index.jsx:192-195`.
- `/main-contractor/team_manager` – `MainContractorController::team_manager` – GET – older layout.
- `/main-contractor/project/:slug/issue_order|document_creator|instructions|ncr|boq` etc (see controller) – all share GET endpoints that bring up the React shell; exact pages listed above.
- `/main-contractor/file_manager`, `/main-contractor/document_creator`, `/main-contractor/form_instruction`, `/main-contractor/tender_analysis`, `/main-contractor/forecast_final`, `/main-contractor/orders`, `/main-contractor/issue_enquiry`, `/main-contractor/issue_order`, `/main-contractor/profile`, `/main-contractor/company_assets` – each maps to dedicated method and React component as enumerated.

### Company Assets (frontend-only routes)
Defined in `react-service/src/v2/apps/clink/router/v1/company-assets.jsx:39-183` and served through `MainContractorController::company_assets`.

- `/main-contractor/company-assets` – `CompanyAssets` page.
- `/main-contractor/company-assets/order-templates`
- `/main-contractor/company-assets/letter-of-intent`
- `/main-contractor/company-assets/pre-order`
- `/main-contractor/company-assets/tender-templates`
- `/main-contractor/company-assets/schedule-of-attendances`
- `/main-contractor/company-assets/scope-of-works`
- `/main-contractor/company-assets/scope-of-works/:templateId`

Each path loads `Layout` + respective `Templates`, `Packages`, or `ScopeOfWorksForm` components.

### Document Creator (hybrid PHP + React)

Controllers live in `app.c-link/app/controllers/DocumentCreatorController.php:56-967`; React router in `react-service/src/v2/apps/clink/router/v1/document-creator.jsx:13-75`.

- `/document-creator/template/:templateId/tender/:tenderId` – React `Template` component + `DocumentCreatorController::tender($tid, $type)`.
- `/document-creator/template/:templateId/order/:tenderId` – React + `DocumentCreatorController::order($tid, $did, $sid)`.
- `/document-creator/template/:templateId` – React preview + `DocumentCreatorController::template`.
- `/document-creator/tender_addendum/:tid` – Controller method `tender_addendum` – GET.
- `/document-creator/order/:tid/:did/:sid` – Controller `order` – GET.
- `/document-creator/instruction_preview/:id/:type?` – GET streaming preview.
- `/document-creator/preview/:id/:type?` – `preview` – GET.
- `/document-creator/tender/:id/:type?` – GET preview.
- `/document-creator/instruction/:id/:type?`, `/document-creator/ncr/:id/:type?` – GET.
- `/document-creator/generate` – POST build doc.
- `/document-creator/send` – POST send doc.
- `/document-creator/send_instruction/:id/:type/:label` – POST send instruction.

### Download & Reporting Utilities

Controllers under `app.c-link/app/controllers`.

- `/download` – `DownloadController::index` – GET placeholder.
- `/download/document/:id` – GET – stream stored document.
- `/download/asset/:id` – GET – `DownloadController::asset` – `app.c-link/app/controllers/DownloadController.php:127`.
- `/download/project/:type/:id` – GET – `DownloadController::project` – `app.c-link/app/controllers/DownloadController.php:149`.
- `/download/download_all_queue/:id/:email?` – GET – `DownloadController::download_all_queue` – `app.c-link/app/controllers/DownloadController.php:168`.
- `/download/tender/:type/:id` – GET – `DownloadController::tender` – `app.c-link/app/controllers/DownloadController.php:208`.
- `/download/instruction/:type/:id` – GET – `DownloadController::instruction` – `app.c-link/app/controllers/DownloadController.php:233`.
- `/download/categories/:entity_id/:entityType/:label` – GET – `DownloadController::categories` – `app.c-link/app/controllers/DownloadController.php:258`.
- `/download/category/:id` – GET – `DownloadController::category` – `app.c-link/app/controllers/DownloadController.php:324`.
- `/download/quote/:id/:tid/:sid` – GET – `DownloadController::quote` – `app.c-link/app/controllers/DownloadController.php:371`.
- `/download/boq/:id` & `/download/boq_export/:id` – GET – `DownloadController::boq|boq_export` – `app.c-link/app/controllers/DownloadController.php:392-418`.
- `/download-all/notify_admin/:token`, `/download-all/tender/:type/:id`, `/download-all/instruction/:type/:id`, `/download-all/ncr/:type/:id`, `/download-all/download/:id` – `DownloadAllController` endpoints – `app.c-link/app/controllers/DownloadAllController.php:41-112`.
  - React consumer: `/download-all/tender/categories/:rest` – `react-service/src/v2/apps/clink/router/v2.jsx:331-339`.
- `/reports` – `ReportsController::index` – `app.c-link/app/controllers/ReportsController.php:71`.
- `/reports/quotes/:pid`, `/reports/tender/:pid`, `/reports/order/:pid` – GET – `ReportsController` methods.
- `/reports/supply_chain` – list supply chain stats.
- `/signatory` base plus `/signatory/sign/:id`, `/signatory/request/:token`, `/signatory/redirect/:token`, `/signatory/resend/:id`, `/signatory/download/:id`, `/signatory/notFound` – `SignatoryController` – `app.c-link/app/controllers/SignatoryController.php:62-500`.
- `/relay` – `RelayController::index` – `app.c-link/app/controllers/RelayController.php:224-317` – proxies based on `?action=&method=` query (supports `account`, `project`, `document`, `supply_chain`, etc.).
- `/errors/*` – `ErrorsController` – `app.c-link/app/controllers/ErrorsController.php:11-85`.

## Supply Chain & Assets (legacy + API)

- `/main-contractor/company-assets*` – React + `MainContractorController::company_assets` (see above).
- `/main-contractor/supply_chain` & `/main-contractor/supply_chain/:id` – React wrappers (above).
- `/main-contractor/supply_chain` server call proxies to Supply Chain service APIs below.

### Supply Chain Microservice (`framework/src/supply_chain/config/routes.php`)

Base group `supply_chain` provides HTTP endpoints:

- `GET /supply_chain/supply_chain` – load entire chain (first action key).
- `GET /supply_chain/supply_chain/{id}` – paginated view (key `(?<id>[0-9]{1,7})$`).
- `GET /supply_chain/supply_chain/{id}/total` – summary counts.
- `GET /supply_chain/supply_chain/{id}/get_chain` – load trades mapping.
- `POST /supply_chain/supply_chain/{id}` – create/update subcontractor entry.
- `POST /supply_chain/supply_chain/{id}/{child_id}` – map company to parent.
- `POST /supply_chain/supply_chain/{id}/activation_reminder/{child_id}` – send activation reminder.
- `POST /supply_chain/supply_chain/{id}/pqq_reminder/{child_id}` – send PQQ reminder.
- `POST /supply_chain/supply_chain/{id}/update_status/{child_id}` – update membership status.
- `POST /supply_chain/supply_chain/{id}/rate/{child_id}` – capture rating.
- `GET /supply_chain/trades`, `/supply_chain/regions`, `/supply_chain/types` – metadata endpoints.
(Full middleware stack in `framework/src/supply_chain/config/routes.php:30-557`).

### Account Service Supply Chain APIs (`framework/src/api/config/routes/account/v1.php`)

All endpoints mounted under `/account` group from the API gateway; notable patterns:

- `/account/supply-chain` (GET with query filters) – `key => "^supply-chain"` – `framework/src/api/config/routes/account/v1.php:37`.
- `/account/supply-chain/:subcontractor_id` – GET/PUT – `lines 77 & 385`.
- `/account/supply-chain/:subcontractor_id/users` – GET – `line 424`.
- `/account/supply-chain/:subcontractor_id/user` – POST – `line 448`.
- `/account/supply-chain/:subcontractor_id/user/:user_id` – GET/PATCH – `lines 637 & 658`.
- `/account/supply-chain/:subcontractor_id/user/:user_id/update-main-contact` – POST – `line 671`.
- `/account/supply-chain/:contractor_aid/account/:subcontractor_aid/activate_reminder` – POST – `line 704`.
- `/account/supply-chain/:contractor_aid/account/:subcontractor_aid/pqq_reminder` – POST – `line 791`.

### Public invite routes (`framework/src/api/config/routes/account/public/v1.php`)

- `/public/account/:aid/supply-chain/:token/(accept|decline)` – GET – used in invite emails.

### Company Profile Service (`framework/src/company_profile/config/routes.php`)

Base `/company_profile` group with actions:

- `GET /company_profile/:aid` – load company info.
- `GET /company_profile/:aid/filter_options` – metadata.
- `PATCH /company_profile/:aid/company_information`.
- `PATCH /company_profile/:aid/user_information`.
- `PATCH /company_profile/:aid/oferrings` + `/offerings/trades` + `/offerings/regions`.
- `POST/DELETE /company_profile/:aid/profile_logo` and `/company_logo`.
File: `framework/src/company_profile/config/routes.php:21-205`.

## Orders, Approvals & Documents

### Project API (`framework/src/api/config/routes/project/v1.php`)

Mounted under `/project` in the API gateway; actions include:

- `OPTIONS /. +` – CORS handler (line 70).
- `GET /project/:project_slug` – fetch project (line 77).
- `GET /project/:slug/boq` (line 87) and `GET /project/:slug/:tid/boq` (line 103).
- `GET /project/:id/team` (line 187).
- `POST /project/:id/add_team_member` (line 224).
- `DELETE /project/:id/team_member/:member_id` (line 332).
- `GET /project/getActions` (line 348).
- `POST /project/updateActions` (line 459).

Tender Recommendation extension (`framework/src/api/config/routes/project/tender_recommendation/v1.php`) adds:

- `GET /project/:project_id/tender_recommendation` and `.../:id` (lines 23 & 164).
- `POST /project/:project_id/tender_recommendation/create` (line 276).
- `PATCH /project/:project_id/tender_recommendation/:id` & `/save_as_draft` (lines 335-370).
- `GET /project/:project_id/package/:package_id/quotes` and `/quote/:transaction_id` (lines 434 & 502).
- `POST /project/:project_id/tender_recommendation/:id/report/(generate|pdf|preview)` (lines 544-593).
- `GET /project/:project_id/tender_recommendation/:tr_id/approvers|approvals` (lines 605 & 633).
- `PATCH /project/:project_id/tender_recommendation/:tr_id/approval/:approver_id` (lines 709 & 744).
- `POST /project/:project_id/tender_recommendation/:tr_id/reminder` (line 839).
- `GET /project/:project_id/tender_recommendation/:id/logs` (line 944).

### Order approval helpers

- `/order/:did/approvalReminder` – POST – `framework/src/api/config/routes/order/v1.php:46`.
- `/document/:did/order/approval` – POST – `framework/src/api/config/routes/document/v1.php:214`.

### Document API (`framework/src/api/config/routes/document/v1.php`)

Routes under `/document`:

- `GET /document/download/:did` – `line 64`.
- `GET /document/:did/approvers` – `line 74`.
- `POST /document/:did/order/approval` – `line 214`.
- `POST /document/:did/replace` – `line 365`.

Asite provider hooks (`framework/src/api/config/routes/document/provider/asite/v1.php`):

- `POST /document/provider/asite` and dynamic credential verification entries (lines 12 & 32).

### DownloadAll React entry (covered earlier) ensures parity.

## Supply Chain Procurement Extras

### Enquiries API (`framework/src/api/config/routes/enquiries/v1.php`)

- `OPTIONS /. +` – CORS.
- `POST /enquiries/history/document` – fetch doc history (line 53).
- Default catch-all proxies other enquiry actions.

### Companies API (`framework/src/api/config/routes/companies/v1.php`)

- `OPTIONS /companies/.+` catch-all.
- `GET /companies/company_options/:region_id`.
- `GET /companies/company_exists/:region_id`.

### Attributes API

Public: `/public/attribute`, `/public/attribute/category`, `/public/attribute/category/:category`, `/public/attribute/category/:category/attributes`.
Authenticated: `/attribute` root, `/attribute/category`, `/attribute/category/:category`, `/attribute/category/:category/attributes`, `/attribute/category/:category/group_id/:group_id/attributes`, `/attribute/account/:account_id/map/:subcontractor_id/attributes`, `/attribute/project/:project_id/trade_category/groups` – `framework/src/api/config/routes/attributes/(public/)v1.php`.

### BOQ API (`framework/src/api/config/routes/boq/v1.php`)

- `OPTIONS` handler plus:
- `GET /boq/:slug` and `/boq/:project_id`.
- `GET /boq/units`.
- `GET|POST /boq/entity/:id` (fetch + save).
- `POST /boq/publish/:eid`, `/edit_boq/:eid`, `/republish_boq/:eid`.
- `GET /boq/statuses`.
- `GET /boq/export/:eid`.

### Token, AI & Threshold helpers

- `/token/verify/:token` plus default catch-all – `framework/src/api/config/routes/token/v1.php`.
- `/ai/quote_analysis/initiate/:package_id` (two variants) and `/ai/quote_analysis/export/:package_id/:format_type` – `framework/src/api/config/routes/ai/v1.php`.
- `/threshold/update-permission-threshold` – `framework/src/api/config/routes/threshold/v1.php`.
- `/role/roles-level` – `framework/src/api/config/routes/role/v1.php`.
- `/account-actions/fetch-action` – `framework/src/api/config/routes/action/v1.php`.

## Settings, Team, and Misc

- `/main-contractor/profile` (see above).
- `/main-contractor/team_manager` – `MainContractorController::team_manager` – GET – React page `TeamManager` (adds teams).
- `/main-contractor/add_team` – same component.
- `/main-contractor/project/:slug/team` – API route above handles data.
- `/main-contractor/suggestion` – `MainContractorController::suggestion` – GET React shell (**no React route → orphaned**).
- `/main-contractor/inbox` – `MainContractorController::inbox` – GET; no explicit React route.
- `/main-contractor/project/:slug/project_dashboard` – React tabs (above).
- `/main-contractor/project/:slug/supply_chain` – handled through dynamic `project` method.

## React Legacy (v1) Procurement Routes

All under `${BASE_URLS.PROJECTS}` (`/main-contractor`) via `react-service/src/v2/apps/clink/router/v1/index.jsx` and `CompanyAssets` export.

- `supply_chain` – V1 supply-chain list.
- `project/:slug/procurement_schedule`.
- `project/:slug/tender_templates`.
- `project/:slug/file_manager` and nested folder route.
- `project/:slug/issue_enquiry`.
- `project/:slug/quotes_tender`.
- `project/:slug/edit_project` (and `project-details`, `project-files`, `trades-work-packages`).
- `/cost-planning-tool` – legacy entry point.

## Admin Console (`framework/src/admin` + React admin app)

PHP routes (`framework/src/admin/config/routes.php`):

- `/admin` root redirects to `/admin/login`.
- `/admin/login` (GET index & POST validate).
- `/admin/logout`.
- `/admin/dashboard`, `/admin/projects`, `/admin/contractors`, `/admin/accounts`, `/admin/search`, `/admin/logs`, `/admin/customer_health_score`, `/admin/features`, `/admin/prosper`, `/admin/prosper/dashboard`, `/admin/prosper/supply-chain-dashboard`, `/admin/prosper/supply_chain`, `/admin/company_checks/*` (imports prosper company routes).
- `/admin/admin/info` – JSON user info (line 312).
All non-login routes require session middleware.

React admin router (`react-service/src/v2/apps/admin/router.jsx:27-260`):

- Root `` (index) and `/dashboard` – `Dashboard`.
- `/projects` – `Projects`.
- `/contractors` – `Contractors`.
- `/accounts` – `ClinkAccounts`.
- `/accounts/:accountId` – `DataContent`.
- `/search` – `SearchResults`.
- `/logs` – `Logs`.
- `/customer_health_score` – `CustomerHealthScore`.
- Optional `/features` and `/features/:accountId` when feature flag enabled.
- `${BASE_URLS.ADMIN_PROSPER}` namespace: `index` & `dashboard`, `supply-chain-dashboard`, `accounts`, `accounts/:accountId`, `search`, `supply_chain` – each renders `AdminProsper` pages.

## Prosper Subcontractor Portal

PHP routes (`framework/src/prosper/config/routes.php` + `routes/account.php`):

- `/prosper` root -> redirect to `/prosper/login`.
- `/prosper/logout`.
- `/prosper/social-portal`.
- `/prosper/supply-chain-portal/token/:token` (GET) -> renders supply-chain portal or redirects if already active.
- `/prosper/account` namespace includes:
  - `POST /prosper/account/sign_up`.
  - `GET /prosper/account/activation_resend/:token`.
  - `GET /prosper/account/activate/:token`.
  - `GET/POST /prosper/account/password/reset`.
  - `POST /prosper/account/password/reset` (validate).
  - `GET /prosper/account/password/new/:token`.
  - `POST /prosper/account/password/new`.
  - `GET /prosper/account/payment_request/:plan_id`.
  - `POST /prosper/account/payment_verification`.
  - `GET /prosper/account/auto_loader/:token/redirect=...`.
  - `GET /prosper/account/email/:hash/unsubscribe/:email_id`.
  - `GET /prosper/account/request_login` and `POST /prosper/account/request_login_request`.
  - Additional cron/script routes via `config/routes/script/*.php` (bulk imports, token campaigns) – flagged for ops use.
- `/prosper/company_checks` reuses `framework/src/prosper/config/routes/company.php` for endpoints like `/email_exists/:email`, `/name_exists/:name`, `/search/:name`, `/ch_check/:id`.
- `/prosper/webcomponents` watchers plus `/prosper/inbox` etc.  *(numerous catch-all actions appear as `"key" => ".*"` for SPA rendering).*

React Prosper router (`react-service/src/v2/apps/prosper/router/config/index.jsx`):

- Base `${BASE_URLS.PROSPER}` with nested routes:
  - `/dashboard` (and default index) – `Dashboard`.
  - `/projects` shell – `Projects`.
    - `/projects/find-opportunities`.
    - `/projects/opportunity-viewer`.
    - `/projects/:projectId` – `ViewProjectV3`.
    - `/projects/registered-interests` or `/projects/unlocked-projects` (subscription dependent) – `RegisteredInterests`.
    - `/projects/enquiries`.
    - `/projects/enquiries/submit-quote/:slug` and `/projects/enquiries/submit-quote/:slug/:tid` – `SubmitQuote`.
  - `/my-company/profile` and `/my-company/profile/:parameter` – `MyCompany`.
  - `/my-company/prequalification` – `PrequalificationV2`.
  - `/company_profile/:companyId` and `/company_profile/:companyId/:contactId` – CRM company view.
  - `/change-password`.
  - `/resources` plus `/resources/how-it-works`, `/resources/success-stories`, `/resources/tokens` – resources pages.

## Backend Services & Integrations

### Analytics Service (`framework/src/analytics/config/routes.php`)

- `/analytics/tokens` – GET – returns issued/used summaries.
- `/analytics/tracking` – POST – logs user activity.
- `/analytics/actions` – GET – load tracking actions for filters.
- `/analytics/history` – GET – audit log.

### Cost Planning Tool Service (`framework/src/cost_planning_tool/config/routes.php`)

- `/cost_planning_tool/exist` – GET (checks submissions by email).
- `/cost_planning_tool/submit` – POST (stores CPT submission).

### Email Service (`framework/src/email/config/routes.php`)

- `/email/send` – POST – uses template + user metadata.
- `/email/webhook` – POST – logs open/bounce events & triggers notifications.

### HubSpot Service (`framework/src/hubspot/config/routes.php`)

- `/webhook/award_token` – POST – HubSpot tokens.
- `/hubspot/check_promo_token` – GET – status check.

### Prequalification Service (`framework/src/prequalification/config/routes.php`)

- `/prequalification/:aid/:token?` – GET – load prequal pack.
- `/prequalification/:aid/download/:did` – GET – download file.
- `/prequalification/:aid/reference/:name` – GET – fetch reference doc.
- `/prequalification/:aid/company_profile` – PATCH.
- `/prequalification/:aid/organisation` – PATCH.
- `/prequalification/:aid/turnover` – PATCH.
- `/prequalification/:aid/references` – PATCH.
- `/prequalification/:aid/reference/:id/resend` – POST.
- `/prequalification/:aid/reference/:id` – PATCH.
- `/prequalification/:aid/section/:id` – PATCH.
- `/prequalification/:aid/create_certificate/:section?` – POST.
- `/prequalification/:aid/export_pdf/:token?` – GET.
- `/prequalification/:aid/statuses` – GET.
- `/prequalification/:aid/export_reference/:id` – GET.
- `/prequalification/:aid/section_request` – POST.  *(Full list lines 42-505).*

### Company Checks (shared)

- `/company_checks/email_exists/:email`, `/company_checks/name_exists/:name`, `/company_checks/search/:name`, `/company_checks/ch_check/:id` – `framework/src/prosper/config/routes/company.php` (mounted under both admin & prosper apps).

### API Gateway Public Attribute endpoints (noted above) and `generic index`/`public` groups handle default health-check responses (seen in each config file's `index` route).

## React-only Utility Routes

- `/login`/`/auth`/`/reset-password` – React entrypoints (also have PHP).
- `/download-all/tender/categories/:rest` – `DownloadAll`.
- `${BASE_URLS.COMPANY_ASSETS}` subpaths listed above.
- `${BASE_URLS.DOCUMENT_CREATOR}` subpaths (React).
- Admin + Prosper SPA routes (already documented) rely on backend catch-all `"key" => ".*"` definitions to serve index.html.

## Duplicates, Orphans, & Notable Changes

- **Dual procurement routers**: `react-service/src/v2/apps/clink/router/v2.jsx` (new) and `router/v1/index.jsx` (legacy) both mount under `/main-contractor`. Ensure nav updates both or retire the V1 paths to avoid stale shells.
- **Orphaned PHP methods**: `MainContractorController::draft_orders`, `::suggestion`, and `::inbox` render React apps (`react_app` names `draft-orders`/`clink`) that do not exist in `react-service`. These appear unused.
- **Tender recommendation flows** (React + API) are newer additions compared to earlier documentation—see `/project/:slug/tender_recommendations` (flag `TENDER_RECOMMENDATION`) and the extensive API routes in `framework/src/api/config/routes/project/tender_recommendation/v1.php`.
- **Supply chain reminders** now have dedicated endpoints in both the Supply Chain service and Account API (`activate_reminder`, `pqq_reminder`). Confirm UX doc lists these.
- **Relay endpoints** expose many downstream services off `/relay?action=...`; ensure security hardening since `getRequestedRelay`, `preChecks`, etc. are public methods.
- **DownloadAll** React route `/download-all/tender/categories/:rest` is new and backed by PHP controllers.

This file should serve as the canonical reference for UX/Product audits; any new routes should be appended under the appropriate module with controller/component metadata.
