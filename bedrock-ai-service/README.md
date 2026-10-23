# RTO Bedrock AI Service

A FastAPI service for Amazon Nova Micro through Amazon Bedrock. The frontend obtains a short-lived assistant JWT from Spring using its existing login session, then sends the prompt and JWT directly to this service. Bedrock chooses from read-only tools for the caller's visible events, other platform members' daily RTO counts, and the caller's saved office days; Python validates the model's tool request and calls fixed, user-scoped Spring endpoints. The tools allow today through the end of next month only. There is no schedule write tool, and the Spring session cookie is never sent to the AI service.

## Requirements

- Python 3.11 or newer
- The project installs `tzdata` to provide `Asia/Singapore` on Windows.
- AWS credentials with permission to invoke the selected Bedrock model
- Model access enabled in the selected AWS account and region

The service uses the AWS SDK credential chain. For local development, configure credentials with `aws configure` or standard AWS environment variables. Do not put AWS credentials in `.env` or commit them.

## Run locally (PowerShell)

From the repository root, start the service with:

```powershell
.\bedrock-ai-service\run.ps1
```

The script creates `.venv` and installs the service dependencies when needed, creates `.env` from `.env.example` if needed, then starts the reloading server on `http://127.0.0.1:8010`. Configure AWS credentials separately using `aws configure` or standard AWS environment variables.

After installing the dependencies, generate a shared RSA keypair once from this directory:

```powershell
.\.venv\Scripts\python.exe scripts\generate_local_jwt_keys.py
```

The private key is written to `spring-backend/.secrets/jwt-private.pem` and is ignored by Git. Spring signs 5-minute tokens with it. The public key is written beside it and is used by both Spring and this service to verify tokens. Keep the private key secret; never share it with the frontend or AI service. Spring's `JWT_ISSUER` and `JWT_AUDIENCE` values must match this service's `.env`. By default, the AI service fetches tool data from Spring at `http://localhost:8080`.

To set up or run each step manually instead:

```powershell
cd bedrock-ai-service
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install .
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8010
```

The service listens on localhost only. Browser access is allowed from `FRONTEND_ORIGINS` (default `http://localhost:3000` and `http://127.0.0.1:3000`). Set the frontend's `NEXT_PUBLIC_AI_SERVICE_URL` if the AI service URL differs from `http://127.0.0.1:8010`. Open [http://127.0.0.1:8010/docs](http://127.0.0.1:8010/docs) for Swagger UI. `GET /health` checks the service without calling AWS. `POST /api/assistant/chat` requires `Authorization: Bearer <assistant JWT>` and a JSON body containing `message` (and optional `max_tokens`). The frontend gets this token through same-origin `POST /api/auth/assistant-token`; the Spring endpoint requires its existing authenticated session.

Example request:

```json
{
  "message": "I need 11 office days next month. Prefer Wednesday to Friday.",
  "max_tokens": 512
}
```

## Model and region

The default is `amazon.nova-micro-v1:0` in `us-east-1`. Set `BEDROCK_MODEL_ID` and `AWS_REGION` in `.env` to change them. For Singapore, configure the APAC inference profile and source region shown in `.env.example`, and confirm model access in your account before invoking it.

The model can answer without tools or request one or more of the declared data tools. Python executes only the allowlisted tools, forwards the same JWT to Spring, returns tool results to Bedrock, and continues the Converse call for a final answer. Event, attendance, and schedule data are read-only; any suggested changes remain drafts. The endpoint returns HTTP 502 with a safe error message if Bedrock is unavailable or model invocation fails. Check the service console for the Bedrock error code, then verify the region, model access, credentials, and `bedrock:InvokeModel` IAM permission.
