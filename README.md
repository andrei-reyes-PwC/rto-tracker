# RTO Tracker

## What it does

RTO Tracker helps teams coordinate return-to-office (RTO) schedules and daily free-lunch procurement in one place. It addresses the manual work of collecting office-day plans, checking who is expected onsite, coordinating events and team schedules, and preparing and tracking lunch handouts.

Employees can plan and save office days in a shared calendar, see aggregate attendance for their platform, and review relevant events. Authorized managers can administer people and assignments, report on planned attendance, and manage lunch procurement by Site and date, including locking an eligible roster and recording meal handouts. An optional AI assistant can answer planning questions using the user's saved schedule and relevant read-only team and event information; it does not change schedules.

The goal is to make planning and procurement more consistent and visible, reduce coordination overhead, and help teams prepare for in-office days. Actual attendance and lunch quantities depend on saved plans and the configured roster.

The repository contains three standalone applications:

- [`next-frontend/`](next-frontend/README.md) — Next.js web frontend.
- [`spring-backend/`](spring-backend/README.md) — Spring Boot REST API.
- [`bedrock-ai-service/`](bedrock-ai-service/README.md) — Python FastAPI service for testing Amazon Bedrock Nova Micro.

Each app has its own dependencies and run instructions. The steps below describe a complete local setup, including the database and optional AI assistant.

## Run locally (Windows PowerShell)

### Prerequisites

- Git
- Node.js (use a current LTS release; npm is included)
- Java 25 or later
- Maven 3.6.3 or later
- MySQL Server, running locally
- Python 3.11 or later and the Windows `py` launcher (only for the AI service)
- AWS CLI and an AWS account with access to invoke the configured Amazon Bedrock model (only for live AI chat)

### 1. Get the code and create the database

Open PowerShell in the repository directory. Create a MySQL database; the default backend connection expects the database name `rto_tracker` and MySQL at `localhost:3306`:

```sql
CREATE DATABASE rto_tracker;
```

The backend defaults to MySQL user `root` and password `admin1234`. Set `DB_USERNAME` and `DB_PASSWORD` in the shell before starting Spring if your local MySQL credentials differ. The Flyway migration creates the tables when Spring starts. For a different MySQL host, database name, or credentials, set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in that shell. For example:

```powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/rto_tracker?serverTimezone=UTC"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-local-password"
```

### 2. Start the backend

In a PowerShell window, run:

```powershell
cd spring-backend
mvn spring-boot:run
```

The API runs at `http://localhost:8080`. Keep this window open. Database migrations run automatically. The migration creates the schema and roles, but does not create a login account; use credentials for an account provisioned for your environment.

### 3. Start the frontend

Open a second PowerShell window:

```powershell
cd next-frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The frontend proxies `/api/*` requests to the backend at `http://localhost:8080` by default. To use a different address, set `BACKEND_API_URL` in the frontend process environment before `npm run dev`.

### 4. (Optional) Enable the AI assistant

The planner and backend work without the AI service. To enable chat, configure AWS credentials in the AWS CLI or standard AWS environment variables; do not put AWS credentials in `.env`. Then, from a third PowerShell window at the repository root, start the service:

```powershell
aws configure
.\bedrock-ai-service\run.ps1
```

The script creates the Python environment, installs dependencies, and copies `.env.example` to `.env` on first run. Review `bedrock-ai-service/.env` and set the Bedrock model and AWS region for which your account has access. Generate the local JWT key pair once, from the repository root, in another PowerShell window:

```powershell
.\bedrock-ai-service\.venv\Scripts\python.exe .\bedrock-ai-service\scripts\generate_local_jwt_keys.py
```

The assistant service listens on `http://127.0.0.1:8010`. The frontend defaults to this URL; set `AI_SERVICE_URL` if you run the service elsewhere. Spring and the AI service must use matching `JWT_ISSUER` and `JWT_AUDIENCE` values (the defaults match). Keep the generated private key in `spring-backend/.secrets/` private. The service's health endpoint is `http://127.0.0.1:8010/health`.

### Stop the apps

Press `Ctrl+C` in each app's PowerShell window.

### Troubleshooting

- **Backend cannot connect to MySQL:** check that MySQL is running, the `rto_tracker` database exists, and the configured URL and credentials are correct.
- **Frontend API requests fail:** confirm the backend is running on port 8080 or set `BACKEND_API_URL` to its actual address.
- **AI chat is unavailable:** confirm the AI service is running, the local JWT keys were generated, `.env` issuer/audience match Spring defaults (or your Spring settings), and AWS model access, region, and credentials are configured. The AI `/health` endpoint does not call AWS.

Each app's README has additional app-specific details. Repository and subproject working guidance is in `AGENTS.md`; concise architecture maps are in each `PROJECT_NOTES.md`.

The shared product requirements, user roles, and access rules are documented in [`REQUIREMENTS.md`](REQUIREMENTS.md).
