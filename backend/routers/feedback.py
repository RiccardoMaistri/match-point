from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, Body, status
from pydantic import BaseModel
import uuid

from auth import get_current_active_user
from models import User
from database_adapter import save_feedback_db, get_all_feedback_db

router = APIRouter()

class FeedbackCreate(BaseModel):
    feedback: str

class Feedback(BaseModel):
    id: str
    user_id: str
    user_email: str
    feedback: str
    created_at: str

@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    feedback_data: FeedbackCreate = Body(...),
    current_user: User = Depends(get_current_active_user),
):
    feedback_entry = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "user_email": current_user.email,
        "feedback": feedback_data.feedback,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    save_feedback_db(feedback_entry)
    return {"message": "Feedback submitted successfully"}

@router.get("/", response_model=List[Feedback])
async def get_all_feedback(current_user: User = Depends(get_current_active_user)):
    return get_all_feedback_db() #TODO: implement
