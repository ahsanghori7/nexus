# Plan My Project API — BoQ package/trade suggestions (AI2-516)

Upload BoQ/pricing spreadsheets for a project; poll for QSAI-suggested package
names + trades per spreadsheet tab. The FE calls the framework `api` app, which
relays to the QSAI `project-plan` API — the C-LINK project id is the key QSAI
stores submissions under, so there is no state on the PHP side.

```
FE ── POST /ai/project-plan/{project_id} (files[]) ──▶ framework api ── POST /api/project-plan ──▶ QSAI
FE ── GET  /ai/project-plan/{project_id} (poll)    ──▶ framework api ── GET  /api/project-plan/{id} ──▶ QSAI
```

Postman: import [postman/Plan_My_Project.postman_collection.json](postman/Plan_My_Project.postman_collection.json)
and [postman/Plan_My_Project.local.postman_environment.json](postman/Plan_My_Project.local.postman_environment.json).

## Endpoints (framework `api` app, host `api.local` locally)

### `POST /ai/project-plan/{project_id}`

- **Auth**: `Authorization: Bearer <session token>`. The session's account must
  be the main contractor owning the project (`project.group_id == account.id`),
  or an administrator. Everyone else: `403`.
- **Body**: `multipart/form-data`, one or more spreadsheets under `files[]`
  (`.xlsx`/`.xls` — validated by QSAI, not by the relay).
- The relay adds `external_project_id` (from the URL), `external_project_name`
  (from the fetched project — client input is ignored) and `external_metadata`
  (session context for QSAI-side audit).
- **Success — `200`** with body `{"id": 123, "status": "PENDING"}` (QSAI
  answers 202; the relay, like the other QSAI relays, passes the body through
  with a 200). Re-submitting creates a new submission; the GET always returns
  the latest.
- **Errors**: `400` invalid/missing files (structured QSAI error), `403` not
  your project, `404 No Project found` bad project id, `422` field validation,
  `429` rate limit (`Retry-After` header), `5xx`/`503` QSAI failure or
  unreachable.

### `GET /ai/project-plan/{project_id}`

Verbatim passthrough of the latest QSAI submission. Poll until terminal.

- `200` with `status`: `PENDING` / `STARTED` (keep polling, includes
  `current_step`/`total_steps`) → `SUCCESS` or `FAILURE` / `UNPROCESSABLE`
  (also `200` — read `user_message`, `error_type`, `can_retry`).
- `404`: no submission exists yet for this project.

**`SUCCESS` result shape** (see `qsai/PLAN_MY_PROJECT_API.md` for the full contract):

```json
{
  "id": 123,
  "status": "SUCCESS",
  "result": {
    "packages": [
      {
        "tab_name": "M&E",
        "package_name": "Mechanical & Electrical",
        "trades": [ { "id": "218", "label": "Mechanical and Electrical Contractor" } ]
      }
    ],
    "ignored_tabs": ["Summary", "Cover"]
  }
}
```

`trades[].id`/`label` come from QSAI's fixed catalogue (~630 canonical trades,
kept in sync with the platform by hand); a package can have `trades: []`.

## Running the whole thing locally

1. **Hosts entries** (once): `api.local` must resolve to `127.0.0.1` (the
   framework container picks the app by `Host` header; the proxy listens on 80).

2. **Nexus**: `make docker_up`.

3. **QSAI**: in the qsai repo run `make dev_up` — the Flask API listens on
   `localhost:5001` (`API_PORT`), and the celery `worker` + `rabbitmq` + `db` +
   `minio-s3` services it needs come up with it. On a fresh qsai DB run its
   migrations too (`docker exec qsai-api-1 alembic upgrade head`) or the GET
   500s instead of 404ing.

4. **Wire framework → QSAI**: run `make ai_setup_qsai` from the nexus root. It
   keeps `PROQUO_SERVICE_URL=http://qsai-router:80` and connects the qsai
   router container to the nexus docker network under that alias, then
   health-checks the link. (The tender-insights backfill step it offers is not
   needed for project-plan.)

5. **Data prerequisites**: a main-contractor user login, and the id of a
   project **owned by that account** (`project.group_id == account.id` — the id
   the FE shows in project URLs). An admin login works for any project.

6. **Postman**: import the collection + environment, fill in `username`,
   `password`, `project_id` → run *Login* → *Submit BoQ documents* (pick a real
   `.xlsx` in the Body tab) → *Get suggestions* until `SUCCESS`.

Equivalent `curl`:

```bash
TOKEN=$(curl -s -X POST http://localhost:8081/v1/user/session \
  -H 'Content-Type: application/json' \
  -d '{"username":"you@example.com","password":"..."}' | jq -r .data.token)

curl -s -X POST "http://api.local/ai/project-plan/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'files[]=@/path/to/boq.xlsx'

curl -s "http://api.local/ai/project-plan/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `401` invalid token | Not logged in / token expired — re-run *Login* |
| `403 You don't have access to the project` | Session account is not the owning MC (and not admin) |
| `404 No Project found` | `project_id` doesn't exist in project_service |
| `404` on GET with a valid project | Nothing submitted yet for that project — run the POST first |
| `503` / "couldn't complete the AI analysis" | Framework can't reach QSAI — check `PROQUO_SERVICE_URL` + that the qsai `api` container is up |
| Submission stuck in `PENDING` | QSAI `worker`/`rabbitmq` containers not running (the pipeline is async) |
