from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.schemas import AiAssistantQuery, AiAssistantResponse
from app.services.ai_assistant import ai_assistant
from app.core.dependencies import get_current_user
from app.models.models import User

router = APIRouter(prefix="/ai-assistant", tags=["Ask APAAR AI Assistant"])

@router.post("/query", response_model=AiAssistantResponse)
def ask_apaar(
    req: AiAssistantQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = ai_assistant.process_query(req.query, db)
    return result
