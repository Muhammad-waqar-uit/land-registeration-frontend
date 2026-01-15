# Projects CRUD (Current Implementation)

Date checked: **2026-01-15**

This document describes how the **Projects** module currently works in the backend (NestJS + TypeORM), including:
- What endpoints exist (CRUD + document upload/verify)
- How authentication/authorization works
- Which **project statuses** exist right now
- How the “connection” pieces work (DB, uploads, IPFS)

---

## 1) API Base Path

The app sets a global prefix:
- Base prefix: `/api`

So the controller path `@Controller('projects')` becomes:
- `/api/projects`

Swagger is available at:
- `/api/docs`

Uploads are served publicly from:
- `/uploads/*` (mounted by `useStaticAssets`)

---

## 2) Authentication & Roles

All project routes are protected by:
- `JwtAuthGuard`
- `RolesGuard`

You must pass a JWT token:
- Header: `Authorization: Bearer <token>`

### Response shapes (important for frontend)

This backend uses:
- A global success wrapper (`TransformInterceptor`) for most endpoints
- A global error wrapper (`HttpExceptionFilter`) for all `HttpException` errors

**Most successful responses** look like:
```json
{ "data": { /* payload */ }, "success": true }
```

**Paginated list responses** (like `GET /api/projects`) return an object that already contains a `data` key, so it is returned as-is (usually without `success: true`):
```json
{ "data": [/* items */], "total": 123, "page": 1, "limit": 10 }
```

**Error responses** look like:
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-01-16T00:00:00.000Z",
  "path": "/api/projects/123",
  "message": "Bad Request",
  "error": "Bad Request"
}
```

Notes:
- `message` can be a string or an array of strings (validation errors).
- `error` may be present (depends on Nest exception type).

Role enforcement:
- **Create project**: Builder only
- **Approve project**: Admin only
- **Upload approval documents**: Builder or Admin
- **Update/Delete**: Owner (builderId matches JWT user) or Admin

---

## 3) Project Statuses (Answer: Now 4 Statuses)

In the database/entity layer the status is an enum:

- `pending_approval` (default for new projects)
- `approved` (admin-approved, lands can be created)
- `active` (project is active with properties)
- `completed` (project finished)

There are **four statuses** in the current codebase.

### Default status on create
When a project is created, it is always created as:
- `status = pending_approval`

**Important**: Builders cannot create properties/lands until the project is approved by an admin.

### Approval workflow
1. Builder creates project → status = `pending_approval`
2. Admin reviews and approves via `PATCH /api/projects/:id/approve` → status = `approved`
3. Builder can now create properties/lands under the approved project
4. Project can transition to `active` or `completed` as needed

### Status rules during update
- Non-admin users **cannot update** projects that are already `completed`.
- Admin users can update regardless of status.
- Projects in `pending_approval` status cannot have lands/properties created.

### Filtering by status
`GET /api/projects` supports `?status=pending_approval`, `?status=approved`, `?status=active`, or `?status=completed`.

---

## 4) Endpoints (CRUD + Documents)

### Frontend integration notes
- All endpoints below are under the `/api` prefix.
- Send `Authorization: Bearer <JWT>`.
- For “Project details with lands”, use `GET /api/projects/:id/properties` (this includes `lands[]`).
- New projects start in `pending_approval`, and **lands cannot be created until an admin approves** the project.
- Land creation also requires `totalUnits >= 1` and the project must not exceed its unit cap.

### 4.1 Create
`POST /api/projects`
- Role: `BUILDER`
- Input: JSON body (or multipart with optional file)
- Creates a Project record in Postgres.
- If `approvalDocuments` file is included, it calls the upload flow after creation.

Body fields (CreateProjectDto):
- `name` (required)
- `location` (required)
- `description` (optional)
- `locationDetails` (optional)
- `totalUnits` (optional, default 0)

Important checks:
- Builder must exist
- Builder must be verified (`isBuilderVerified === true`)

Response notes:
- The created project will have `status = pending_approval`.

### 4.2 List (with filters)
`GET /api/projects`
- Auth required
- Supports query params:
  - `status` (`pending_approval|approved|active|completed`)
  - `builderId` (uuid)
  - `search` (matches name OR location using `ILIKE`)
  - `page` (default 1)
  - `limit` (default 10)

Returns a paginated shape:
- `data`, `total`, `page`, `limit`

### 4.3 Get one
`GET /api/projects/:id`
- Auth required
- Returns a single project by UUID

Frontend note:
- Use the `status` field in this response to know if it is `pending_approval` or `approved`.

### 4.3.1 Get approval + land creation status (recommended for frontend)
`GET /api/projects/:id/approval-status`
- Auth required
- Returns status + gating booleans that match backend rules (`approved` + unit cap)

Example success response:
```json
{
  "data": {
    "projectId": "uuid",
    "status": "approved",
    "isApproved": true,
    "canCreateLands": true,
    "totalUnits": 50,
    "landsCount": 10,
    "remainingUnits": 40
  },
  "success": true
}
```

### 4.4 Get project with properties
`GET /api/projects/:id/properties`
- Auth required
- Returns the project plus its related `lands` (properties)

### 4.5 Update
`PATCH /api/projects/:id`
- Auth required
- Role: Owner (builderId) or Admin
- Input supports JSON and FormData

Updatable fields (UpdateProjectDto):
- `name` (optional)
- `location` (optional)
- `description` (optional)
- `locationDetails` (optional)
- `totalUnits` (optional)
- `status` (optional, must be `pending_approval`, `approved`, `active`, or `completed`)

Validation notes:
- DTO uses `class-validator` and `class-transformer`.
- `status` is validated by `@IsEnum(ProjectStatus)`.

Business rules:
- Non-admin cannot update if current project status is `completed`.

### 4.6 Approve Project (Admin Only)
`PATCH /api/projects/:id/approve`
- Auth required
- Role: **Admin only**
- Changes project status from `pending_approval` to `approved`

Returns:
- Updated project with `status = approved`

Business rules:
- Only admins can approve projects
- Cannot approve projects that are already `approved`
- Cannot approve projects that are `completed`
- Once approved, builders can create lands/properties under the project

Frontend usage:
- Admin dashboard can list pending projects using `GET /api/projects?status=pending_approval`.
- Use `GET /api/projects/:id` or `GET /api/projects/:id/properties` for a detail view before approval.

### 4.7 Delete
`DELETE /api/projects/:id`
- Auth required
- Role: Owner or Admin

Deletion rule:
- Cannot delete a project if it already has properties (`lands`) attached.
- This is enforced in the service by counting `lands` with `projectId = :id`.

---

## 4.8 Project Unit Limit (Properties/Lands)

When creating properties/lands for a project, the backend enforces:
- You cannot create more properties than the project's `totalUnits`.
- **The project must be approved** (`status = approved`) before any properties can be created.

Notes:
- This limit is enforced during property creation.
- `totalUnits` must be defined as `>= 1` before any property can be created under that project.
- Projects in `pending_approval` status cannot have lands created until admin approval.

### 4.9 Verify approval document integrity
`GET /api/projects/:id/verify`
- Auth required
- Compares stored SHA-256 hash (in DB) with SHA-256 of the file on disk.

Returns:
- `verified: boolean`
- `message: string`
- `document: { verified, message, storedHash?, calculatedHash? }`

### 4.10 Upload approval documents
`POST /api/projects/:id/approval-documents`
- Auth required
- Role: Builder (owner) or Admin
- Multipart: `approvalDocuments` file field

Flow:
1. Deletes old file from local storage if one exists
2. Uploads new file to local storage (`uploads/project-approvals/...`)
3. Stores a SHA-256 hash in DB for tamper detection
4. Attempts IPFS upload (Pinata) and stores a JSON string with `{hash,gateway,timestamp}` if successful

---

## 5) How CRUD Works Internally (Controller → Service → DB)

High-level pattern used across Projects:

1. **Controller** (routing + auth/roles)
   - Validates request body via global ValidationPipe
   - Delegates to the service

2. **Service** (business rules)
   - Loads the project via TypeORM repository
   - Enforces ownership checks and business constraints
   - Saves via `projectRepository.save(...)`

3. **Entity** (database schema)
   - `Project` is a TypeORM entity stored in the `projects` table
   - `status` is an enum column

---

## 6) “Connection” Details (DB + Uploads + IPFS)

### 6.1 Database connection (Postgres)
Database connectivity is configured through TypeORM using environment variables.

Supported configuration:
- Prefer `DATABASE_URL` if present
- Otherwise uses:
  - `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
  - (fallback legacy vars: `SUPABASE_DB_*`)

