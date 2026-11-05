# ServiceBee

Service-booking platform: consumers request services from companies; companies accept, assign technicians, resolve, and get reviewed.

**Stack:** React + Vite (frontend) · Node.js + Express (backend) · **PostgreSQL** (database, via the `pg` driver)

## Setup

### 1. Database (PostgreSQL 13 or newer)

```sql
CREATE USER servicebee WITH PASSWORD 'servicebee';
CREATE DATABASE servicebee OWNER servicebee;
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # then edit DATABASE_URL and the JWT secrets
npm run db:init           # creates all tables, indexes and triggers (safe to re-run)
npm run dev               # http://localhost:5000
```

`backend/.env`

| Variable             | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `PORT`               | API port (default 5000)                                          |
| `DATABASE_URL`       | `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`                  |
| `DATABASE_SSL`       | `true` if your hosted PostgreSQL requires TLS (optional)         |
| `JWT_ACCESS_SECRET`  | secret for 15-minute access tokens                               |
| `JWT_REFRESH_SECRET` | secret for 7-day refresh tokens                                  |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

The frontend calls `http://localhost:5000` unless `VITE_API_BASE_URL` is set.

## Database layout

Defined in [`backend/db/schema.sql`](backend/db/schema.sql).

| Table           | Notes                                                                                  |
| --------------- | -------------------------------------------------------------------------------------- |
| `companies`     | providers; unique email                                                                |
| `consumers`     | customers; unique email                                                                |
| `services`      | belong to a company; title unique per company                                          |
| `requests`      | consumer → company/service; `status` is one of pending, inProgress, rejected, resolved, cancelled |
| `reviews`       | one per request; rating 1–5                                                            |
| `notifications` | addressed to a consumer or a company (`recipient_type`)                                |

* All ids are UUID strings; the API returns them as `id`.
* `updated_at` is maintained by a trigger.
* Deleting a service keeps its past requests and reviews (the service link becomes `null`); in-progress requests of that service are cancelled and their consumers notified, all in one transaction.
* There is no separate data layer: every controller (and the two auth middlewares) runs its own plain parameterised SQL with `pool.query('SELECT ...', [values])` right inside the handler. `backend/config/db.js` only creates and exports the connection `pool`.
* Handlers that must save several rows together use `pool.connect()` with `BEGIN` / `COMMIT` / `ROLLBACK` written inline.
