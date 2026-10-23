# RTO Bedrock AI Service

A standalone FastAPI service for experimenting with Amazon Nova Micro through Amazon Bedrock. It does not connect to the RTO Tracker backend or save schedules.

## Requirements

- Python 3.11 or newer
- AWS credentials with permission to invoke the selected Bedrock model
- Model access enabled in the selected AWS account and region

The service uses the AWS SDK credential chain. For local development, configure credentials with `aws configure` or standard AWS environment variables. Do not put AWS credentials in `.env` or commit them.

## Run locally (PowerShell)

```powershell
cd bedrock-ai-service
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install .
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8010
```

The service listens on localhost only. Open [http://127.0.0.1:8010/docs](http://127.0.0.1:8010/docs) for Swagger UI. `GET /health` checks the service without calling AWS. Use `POST /api/assistant/chat` to send a message to Nova Micro.

Example request:

```json
{
  "message": "I need 11 office days next month. Prefer Wednesday to Friday.",
  "max_tokens": 512
}
```

## Model and region

The default is `amazon.nova-micro-v1:0` in `us-east-1`. Set `BEDROCK_MODEL_ID` and `AWS_REGION` in `.env` to change them. For Singapore, configure the APAC inference profile and source region shown in `.env.example`, and confirm model access in your account before invoking it.

The endpoint returns HTTP 502 with a safe error message if Bedrock is unavailable or model invocation fails. Check the service console for the Bedrock error code, then verify the region, model access, credentials, and `bedrock:InvokeModel` IAM permission.