Other important settings:
- `synchronize: true` when `NODE_ENV !== 'production'`
- `ssl.rejectUnauthorized = false` (commonly required for hosted Postgres like Neon)

### 6.2 Uploads connection (local file storage)
Files are written to:
- `<repo>/uploads/<bucket>/<timestamp>-<originalname>`

Public URL returned is:
- `/uploads/<bucket>/<filename>`

Projects use bucket:
- `project-approvals`

### 6.3 IPFS connection (Pinata)
IPFS uploads are optional:
- If `PINATA_JWT` is missing, the service logs a warning and IPFS upload is disabled.
- If upload fails, the system **continues** and still saves the local file + SHA-256 hash.

Optional config:
- `PINATA_GATEWAY`

---

## 7) Quick sanity checks (manual)

- Status values allowed:
  - Try update with `status=pending_approval` → should pass
  - Try update with `status=approved` → should pass
  - Try update with `status=active` → should pass
  - Try update with `status=completed` → should pass (owner/admin)
  - Try update with any other status → should fail DTO validation

- Completed project rule:
  - Set project to `completed`
  - Attempt another update as Builder → should fail
  - Attempt update as Admin → should pass

- Upload + verify:
  - Upload a file via `/api/projects/:id/approval-documents`
  - Hit `/api/projects/:id/verify` and ensure hashes match

- Approval workflow:
  - Create a project → status should be `pending_approval`
  - Try creating a land/property → should fail (project not approved)
  - Admin hits `PATCH /api/projects/:id/approve` → status becomes `approved`
  - Try creating a land/property → should succeed now

- Frontend error handling examples:
  - If a builder tries to create a land in a non-approved project, expect `400` with `success=false`.
  - If a builder tries to approve a project, expect `403` with `success=false`.
  - If an ID does not exist, expect `404` with `success=false`.

- Units workflow:
  - Ensure project `totalUnits >= 1` before creating any land
  - If `totalUnits` is `0`/missing, land creation should fail

---

## 8) Project Approval Workflow Summary

**New Feature**: Projects now require admin approval before lands/properties can be created.

Workflow:
1. **Builder creates project** → `status = pending_approval`
2. **Admin reviews project details** → View via `GET /api/projects/:id`
3. **Admin approves project** → `PATCH /api/projects/:id/approve` → `status = approved`
4. **Builder creates lands/properties** → Only possible when `status = approved`

Business rules enforced:
- New projects start with `status = pending_approval`
- Lands/properties cannot be created until project is `approved`
- Only admins can approve projects
- Cannot approve already approved or completed projects

