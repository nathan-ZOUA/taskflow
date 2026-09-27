# TaskFlow

TaskFlow is a personal, educational full-stack task management demonstration project. It uses React and JavaScript in the browser, an Express REST API, and PostgreSQL for persistent user and task data. It is not a real client product and has not received a production security audit.

## Features

- Public landing, login and registration pages
- Cookie-based login sessions and protected application routes
- A dashboard with counts and completion percentage calculated from the signed-in user's database records
- Create, read, update and delete tasks; change status and priority
- Filter tasks by status/priority, search titles and descriptions, and filter due dates through the API
- Profile summary, loading/error/empty states, responsive navigation and layouts
- SQL migrations, request validation, password hashing and ownership checks

## Technology and architecture

- **Client:** React, JavaScript, Vite, React Router, CSS
- **Server:** Node.js, Express 5, JavaScript
- **Database:** PostgreSQL, `pg`, parameterized SQL and versioned SQL migrations
- **Security helpers:** bcryptjs password hashing, JWT in an HTTP-only cookie, Helmet, CORS allowlist, authentication rate limit

```text
client/
  public/                  Favicon
  src/
    components/            Shared layout, forms, buttons and task UI
    context/               Browser authentication state
    pages/                 Landing, login, registration, dashboard, tasks, profile
    services/api.js        Central HTTP client and API methods
server/
  src/
    config/                Environment loading and validation
    controllers/           HTTP request/response handling
    db/                    PostgreSQL pool, migration runner and SQL migrations
    middleware/            Authentication, 404 and centralized errors
    routes/                Express API route declarations
    services/              Authentication and task/database operations
    utils/                 Request validation and HTTP errors
  test/                    Node.js unit tests for request validation
package.json               npm workspaces and shared commands
eslint.config.js           Shared lint configuration
```

The client sends HTTP requests to `/api`. Vite proxies these requests to Express during local development. Express routes call controllers, which validate input and use services to run parameterized SQL queries. PostgreSQL stores the data across restarts.

## Requirements

- Node.js 20.19+ or 22.12+ (Vite requirement)
- npm 10+
- PostgreSQL 14+

## Install and configure

From the project root:

```powershell
npm install
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Edit `server/.env` and set `DATABASE_URL` to your local PostgreSQL credentials. Replace `JWT_SECRET` with a new random value of at least 32 characters. For example, generate one with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy that output into `JWT_SECRET`. Do not commit `.env` files. `client/.env` can keep `VITE_API_URL=/api` for development through the Vite proxy.

### Create a local PostgreSQL role and database

Run these commands in `psql` as a PostgreSQL administrator, replacing the password with one you choose:

```sql
CREATE ROLE taskflow_user WITH LOGIN PASSWORD 'choose_a_local_password';
CREATE DATABASE taskflow OWNER taskflow_user;
```

Set the matching username, password, host and database in `server/.env`, for example:

```text
DATABASE_URL=postgresql://taskflow_user:choose_a_local_password@127.0.0.1:5432/taskflow
```

Apply pending SQL migrations from the project root:

```powershell
npm run db:migrate
```

The migration runner creates `schema_migrations`, then applies each numbered SQL file once inside a transaction. The first migration creates `users`, `tasks`, constraints, indexes, and the one-user-to-many-tasks foreign key.

## Start locally

Start frontend and backend together:

```powershell
npm run dev
```

Or use separate terminals from the project root:

```powershell
npm run dev:server
npm run dev:client
```

- Frontend: `http://127.0.0.1:5173` (Vite may select the next free port)
- API: `http://127.0.0.1:4000`
- Health check: `http://127.0.0.1:4000/api/health` (checks PostgreSQL too)

## API overview

All task endpoints require the signed-in user's HTTP-only session cookie.

| Method   | Endpoint             | Purpose                                                                               |
| -------- | -------------------- | ------------------------------------------------------------------------------------- |
| `POST`   | `/api/auth/register` | Create an account and sign in                                                         |
| `POST`   | `/api/auth/login`    | Sign in                                                                               |
| `POST`   | `/api/auth/logout`   | Clear the session cookie                                                              |
| `GET`    | `/api/auth/me`       | Get the current account                                                               |
| `GET`    | `/api/tasks`         | List tasks; supports `status`, `priority`, `search`, `dueBefore`, `dueAfter`, `limit` |
| `GET`    | `/api/tasks/stats`   | Get task counts and completion percentage                                             |
| `GET`    | `/api/tasks/:id`     | Get one owned task                                                                    |
| `POST`   | `/api/tasks`         | Create a task                                                                         |
| `PUT`    | `/api/tasks/:id`     | Update task fields                                                                    |
| `DELETE` | `/api/tasks/:id`     | Delete a task                                                                         |

Statuses are `pending`, `in_progress`, and `completed`; priorities are `low`, `medium`, and `high`. Every task query is scoped by the authenticated user ID. SQL values are parameterized.

## Checks

```powershell
npm run lint
npm run build
npm test
```

The automated suite checks request validation, API responses, session cookies and task flows. API workflow tests use a mocked query layer: they do not verify PostgreSQL syntax, the migration against a real server, or persistence across restarts. Once PostgreSQL is configured and running, run the migration and manually verify registration/login/logout, duplicate email, protected routes, task CRUD and filters, two-user task isolation, statistics, and persistence. The repository does not include a preconfigured demo user or sample tasks.

## Security and learning notes

- Passwords are hashed with bcryptjs and never returned by API responses.
- A signed JWT session is held in an HTTP-only, SameSite cookie rather than browser storage.
- The API validates important input itself, uses parameterized queries, scopes tasks by owner, limits authentication attempts, configures CORS, and sends baseline Helmet headers.
- The local defaults and protections are for an educational project. They are not a production security audit or complete deployment configuration.
- **Route:** a backend URL associated with an action. **Controller:** handles the request and response. **Service:** applies application/database operations. **Middleware:** runs between a request and its route. **Migration:** a versioned SQL change that can be applied reproducibly.
