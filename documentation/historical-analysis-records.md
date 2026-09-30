# Historical Analysis Records — Nexus endpoints

> FE integration reference for the Nexus proxy endpoints that surface QSAI's
> historical analyses. Backing tickets: AI2-465, AI2-466, AI2-467 (epic AI2-442).

## Overview

Nexus exposes three read endpoints that let the FE list and view historical
quote-analysis runs — Tender Analysis, Equalization, Tender Levelling — for a
package. All three are thin proxies to QSAI's `clink_analysis` API. Nexus adds
session + project-ownership checks; the response body itself is forwarded
unchanged.

## Endpoints

### 1. List analyses for a package

```
GET /ai/analyses/{package_id}
```

**Query parameters (all optional):**

| Param      | Type    | Notes                                                             |
|------------|---------|-------------------------------------------------------------------|
| `analysis_type` | string  | `tender_analysis` \| `equalization` \| `tender_levelling`. QSAI returns 400 on an invalid enum. |
| `page`     | integer | Default 1 (owned by QSAI).                                        |
| `per_page` | integer | Default 20, max 100 (owned by QSAI).                              |

**Response 200:**

```json
{
  "analyses": [
    {
      "analysis_id": 142,
      "package_id": 7,
      "analysis_type": "tender_analysis",
      "status": "SUCCESS",
      "created_at": "2026-06-18T10:00:00Z",
      "completed_at": "2026-06-18T10:04:12Z",
      "current_step": 8,
      "total_steps": 8,
      "quotes": [
        {
          "id": 501,
          "transaction_id": 12300,
          "quote_external_id": 12345,
          "subcontractor_external_id": 901,
          "file_name": "acme.pdf",
          "subcontractor_name": "Acme"
        }
      ]
    }
  ],
  "page": 1,
  "per_page": 20,
  "total": 1
}
```

**Errors:**

- `404` — no `ClinkPackage` exists for this external `package_id`.
- `400` — invalid `analysis_type` enum.
- `200` with empty `analyses` array — package exists, but no analyses recorded for the filter.

**Note:** list items do **not** include `analysis_results`. For the full analysis
payload, use the detail endpoint below.

### 2. Fetch a specific analysis

```
GET /ai/analyses/{package_id}/{analysis_type}/{analysis_id}
```

Returns the same shape as the existing latest-analysis GET
(`GET /ai/quote_analysis/initiate/{package_id}?type=...`), plus a `quotes`
array with the same fields as the list endpoint's `quotes` items.

**Errors:**

- `404` — package does not exist, **or** the `(package_id, analysis_type, analysis_id)`
  triple does not resolve to an analysis. QSAI validates all three server-side.
- `400` — invalid `analysis_type` enum.

### 3. Export a specific analysis

```
GET /ai/analyses/{package_id}/{analysis_type}/{analysis_id}/export
```

Streams a binary file. Follows the same handling pattern as the existing
`/ai/quote_analysis/export/{package_id}/{format_type}` endpoint:

- `Content-Type` and `Content-Disposition` are forwarded from QSAI.
- `Access-Control-Expose-Headers: Content-Disposition` is set so cross-origin
  browser fetches can read the download filename.

**Errors:** 400 / 404 propagated from QSAI.

## Rendering guidance

### The remote-ID fields

Every quote item in list and detail responses carries:

