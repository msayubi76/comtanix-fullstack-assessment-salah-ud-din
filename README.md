# Comtanix Quote Request Manager

Prospects submit quote requests through a public form, staff review, assign and move them through a status workflow, and every important change is recorded in a separate audit service.

| Folder | Stack | What it does |
|---|---|---|
| `api-laravel/` | Laravel 12, MySQL, Sanctum | Auth and roles, quote requests, status workflow, queued audit events |
| `audit-service/` | Node.js, Express 5, MongoDB | Receives signed events from Laravel and serves the audit trail |
| `frontend/` | React 19, TypeScript, Vite, Tailwind, TanStack Query | Staff dashboard and the public quote form |

```
Browser (localhost:5173) ──cookie session──> Laravel API (localhost:8000) ──> MySQL
                                                  │  queued job, HMAC-signed
                                                  ▼
                                    Audit service (localhost:4000) ──> MongoDB
```

The browser only talks to Laravel. The activity timeline is read through a Laravel endpoint that calls the audit service, so login and permissions protect it.

## Quick start (one command)

The only requirement is Docker Desktop. From the project root:

```bash
./setup.sh          # Git Bash, macOS, Linux
```

```powershell
.\setup.ps1         # Windows PowerShell
```

The script checks that Docker is running, creates a root `.env` with a random shared secret (first run only), builds and starts all containers, waits until they respond, and prints the URLs and logins. Inside the containers it runs everything a manual setup would: `composer install`, `php artisan migrate --seed`, `npm ci` for the audit service and the dashboard, the dashboard build, and the queue worker. The first run takes a few minutes.

Then open http://localhost:5173.

- Ports: dashboard 5173, API 8000, audit service 4000, MySQL 3307, MongoDB 27017. Change them in the root `.env` if any are taken.
- The API seeds the database only when it is empty, so restarting keeps your data.
- Laravel gets a fresh `APP_KEY` on every container start, so restarting the API signs you out. Fine for a local demo; a real deployment would use a fixed key.
- Stop with `docker compose --profile app down` (add `-v` to also delete the database volumes).
- Without the script: `docker compose --profile app up -d --build` does the same, using the placeholder secret unless `AUDIT_SECRET` is set.

## Running without Docker

You need PHP 8.2+ with `pdo_mysql`, Composer, Node.js 20+, MySQL 8 (or MariaDB 10.4+) and MongoDB 7.

### 1. Databases

Either use your own MySQL and MongoDB, or start just the two databases with Docker:

```bash
docker compose up -d mysql mongo
```

| | Your own databases | Databases from Docker |
|---|---|---|
| MySQL | create an empty database, e.g. `assesment_comtanix`, on port 3306 | ready on port **3307** (3306 is often taken by XAMPP), database `comtanix`, user `comtanix`, password `comtanix` |
| MongoDB | `mongodb://127.0.0.1:27017` | the same |

### 2. Laravel API

```bash
cd api-laravel
composer install
cp .env.example .env
php artisan key:generate
```

Edit `api-laravel/.env`:

```
DB_HOST=127.0.0.1
DB_PORT=3306                  # 3307 for the Docker MySQL
DB_DATABASE=assesment_comtanix   # comtanix for the Docker MySQL
DB_USERNAME=root              # comtanix for the Docker MySQL
DB_PASSWORD=                  # comtanix for the Docker MySQL

AUDIT_SERVICE_SECRET=         # see "Shared secret" below
```

**Shared secret:** Laravel signs every event it sends to the audit service, and the audit service rejects events with a wrong signature. So both apps need the same random value. Generate one with `php -r "echo bin2hex(random_bytes(32));"`, put it in `AUDIT_SERVICE_SECRET` here, and use the same value for `AUDIT_SECRET` in step 3.

Then create the tables and sample data, and start the API and the queue worker (two terminals):

```bash
php artisan migrate --seed
php artisan serve             # http://localhost:8000
php artisan queue:work        # sends audit events to the audit service
```

`php artisan serve` handles one request at a time. On Windows the dashboard feels faster with a few workers: `$env:PHP_CLI_SERVER_WORKERS=4; php artisan serve` (PowerShell) or `PHP_CLI_SERVER_WORKERS=4 php artisan serve` (bash).

