from pydantic import BaseModel, Field


class AssistantRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=6000,
        description="A question or RTO planning request for the assistant.",
        examples=["I need 11 office days next month. Prefer Wednesday to Friday."],
    )
    max_tokens: int = Field(default=512, ge=1, le=2048)


class TokenUsage(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int


class AssistantResponse(BaseModel):
    reply: str
    model_id: str
    usage: TokenUsage


