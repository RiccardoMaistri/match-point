import uuid
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class Participant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    ranking: Optional[int] = None


class Match(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    round_number: Optional[int] = None
    match_number: Optional[int] = None
    participant1_id: Optional[str] = None
    participant2_id: Optional[str] = None
    winner_id: Optional[str] = None
    score_participant1: Optional[int] = None
    score_participant2: Optional[int] = None
    is_bye: bool = False  # Per i bye nei bracket a eliminazione diretta
    status: Literal['pending', 'in_progress', 'completed', 'cancelled'] = 'pending'


class Tournament(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    tournament_type: Literal['single', 'double']  # singolo o doppio
    format: Literal['elimination', 'round_robin']  # eliminazione diretta o girone all'italiana
    start_date: Optional[datetime] = None
    participants: List[Participant] = []
    matches: List[Match] = []
    registration_open: bool = True
    invitation_link: Optional[str] = None  # Link univoco per l'iscrizione

    class Config:
        # Per permettere a FastAPI di gestire i tipi datetime
        from_attributes = True


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: Optional[str] = None
    phone_number: Optional[str] = None
    username: Optional[str] = None
    google_id: Optional[str] = None
    password_hash: Optional[str] = None

    class Config:
        from_attributes = True