### 3. Audit service

```bash
cd audit-service
npm install
cp .env.example .env
```

In `audit-service/.env`, set `AUDIT_SECRET` to the **same value** as `AUDIT_SERVICE_SECRET` in Laravel. `MONGO_URI` already points to `mongodb://127.0.0.1:27017/comtanix_audit`. Then:

```bash
npm run dev                   # http://localhost:4000
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                   # http://localhost:5173
```

**Use `localhost`, not `127.0.0.1`.** The dashboard logs in with a session cookie, and the browser only shares it when both apps run on `localhost`.

### Seeded logins

All passwords are `password`.

| Email | Role |
|---|---|
| admin@comtanix.test | Admin |
| staff1@comtanix.test | Staff |
| staff2@comtanix.test | Staff |

The seeder also creates 200 sample quote requests spread across both staff users.

### Pages

- `http://localhost:5173/request-quote` – public quote form
- `http://localhost:5173/login` – staff sign in, then the request list and detail panel

## Running the tests

```bash
# Laravel: 23 feature tests. Uses a separate database, create it once first:
#   CREATE DATABASE assesment_comtanix_test;
cd api-laravel && php artisan test

# Audit service: 8 tests against comtanix_audit_test (dropped afterwards)
cd audit-service && npm test

# Frontend: type check, lint and production build
cd frontend && npx tsc -b && npm run lint && npm run build
```

The Node tests use Node's built-in test runner. Jest could not connect to MongoDB with the MongoDB 7 driver that Mongoose 9 uses (its sandbox breaks the driver's handshake), and the built-in runner needs no extra package.

## API overview

All Laravel responses share one shape, including errors:

