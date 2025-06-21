from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Participant(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    email: str
    ranking: Optional[int] = None


class Match(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    participant1_id: Optional[UUID] = None
    participant2_id: Optional[UUID] = None
    participant1_score: Optional[int] = None
    participant2_score: Optional[int] = None
    winner_id: Optional[UUID] = None
    round_number: Optional[int] = None  # For bracket tournaments
    match_number_in_round: Optional[int] = None  # For bracket tournaments
    start_time: Optional[datetime] = None
    status: Literal["pending", "in_progress", "completed", "cancelled"] = "pending"


class Tournament(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    type: Literal["singolo", "doppio"]
    format: Literal["eliminazione diretta", "girone all'italiana"]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    participants: List[Participant] = []
    matches: List[Match] = []
    invitation_link: Optional[str] = None  # Simplified for now
    # Consider adding more fields like max_participants, rules, etc.


class TournamentCreate(BaseModel):
    name: str
    type: Literal["singolo", "doppio"]
    format: Literal["eliminazione diretta", "girone all'italiana"]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ParticipantCreate(BaseModel):
    name: str
    email: str
    ranking: Optional[int] = None


class MatchResult(BaseModel):
    participant1_score: int
    participant2_score: int
    winner_id: UUID  # Should be either participant1_id or participant2_id of the match
    status: Literal["completed", "cancelled"] = "completed"
