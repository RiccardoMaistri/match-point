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
    winner_partecipant:Optional[int] = None
    is_bye: bool = False  # Per i bye nei bracket a eliminazione diretta
    status: Literal['pending', 'in_progress', 'completed', 'cancelled'] = 'pending'


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str = Field(..., unique=True)
    hashed_password: Optional[str] = None
    google_id: Optional[str] = None
    is_active: bool = True
    # Timestamps can be added later if needed
    # created_at: Optional[datetime] = None
    # updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    # Optional fields during registration
    name: Optional[str] = None # If you want to collect name during registration

    # Example of a password confirmation field, handled in the endpoint logic
    # password_confirm: str


class TournamentCreate(BaseModel):
    name: str
    tournament_type: Literal['single', 'double']
    format: Literal['elimination', 'round_robin']
    start_date: Optional[datetime] = None
    registration_open: bool = True
    invitation_link: Optional[str] = None

    class Config:
        from_attributes = True


class Tournament(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str # Foreign key to User model
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