```json
{ "status": true, "code": 200, "message": "Quote request retrieved successfully.", "quote_request": { } }
{ "status": false, "code": 422, "message": "Cannot change status from new to quoted.", "errors": { "status": ["..."] } }
```

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/login`, `/api/logout`, GET `/api/me` | Login throttled to 5/min |
| POST | `/api/public/quote-requests` | Public, validated, honeypot, 3/min and 20/hour per IP |
| GET | `/api/quote-requests` | Staff: `search`, `status`, `assigned_to`, `service_type`, `sort`, `direction`, `page`, `per_page` |
| GET | `/api/quote-requests/{id}` | Staff |
| PATCH | `/api/quote-requests/{id}/status` | Admin, or the assigned staff member |
| PATCH | `/api/quote-requests/{id}/assign` | Admin |
| DELETE | `/api/quote-requests/{id}` | Admin (soft delete) |
| GET | `/api/quote-requests/{id}/audit-events` | Staff (proxied from the audit service) |
| GET | `/api/users` | Staff (assignee list) |
| POST | `audit-service /events` | Signed with `X-Signature` |
| GET | `audit-service /events` | `quoteRequestId`, `type`, `page`, `per_page` |

Status workflow: `new → in_review → quoted → closed`, and `in_review → closed`.

### Postman

Import `docs/postman/comtanix.postman_collection.json` and `docs/postman/comtanix.postman_environment.json`, then run **Auth / login** first; the token is saved to the environment automatically. Set `quote_request_id` to the request you want to work with, and set `audit_secret` to the same value as the shared secret, so the **Audit service** requests are signed correctly ("Send the same event again" shows that a duplicate is stored only once). The delete request uses its own `delete_quote_request_id` so running the whole collection never deletes anything by accident.

## Assumptions

- Staff can view every request but can only change the status of requests assigned to them. Admins can do everything.
- Admins can assign a request to any user, including another admin, and at any status.
- Invalid status transitions return 422 with a message, not 409.
- The message on a quote request is optional (max 1000 characters).
- Seeded requests have no audit history, because the seeder writes directly to the database. Everything created or changed through the API or the dashboard does.
- The dashboard signs in with a cookie session. Any other client (Postman, scripts) gets a Sanctum token from the same login endpoint.
- The audit service is internal: its `GET /events` has no auth and should not be exposed publicly.
- Service types and budget ranges are fixed lists (enums), not editable data.

## Part E: Architecture notes

**1. Audit service down for 10 minutes.** The API keeps working: events are queued jobs in MySQL, dispatched only after the database transaction commits. Each job retries 5 times with backoff (10s, 30s, 60s, 120s, 300s, roughly 8.5 minutes), and the event ID is created at dispatch, so every retry sends the same ID and the audit service stores it once. Events created near the end of the outage deliver on their own. Events created at the start run out of retries before the service is back; they are logged and kept in `failed_jobs`, and `php artisan queue:retry all` sends them again without duplicates. Meanwhile the dashboard timeline shows "Audit service is unavailable" and everything else works. For production I would add an outbox table with a scheduled re-sender instead of relying on a fixed retry count, run the queue on Redis with Horizon under a process manager, alert on failed jobs, and stop retrying on 4xx responses, which currently retry like any other error.

**2. The list endpoint with 5 million requests.** Filtering by status or assignee sorted by date uses the composite indexes `(status, created_at)` and `(assigned_to, status)`, and assignees are eager-loaded (3 queries per page). What would hurt: the search uses `LIKE '%term%'` on three columns, which scans the whole table; `COUNT(*)` runs on every page for the total; deep `OFFSET` pages get slower; and sorting by client name or updated date has no index. I would move search to a MySQL FULLTEXT index or a search engine (Meilisearch through Scout), switch to cursor pagination, cache or approximate the total, add indexes for each allowed sort (for example `(assigned_to, created_at)`), and archive closed requests.

**3. Security.**
- *Public endpoint:* strict validation (enums, max lengths), a honeypot field, a rate limit per IP, and `status` / `assigned_to` are not mass assignable. Left out: CAPTCHA and email verification.
- *Token storage:* the dashboard uses Sanctum's cookie session. The cookie is httpOnly, so JavaScript can't read it; requests carry a CSRF token; CORS only allows the dashboard's address; the session is regenerated on login and invalidated on logout; login is throttled. Tokens for other clients expire after 8 hours. `role` is not mass assignable and every permission is checked on the server by policies (the UI only hides buttons). Left out because this is not deployed: HTTPS with `Secure` cookies, `APP_DEBUG=false`, 2FA.
- *Event signing:* HMAC-SHA256 over the raw request body with a shared secret from the environment, compared in constant time, with a 100 KB body limit. Left out: secret rotation.
- *Replay attacks:* a replayed event has the same event ID and is stored only once; changing the ID breaks the signature. A timestamp window would narrow it further but is not needed for correctness.
- No `.env` files or secrets are committed.

**4. What I cut and what I would build next.** Cut: an "unassigned" filter, deleting from the dashboard (the API supports it), an audit event for deletes, pagination of the activity timeline (it shows the latest 20 events), and frontend tests. Reassigning a request to the same person still records an event. Next: the outbox pattern, a Redis queue with Horizon, full-text search with cursor pagination, Vitest and Playwright tests, OpenAPI docs and a CI workflow.

## AI usage

I used AI tools during this task, mainly Claude Code (Anthropic), and GitHub Copilot for some commit messages and PR descriptions.

1. Understanding the task: I used AI to go through the requirements and plan how to split the work.
2. Laravel API: I defined the approach and the coding rules (Form Requests for validation, service classes for business logic, API Resources with one response format for every endpoint, route model binding, enums, no over-engineering). The code was written with AI help, one module at a time, and I reviewed each module before moving on. Changes I asked for along the way included removing `role` from `$fillable`, using Laravel's auth helpers for login, the created_by / updated_by / deleted_by columns with a trait, and cookie-based sessions for the dashboard instead of localStorage.
3. Node audit service and React dashboard: same process. I split the work into small tasks and gave instructions, the AI wrote the code, and I reviewed each step and had issues fixed before continuing. Examples: switching the Node tests from Jest to Node's built-in test runner, adding milliseconds to audit timestamps, and making the detail panel reload after a failed status change.
4. Git: AI helped draft commit messages and PR descriptions, which I edited.

I reviewed the code in this repository and can explain and change any part of it.
