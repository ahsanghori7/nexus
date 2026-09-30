# Prosper Enquiries System - Database Architecture

> Complete guide to understanding how subcontractors view invitation to tender documents in Prosper

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Database Services](#database-services)
- [Entity Relationships](#entity-relationships)
- [Data Flow](#data-flow)
- [Table Schemas](#table-schemas)
- [API Endpoints](#api-endpoints)
- [Access Control](#access-control)
- [Troubleshooting Guide](#troubleshooting-guide)

## Overview

The Prosper Enquiries system allows subcontractors to view invitation to tender (ITT) documents sent by main contractors. This involves a complex multi-service database architecture spanning three separate microservices:

- **account_service**: User authentication and trade associations
- **project_service**: Projects, tenders, transactions, and tender history
- **document_service**: Document storage, access control, and S3 integration

This document provides a comprehensive understanding of how these services work together to display enquiries on the Prosper enquiries page.

## System Architecture

### Service Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                           │
│                   (Prosper Enquiries Page)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Framework (PHP Gateway)                     │
│                 /relay/v1/history/document API                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ account_service  │ │ project_service  │ │ document_service │
│                  │ │                  │ │                  │
│ • Users          │ │ • Projects       │ │ • Documents      │
│ • Accounts       │ │ • Tenders        │ │ • S3 Storage     │
│ • Trade Mapping  │ │ • Transactions   │ │ • Access Control │
│                  │ │ • History        │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

## Database Services

### account_service
Handles user authentication and account management.

**Key Responsibilities:**
- User login credentials and session management
- Account information and status
- Trade associations (linking accounts to trade types)

### project_service
Manages construction projects and tender workflows.

**Key Responsibilities:**
- Project creation and management
- Tender/package definition
- Subcontractor invitations (transactions)
- Tender history and state tracking
- **Stores enquiry document metadata in JSON**

### document_service
Handles document storage and access control.

**Key Responsibilities:**
- Document metadata and S3 references
- Owner-based access control
- Document-to-tender associations
- AWS S3 integration for file storage

## Entity Relationships

### High-Level Relationship Diagram

```
┌─────────────┐
│   Account   │ (account_service.account)
│  id: 17763  │
└──────┬──────┘
       │
       │ [account_service.trade_mapping]
       ↓
┌─────────────┐
│   Trades    │ (212: Electrical, 220: Plumbing, 415: Carpentry)
└──────┬──────┘
       │
       │ [project_service.package_mapping]
       ↓
┌─────────────┐
│   Tender    │ (project_service.tender)
│ id: 44401   │
└──────┬──────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       │ [transaction]                   │ [tender_history]
       │ (invitation)                    │ (enquiry record)
       ↓                                 ↓
┌─────────────┐                   ┌────────────────┐
│Subcontractor│                   │ tender_history │
│ id: 17763   │                   │ type: 'Enquiry'│
└─────────────┘                   │ specialist_id  │
                                  │ meta: JSON     │
                                  └────────┬───────┘
                                           │
                                           │ [meta.document]
                                           ↓
                                  ┌────────────────┐
                                  │   Document     │ (document_service.document)
                                  │   id: 75278    │
                                  │   s3_key       │
                                  └────────┬───────┘
                                           │
                                           │ [document_owner_mapping]
                                           ↓
                                  ┌────────────────┐
                                  │ Access Control │
                                  │ owner_id       │
                                  └────────────────┘
```

### Critical Relationships

| Relationship | Purpose |
|-------------|---------|
| `account` → `trade_mapping` → `trades` | Defines which trades a subcontractor works in |
| `tender` → `package_mapping` → `trades` | Defines which trade a tender/package belongs to |
| `tender` → `transaction` → `subcontractor` | Tracks which subcontractors are invited to quote |
| `tender` → `tender_history` → `document` | Stores enquiry documents with metadata in JSON |
| `document` → `document_owner_mapping` → `account` | Controls who can download documents |

## Data Flow

### 1. User Authentication Flow

```
User Login
    ↓
account_service.user (email/password validation)
    ↓
account_service.account (verify status=1, active subscription)
    ↓
Create session with account.id (17763)
```

### 2. Enquiries Display Flow

When the Prosper enquiries page loads:

```
GET /relay/v1/history/document
    ↓
1. Extract session.account.id (17763)
    ↓
2. Query account_service.trade_mapping
   → Get trades for account (212, 220, 415)
    ↓
3. Query project_service:
   a. Find tenders via transaction table (WHERE subcontractor_id = 17763)
   b. Filter by trade match (tender.trade_id IN account's trades)
    ↓
4. Query tender_history:
   WHERE specialist_id = 17763
   AND tender_history_type = 'Enquiry'
    ↓
5. Parse meta JSON field to extract document info:
   {
     "document": {
       "id": 75278,
       "name": "tender-doc.pdf",
       "url": "https://clink-pdfs.s3...",
       "type": "enquiry"
     }
   }
    ↓
6. Return array of enquiries with embedded URLs
```

### 3. Document Download Flow

When clicking a document download link:

```
GET /relay/v1/document/75278/download
GET /relay/v1/document/75278/download?inline=true  (for inline display)
    ↓
1. DocumentMiddleware::fetchDocument()
   → Fetch from document_service (id: 75278)
    ↓
2. DocumentMiddleware::checkDocumentOwnershipById()
   → Query document_owner_mapping
   → Verify owner_id matches session.account.id
   → FAIL if no match (403 Forbidden)
    ↓
3. DocumentMiddleware::downloadDocument()
   → Determine S3 bucket based on document.type
   → contractual (type=2) → 'pdf' bucket
   → other types → 'asset' bucket
   → Download from S3 using s3_key
   → Save to temp file
    ↓
4. DocumentMiddleware::outputDocument()
   → Check inline query parameter
   → For PDF with inline=true:
      • Content-Type: application/pdf
      • Content-Disposition: inline (opens in browser)
   → Otherwise:
      • Content-Type: application/octet-stream
      • Content-Disposition: attachment (downloads file)
   → Stream file to browser
   → Clean up temp file
```

## Table Schemas

### account_service

#### account
Stores account information for both main contractors and subcontractors.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key (e.g., 17763) |
| `name` | varchar(255) | Account/company name |
| `status` | tinyint | 0=inactive, 1=active |
| `subscription` | varchar(50) | Subscription tier |
| `created_at` | datetime | Account creation timestamp |

**Key Points:**
- `status=1` required for active accounts
- Subcontractor accounts have specific subscription types

#### user
User credentials and profile linked to accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key (user_id: 16458) |
| `account_id` | int | FK → account.id |
| `email` | varchar(255) | Login email (unique) |
| `password` | varchar(255) | Argon2id hashed password |
| `display_name` | varchar(255) | User's full name |
| `created_at` | datetime | User creation timestamp |

**Key Points:**
- Each user belongs to one account
- Passwords use Argon2id hashing
- Email must be unique across system

#### trade_mapping
Links accounts to the trades they operate in.

| Column | Type | Description |
|--------|------|-------------|
| `account_id` | int | FK → account.id |
| `trade_id` | int | FK → trade.id |

**Example Trades:**
- `212` = Electrical Installation
- `220` = Plumbing & Heating
- `415` = Carpentry & Joinery

**Key Points:**
- Many-to-many relationship
- Determines which enquiries a subcontractor sees
- Must match with `package_mapping` for tender visibility

### project_service

#### project
Construction projects created by main contractors.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key (23903) |
| `group_id` | int | Main contractor's account_id |
| `name` | varchar(255) | Project name |
| `slug` | varchar(255) | URL-friendly identifier |
| `status` | varchar(50) | Project status |
| `created_at` | datetime | Project creation timestamp |

**Key Points:**
- `group_id` links to main contractor account
- One project contains many tenders/packages

#### tender
Packages within projects (work packages to bid on).

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key (44401) |
| `project_id` | int | FK → project.id |
| `label` | varchar(255) | Package name/description |
| `is_custom` | tinyint(1) | Whether tender is custom |
| `size` | int | Package value in pence |
| `service` | int | Service type |
| `send_date` | date | Date tender was sent |
| `tender_return` | varchar(20) | Return date |
| `start_on_site` | varchar(20) | Start date on site |
| `created_at` | datetime | Tender creation timestamp |

**Key Points:**
- **No trade_id column** - trade association is ONLY through package_mapping table
- `size` stored as integer (pence), not string
- One tender can have multiple subcontractor invitations
- Trade matching uses package_mapping.package_id

#### package_mapping
Maps tenders to trade types (allows multiple trades per tender).

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key |
| `package_id` | int | Trade ID (FK → trade.id in account_service) |
| `tender_id` | int | FK → tender.id |

**Key Points:**
- `package_id` IS the trade_id - directly contains the trade identifier
- Enables cross-matching with account trade_mapping
- Critical for filtering which enquiries a subcontractor sees
- A tender can have multiple package_mapping entries for different trades

#### transaction
Represents invitations sent to subcontractors.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key |
| `tender_id` | int | FK → tender.id |
| `subcontractor_id` | int | FK → account.id |
| `status` | varchar(50) | Transaction status |
| `created_at` | datetime | Invitation timestamp |

**Key Points:**
- Links subcontractors to specific tenders
- Required for a subcontractor to see the tender
- Multiple transactions per tender = multiple invited subs

#### tender_history
**THE MOST CRITICAL TABLE** - Stores all tender state changes and enquiry documents.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key (143255) |
| `tender_id` | int | FK → tender.id |
| `specialist_id` | int | Subcontractor account_id |
| `tender_history_type` | enum | 'Order', 'Interest', 'Quote', **'Enquiry'**, 'Awarded' |
| `status_id` | int | FK → tender_history_type.id |
| `author_id` | int | User who created this record |
| `meta` | longtext | **JSON containing document info** |
| `created_at` | datetime | Record creation timestamp |

**Critical `meta` JSON Structure for Enquiries:**
```json
{
  "document": {
    "17446": {
      "id": 75190,
      "name": "Data-Project-Archaeologist-08-01-2024.pdf",
      "url": "https://clink-pdfs.s3.eu-west-2.amazonaws.com/production/contractual/enquiries/75190/Data-Project-Archaeologist-08-01-2024.pdf",
      "path": "production/contractual/enquiries/75190/Data-Project-Archaeologist-08-01-2024.pdf",
      "is_tender_addendum": false
    }
  },
  "enquiry": 75188,
  "email_sent_to": null
}
```

**Key Points:**
- `tender_history_type = 'Enquiry'` identifies invitation to tender documents
- `specialist_id` must match logged-in subcontractor's account_id
- **IMPORTANT:** Document is nested under specialist_id key inside "document" object
- `meta` field contains the complete document information including download URL
- This is the **source of truth** for enquiry documents shown in Prosper
- Document URL in meta can be directly used by frontend
- Additional fields: `enquiry` (document ID from document_service), `email_sent_to`

### document_service

#### document
Document metadata and S3 references.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key (75278) |
| `name` | varchar(255) | Document filename |
| `type` | int | FK → document_type.id (2=contractual) |
| `subtype` | int | FK → document_subtype.id (1=tender_template) |
| `s3_bucket` | varchar(255) | S3 bucket identifier ('asset' → clink-pdfs) |
| `s3_key` | varchar(255) | S3 object key/path |
| `status` | int | Document status |
| `meta` | longtext | Additional JSON metadata |
| `created_at` | datetime | Document creation timestamp |

**Key Points:**
- `type=2` (contractual) used for tender documents
- `s3_bucket='asset'` maps to actual AWS bucket 'clink-pdfs'
- `s3_key` contains the full S3 path to the file

#### document_type
Document classification types.

| id | uid | label |
|----|-----|-------|
| 1 | structural | structural |
| 2 | contractual | contractual |
| 3 | account-documents | Account Documents |

**Key Points:**
- Type 2 (contractual) used for all tender-related documents
- Determines which S3 bucket is used during download

#### document_subtype
More granular document classification.

| id | uid | label |
|----|-----|-------|
| 1 | tender_template | Default Tender Template |
| 3 | tender_asset | Tender Company Asset |
| 5 | custom_tender_asset | Custom Tender Company Asset |

**Key Points:**
- Subtype 1 most common for invitation to tender documents
- Used for categorization and filtering

#### document_owner_mapping
**CRITICAL FOR ACCESS CONTROL** - Defines who can access documents.

| Column | Type | Description |
|--------|------|-------------|
| `owner_id` | int | Account ID (17763) |
| `document_id` | int | FK → document.id |
| `hidden` | int | 0=visible, 1=hidden |

**Key Points:**
- **MUST exist for document download to work**
- `owner_id` must match session account_id
- Missing entry = 403 Forbidden error
- Prevents unauthorized document access

#### tender_mapping
Links documents directly to tenders (alternative reference).

| Column | Type | Description |
|--------|------|-------------|
| `document_id` | int | FK → document.id |
| `tender_id` | int | FK → tender.id |

**Key Points:**
- Provides direct document-to-tender association
- Used alongside tender_history for document discovery

## API Endpoints

### GET /relay/v1/history/document
**Purpose:** Fetch all enquiries for logged-in subcontractor

**Authentication:** Required (session-based)

**Response Structure:**
```json
{
  "data": {
    "enquiry": [
      {
        "id": 75278,
        "tender_id": 44401,
        "received_date": "2025-11-26 16:38:28",
        "document_name": "Tender Document",
        "version": 1,
        "download_link": "https://clink-pdfs.s3.eu-west-2.amazonaws.com/..."
      }
    ],
    "tender_addendum": [],
    "order": []
  }
}
```

**Processing Steps:**
1. Authenticate user and get account_id from session
2. Fetch account's trades from trade_mapping
3. Find all tenders where:
   - Subcontractor is invited (transaction table)
   - Trade matches (package_mapping)
4. Get tender_history records (type='Enquiry', specialist_id=account_id)
5. Parse meta JSON to extract document information
6. Return formatted array

### GET /relay/v1/document/{document_id}/download
**Purpose:** Download or display a specific document

**Authentication:** Required (session-based)

**Parameters:**
- `document_id`: Document ID (e.g., 75278)

**Query Parameters:**
- `inline` (optional): Set to `true` to display PDF inline in browser instead of downloading
  - `?inline=true` - PDF opens in browser with `Content-Type: application/pdf`
  - `?inline=false` or absent - File downloads as `application/octet-stream` (default behavior)
  - **Note:** Only PDF files support inline display; other file types always download

**Process Flow:**
1. **Fetch Document** (DocumentMiddleware::fetchDocument)
   - Query document_service for document metadata
   - Return 404 if document not found

2. **Check Ownership** (DocumentMiddleware::checkDocumentOwnershipById)
   - Query document_owner_mapping
   - Verify owner_id matches session.account.id
   - Return 403 if no match

3. **Download from S3** (DocumentMiddleware::downloadDocument)
   - Determine bucket: type=2 (contractual) → 'pdf', else → 'asset'
   - Fetch file from S3 using s3_key
   - Save to temporary location

4. **Stream to Browser** (DocumentMiddleware::outputDocument)
   - Check `inline` query parameter
   - For PDF with `inline=true`: Set `Content-Type: application/pdf` and `Content-Disposition: inline`
   - Otherwise: Set `Content-Type: application/octet-stream` and `Content-Disposition: attachment`
   - Stream file content
   - Clean up temporary file

**Examples:**
```bash
# Download PDF (default behavior)
GET /relay/v1/document/75278/download

# Display PDF inline in browser (for Prosper enquiries page)
GET /relay/v1/document/75278/download?inline=true
```

**Error Responses:**
- `403 Forbidden`: User doesn't own the document
- `404 Not Found`: Document doesn't exist
- `500 Internal Server Error`: S3 download failed

## Access Control

### Document Ownership Model

The system uses a strict ownership model for document access:

```
┌──────────────────────────────────────────────────────────┐
│                    Document Access Flow                   │
└──────────────────────────────────────────────────────────┘

User requests document download
         ↓
Extract session.account.id (17763)
         ↓
Query: SELECT * FROM document_owner_mapping
       WHERE document_id = 75278
         ↓
Check: Does owner_id = session.account.id?
         ↓
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ↓         ↓
  Allow    Deny (403)
 Download
```

### Creating Access

When creating enquiries, ensure proper access:

```sql
-- 1. Create document record
INSERT INTO document_service.document (name, type, subtype, s3_bucket, s3_key)
VALUES ('tender.pdf', 2, 1, 'asset', 'production/contractual/enquiries/123/tender.pdf');

-- 2. CRITICAL: Add ownership mapping
INSERT INTO document_service.document_owner_mapping (owner_id, document_id)
VALUES (17763, 75278);  -- subcontractor gets access

-- 3. Link to tender
INSERT INTO document_service.tender_mapping (document_id, tender_id)
VALUES (75278, 44401);

-- 4. Create tender_history record with document metadata
INSERT INTO project_service.tender_history
(tender_id, specialist_id, tender_history_type, status_id, meta)
VALUES (
  44401,
  17763,
  'Enquiry',
  1,
  '{"document": {"id": 75278, "name": "tender.pdf", "url": "https://...", "type": "enquiry"}}'
);
```

### Security Considerations

1. **Never skip document_owner_mapping** - Downloads will fail with 403
2. **Verify account status** - Inactive accounts (status=0) cannot access system
3. **Trade matching required** - Subcontractor must have matching trade in trade_mapping
4. **Transaction required** - Must have invitation record in transaction table
5. **S3 bucket isolation** - Production uses separate buckets per environment

## Troubleshooting Guide

### Problem: Enquiries not showing on page

**Symptoms:** Empty enquiry list despite tender_history records existing

**Diagnosis Checklist:**
```sql
-- 1. Verify account is active
SELECT id, name, status, subscription
FROM account_service.account
WHERE id = 17763;
-- Expected: status = 1

-- 2. Check trade associations
SELECT account_id, trade_id
FROM account_service.trade_mapping
WHERE account_id = 17763;
-- Expected: At least one trade (e.g., 212, 220, 415)

-- 3. Verify tender has matching trade
SELECT t.id, t.label, t.trade_id, pm.trade_id as package_trade
FROM project_service.tender t
LEFT JOIN project_service.package_mapping pm ON t.id = pm.tender_id
WHERE t.id = 44401;
-- Expected: trade_id or package_trade matches account's trades

-- 4. Check transaction exists (invitation)
SELECT id, tender_id, subcontractor_id, status
FROM project_service.transaction
WHERE tender_id = 44401 AND subcontractor_id = 17763;
-- Expected: At least one record

-- 5. Verify tender_history record
SELECT id, tender_id, specialist_id, tender_history_type, meta
FROM project_service.tender_history
WHERE tender_id = 44401
  AND specialist_id = 17763
  AND tender_history_type = 'Enquiry';
-- Expected: Record with proper JSON in meta field
```

**Common Causes:**
- Missing trade_mapping entries
- Missing package_mapping entries
- No transaction record (invitation not sent)
- Wrong specialist_id in tender_history
- Malformed JSON in meta field

### Problem: Document download returns 403 Forbidden

**Symptoms:** "You don't have access to the document" error

**Diagnosis:**
```sql
-- Check ownership mapping exists
SELECT owner_id, document_id, hidden
FROM document_service.document_owner_mapping
WHERE document_id = 75278;
-- Expected: owner_id = 17763 (current user's account_id)
```

**Solution:**
```sql
-- Add missing ownership mapping
INSERT INTO document_service.document_owner_mapping (owner_id, document_id, hidden)
VALUES (17763, 75278, 0);
```

### Problem: Document download returns zero bytes

**Symptoms:** Download succeeds but file is empty

**Diagnosis:**
```sql
-- Check S3 configuration
SELECT id, name, type, subtype, s3_bucket, s3_key
FROM document_service.document
WHERE id = 75278;
-- Expected:
-- - s3_bucket = 'asset' (for clink-pdfs bucket)
-- - s3_key = valid path like 'production/contractual/enquiries/...'
-- - type = 2 (contractual)
```

**Common Causes:**
- Invalid s3_key path (file doesn't exist in S3)
- Wrong s3_bucket value
- S3 credentials not configured in document_service
- Network/firewall blocking S3 access

**Solution:**
Use an existing working document's S3 path:
```sql
-- Find working documents
SELECT id, name, s3_bucket, s3_key
FROM document_service.document
WHERE type = 2 AND subtype = 1
  AND s3_key LIKE 'production/contractual/enquiries/%'
LIMIT 5;

-- Copy a working s3_key/bucket to your document
UPDATE document_service.document
SET s3_bucket = 'asset',
    s3_key = 'production/contractual/enquiries/75222/working-document.pdf'
WHERE id = 75278;
```

### Problem: Account inactive error

**Symptoms:** "Account Inactive, please activate via welcome email"

**Solution:**
```sql
UPDATE account_service.account
SET status = 1
WHERE id = 17763;
```

### Problem: TypeError in React - "replaceAll is not a function"

**Symptoms:** Runtime error when loading enquiries page

**Cause:** Database stores tender.size as integer, but React code expects string

**Location:** `react-service/src/v2/store/reducers/common/opportunities/extraReducers.js`

**Solution:**
```javascript
// Convert size to string before calling replaceAll
size: String(tender.size || '').replaceAll('£', i18next.t('currency'))
```

## Best Practices

### When Creating New Enquiries

1. **Create in order:**
   - Account (if new subcontractor)
   - Trade mappings for account
   - Project
   - Tender with matching trade_id
   - Package mapping (if multiple trades)
   - Transaction (invitation)
   - Document in document_service
   - **Document owner mapping** (critical!)
   - Tender mapping
   - Tender history with meta JSON

2. **Always verify:**
   - Account status = 1 (active)
   - Trade associations exist
   - Transaction exists (invitation)
   - Document owner mapping exists
   - S3 file actually exists at specified path

3. **Use existing patterns:**
   - Copy working tender_history.meta JSON structure
   - Use production S3 paths that already exist
   - Follow naming conventions for consistency

### Database Maintenance

1. **Regular checks:**
   - Orphaned tender_history records (no matching transaction)
   - Documents without owner mappings
   - Malformed JSON in meta fields

2. **Performance considerations:**
   - Index on tender_history.specialist_id
   - Index on document_owner_mapping.owner_id
   - Consider archiving old tender_history records

3. **Data integrity:**
   - Cascade deletes properly configured
   - Foreign key constraints enabled
   - JSON validation before insertion

---

## Quick Reference

### Essential Tables by Service

**account_service:**
- `account` - Account records and status
- `user` - Login credentials
- `trade_mapping` - Account-to-trade associations

**project_service:**
- `project` - Construction projects
- `tender` - Work packages
- `transaction` - Subcontractor invitations
- `package_mapping` - Tender-to-trade mapping
- `tender_history` - **Contains enquiry documents in meta JSON**

**document_service:**
- `document` - File metadata and S3 references
- `document_owner_mapping` - **Access control (critical!)**
- `tender_mapping` - Document-to-tender links

### Key Field Reference

| What | Where | Field |
|------|-------|-------|
| Subcontractor account ID | session / account_service.account | `id` (e.g., 17763) |
| User email | account_service.user | `email` |
| Account active? | account_service.account | `status = 1` |
| Account's trades | account_service.trade_mapping | `trade_id` |
| Tender trade | project_service.tender | `trade_id` |
| Alternative tender trades | project_service.package_mapping | `trade_id` |
| Invitation status | project_service.transaction | `subcontractor_id` |
| Enquiry document | project_service.tender_history | `meta` JSON field |
| Document S3 location | document_service.document | `s3_bucket` + `s3_key` |
| Document access | document_service.document_owner_mapping | `owner_id` |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-27 | Luis Gonzalez | Initial creation - Complete database architecture documentation for Prosper enquiries system. Validated with real data from account 17446 (apophiss2004@yahoo.com). |

**Maintainers:** Development Team


## Test User (Local)

After a clean Prosper DB seed, use this account for end-to-end enquiries testing:

- **User:** apophiss2004@yahoo.com
- **Password:** Clink@1
- Account id: 17446 (has enquiry documents and ownership mappings set)

---