| Field                       | Type          | Notes                                                                                       |
|-----------------------------|---------------|---------------------------------------------------------------------------------------------|
| `id`                        | int           | QSAI's `ClinkQuotesFile.id`. Internal to QSAI; opaque to Nexus.                             |
| `transaction_id`            | int, nullable | Nexus's `transaction.id` (per-transaction). **May repeat** across multiple items in the same analysis when one Nexus transaction contains multiple files in its ZIP. |
| `quote_external_id`         | int, nullable | Nexus's `transaction_document.id` (per-file). Unique per file within a transaction.         |
| `subcontractor_external_id` | int, nullable | Nexus's `account.id`. See NULL semantics below.                                             |
| `subcontractor_name`        | string        | Always populated (free-text; may be Nexus's meta-derived name for legacy subs).             |
| `file_name`                 | string        | Always populated. Original uploaded filename.                                               |

`transaction_id`, `quote_external_id` and `subcontractor_external_id` are the
FE's hooks for navigating back into Nexus's UI. `transaction_id` is the
grouping key (see below); `quote_external_id` supports per-file deep-links;
`subcontractor_external_id` links to the subcontractor's page. Treat them all
as opaque identifiers — Nexus resolves them on the receiving end.

### NULL fallback semantics

All three remote IDs may be `null`. Distinct meanings:

- **`transaction_id` is `null`** — pre-AI2-465 historical rows only. Backfill
  (AI2-469) will fill these in. Until then: **render whatever's in
  `subcontractor_name` and `file_name` as plain text; skip navigation.**

- **`quote_external_id` is `null`** — the common case today. This field is
  sourced from Nexus's `transaction_document.id`, which is only populated for
  quotes uploaded after PR 6311 (AI2-505). Older quotes and quotes uploaded
  on branches without PR 6311 will always carry `null`. **Skip the per-file
  deep-link.**

- **`subcontractor_external_id` is `null`** — either
  - the quote was uploaded by a **legacy / manual subcontractor** (no row in
    Nexus's `account` table; only the free-text `subcontractor_name` is
    available), or
  - the quote pre-dates AI2-465 rollout and hasn't been backfilled.

  Either way: **render `subcontractor_name` as plain text; skip navigation
  to the subcontractor page.**

### Grouping guidance

One Nexus transaction can carry multiple files (its underlying S3 ZIP contained
N documents), which means:

- The same `transaction_id` may appear on multiple quote items within a single
  analysis.
- Each of those items carries a **distinct** `quote_external_id` — one per file.
- The `quotes` array is **not deduplicated**. QSAI returns one entry per
  `ClinkQuotesFile` row.

**List view (AI2-466):**

Group by `transaction_id`. Display one transaction pill per unique
`transaction_id` with a file-count badge (e.g. "Acme · 3 files"). The list of
`file_name` values within a group is a primary disambiguator between analysis
runs that share subcontractor sets but differ in file revisions — surface it,
don't hide it.

**Detail view (AI2-467):**

Group by `(subcontractor_external_id, transaction_id)`. Multiple files from
one Nexus transaction appear under **one transaction row**, with each
`file_name` listed beneath. This matches Nexus's domain model: a "quote" is
the whole transaction (`transaction.id`); the files inside are its supporting
documents. `quote_external_id` can be used for per-file deep-links inside the
group.

## Data model context (Nexus side)

For reference, the three remote-ID fields originate from:

- `transaction_id` — `transaction.id` in `project_service`. Populated on every
  outbound POST from AI2-465 onwards.
- `quote_external_id` — `transaction_document.id` in `project_service`.
  Populated on every outbound POST **once PR 6311 (AI2-505) has landed on
  main and the epic branch has been rebased**. Until then, Nexus sends this
  field as blank on every POST; QSAI stores `null` and the FE renders per the
  NULL fallback rules above.
- `subcontractor_external_id` — `transaction.subcontractor_id`, an FK into
  `account.id`. Sent as blank (`null` on QSAI's side) when the underlying
  value is `-1`, which is Nexus's sentinel for a legacy / manual subcontractor.

## Rollout & dependencies

- **AI2-465** (outbound POST enrichment) — shipped independently of QSAI.
  On this branch, the POST payload carries `transaction_id` (populated) and
  `quote_external_id` (blank until PR 6311 lands). QSAI accepts the fields as
  optional per AI2-470; AI2-472 will tighten validation to required once Nexus
  rollout is complete across all environments and PR 6311's per-file capture
  is available in production.
- **AI2-466 / AI2-467** (list + detail + export proxies) — depend on QSAI's
  history endpoints (AI2-471). If AI2-471 is not deployed in the target
  environment, both endpoints return `404` from QSAI.
- **Historical data** — rows uploaded before AI2-465 rolled out carry `null`
  for all three remote IDs. AI2-469 covers backfill; until that lands, the FE
  should always render defensively per the NULL fallback rules above.
