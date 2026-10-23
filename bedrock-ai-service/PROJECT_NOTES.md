# Project Notes

- Standalone Python 3.11+ FastAPI application; install dependencies with `pip install .` from this directory.
- `app/main.py` defines `GET /health` and `POST /api/assistant/chat`; Swagger UI is served at `/docs`.
- The chat endpoint calls Amazon Bedrock Converse with `BEDROCK_MODEL_ID` (default `amazon.nova-micro-v1:0`) and AWS SDK credentials. Region comes from `AWS_REGION` or `AWS_DEFAULT_REGION`.
- The service does not connect to Spring, access application data, or persist schedules. Local development binds to `127.0.0.1:8010`; see `README.md` for setup.
