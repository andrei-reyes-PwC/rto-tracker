# RTO Tracker

The repository contains three standalone applications:

- [`next-frontend/`](next-frontend/README.md) — Next.js web frontend.
- [`spring-backend/`](spring-backend/README.md) — Spring Boot REST API.
- [`bedrock-ai-service/`](bedrock-ai-service/README.md) — Python FastAPI service for testing Amazon Bedrock Nova Micro.

Each app has its own dependencies and run instructions. See the app README before starting it. Repository and subproject working guidance is in `AGENTS.md`; concise architecture maps are in each `PROJECT_NOTES.md`.

## Docker images

Each application has a Dockerfile in its project directory. Build from the repository root:

```sh
docker build -f next-frontend/Dockerfile -t rto-frontend \
  --build-arg BACKEND_API_URL=https://api.example.com \
  --build-arg AI_SERVICE_URL=https://ai.example.com next-frontend
docker build -f spring-backend/Dockerfile -t rto-backend spring-backend
docker build -f bedrock-ai-service/Dockerfile -t rto-ai-service bedrock-ai-service
```

Run the backend with the `prod` profile, database variables, frontend origin, and mounted JWT private/public keys. Run the AI service with matching JWT issuer/audience settings, a mounted JWT public key, a reachable backend URL, a Bedrock region/model, and AWS credentials or an AWS task role. Store secrets in the deployment platform's secret manager; do not bake them into images. Frontend rewrite URLs are embedded at build time, so build its image with the target service URLs. MySQL is external; point the backend to a managed database such as Amazon RDS.

The shared product requirements, user roles, and access rules are documented in [`REQUIREMENTS.md`](REQUIREMENTS.md).
