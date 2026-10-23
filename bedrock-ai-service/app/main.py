import logging
import os
from functools import lru_cache

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from app.schemas import (
    AssistantRequest,
    AssistantResponse,
    TokenUsage,
)

load_dotenv()

logger = logging.getLogger(__name__)

MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "amazon.nova-micro-v1:0")
AWS_REGION = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")

SYSTEM_PROMPT = """You are an assistant for planning return-to-office (RTO) days.
Help users clarify preferences and discuss possible scheduling approaches.
Do not claim that a schedule is feasible or has been saved. Any schedule you
suggest is a draft for the user to review."""

app = FastAPI(
    title="RTO Bedrock AI Service",
    description=(
        "Standalone test service for Amazon Nova Micro. This service does not "
        "connect to the RTO Tracker backend or persist schedules."
    ),
    version="0.1.0",
)


@lru_cache(maxsize=1)
def bedrock_client():
    options = {
        "service_name": "bedrock-runtime",
        "config": Config(
            connect_timeout=5,
            read_timeout=90,
            retries={"max_attempts": 2, "mode": "standard"},
        ),
    }
    if AWS_REGION:
        options["region_name"] = AWS_REGION
    return boto3.client(**options)


@app.get("/health", tags=["Health"])
def health() -> dict[str, str | None]:
    """Check that the local service is running; this does not call AWS."""
    return {"status": "ok", "modelId": MODEL_ID, "region": AWS_REGION}


@app.post(
    "/api/assistant/chat",
    response_model=AssistantResponse,
    tags=["Assistant"],
    summary="Send a message to Amazon Nova Micro",
)
def chat(request: AssistantRequest) -> AssistantResponse:
    """Send a standalone chat message to Bedrock."""
    try:
        result = bedrock_client().converse(
            modelId=MODEL_ID,
            system=[{"text": SYSTEM_PROMPT}],
            messages=[
                {
                    "role": "user",
                    "content": [{"text": request.message}],
                }
            ],
            inferenceConfig={
                "maxTokens": request.max_tokens,
                "temperature": 0.2,
            },
        )
    except ClientError as error:
        error_code = error.response.get("Error", {}).get("Code", "Unknown")
        logger.warning("Bedrock request failed with %s", error_code)
        raise HTTPException(
            status_code=502,
            detail=(
                "Amazon Bedrock could not complete the request. Check the AWS "
                "region, model access, and IAM permissions."
            ),
        ) from error
    except BotoCoreError as error:
        logger.warning("Bedrock connection failed: %s", type(error).__name__)
        raise HTTPException(
            status_code=502,
            detail="Could not connect to Amazon Bedrock. Check AWS configuration.",
        ) from error

    answer = "".join(
        block.get("text", "")
        for block in result.get("output", {}).get("message", {}).get("content", [])
    ).strip()
    if not answer:
        raise HTTPException(
            status_code=502,
            detail="Amazon Bedrock returned an empty response.",
        )

    usage = result.get("usage", {})
    return AssistantResponse(
        reply=answer,
        model_id=MODEL_ID,
        usage=TokenUsage(
            input_tokens=usage.get("inputTokens", 0),
            output_tokens=usage.get("outputTokens", 0),
            total_tokens=usage.get("totalTokens", 0),
        ),
    )


