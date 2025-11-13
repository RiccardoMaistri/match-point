import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import List, Literal, Optional


class Participant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    ranking: Optional[int] = None

    @field_validator('email')
    def email_to_lower(cls, v):
        return str(v).lower()


class Team(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player1_id: str
    player2_id: str
    name: Optional[str] = None  # Optional team name


class Match(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    round_number: Optional[int] = None
    match_number: Optional[int] = None
    match_day: Optional[int] = None  # For round robin scheduling
    phase: Literal['group', 'playoff'] = 'group'  # Tournament phase
    scheduled_date: Optional[datetime] = None  # Scheduled match time
    participant1_id: Optional[str] = None  # For singles or team1_id for doubles
    participant2_id: Optional[str] = None  # For singles or team2_id for doubles
    winner_id: Optional[str] = None
    score_participant1: Optional[int] = None  # Total score (sum of sets)
    score_participant2: Optional[int] = None  # Total score (sum of sets)
    set1_score_participant1: Optional[int] = None
    set1_score_participant2: Optional[int] = None
    set2_score_participant1: Optional[int] = None
    set2_score_participant2: Optional[int] = None
    set3_score_participant1: Optional[int] = None
    set3_score_participant2: Optional[int] = None
    is_bye: bool = False
    status: Literal['pending', 'in_progress', 'completed', 'cancelled'] = 'pending'


class MatchResult(BaseModel):
    set1_score_participant1: Optional[int] = None
    set1_score_participant2: Optional[int] = None
    set2_score_participant1: Optional[int] = None
    set2_score_participant2: Optional[int] = None
    set3_score_participant1: Optional[int] = None
    set3_score_participant2: Optional[int] = None


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    name: Optional[str] = None
    hashed_password: Optional[str] = None
    is_active: bool = True

    @model_validator(mode='after')
    def check_at_least_one_identifier(self):
        if not self.email and not self.username:
            raise ValueError('Either email or username must be provided')
        return self

    @field_validator('email')
    def email_to_lower(cls, v):
        return v.lower() if v else v

    @field_validator('username')
    def username_to_lower(cls, v):
        return v.lower() if v else v

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str = Field(..., min_length=8)
    name: Optional[str] = None

    @model_validator(mode='after')
    def check_at_least_one_identifier(self):
        if not self.email and not self.username:
            raise ValueError('Either email or username must be provided')
        return self

    @field_validator('email')
    def email_to_lower(cls, v: Optional[EmailStr]) -> Optional[str]:
        return str(v).lower() if v else None

    @field_validator('username')
    def username_to_lower(cls, v: Optional[str]) -> Optional[str]:
        return v.lower() if v else None


class TournamentCreate(BaseModel):
    name: str
    tournament_type: Literal['single', 'double']
    format: Literal['round_robin'] = 'round_robin'
    end_date: Optional[datetime] = None
    playoff_participants: int = 4

    class Config:
        from_attributes = True


class Tournament(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    tournament_type: Literal['single', 'double']
    format: Literal['elimination', 'round_robin'] = 'round_robin'
    end_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    participants: List[Participant] = []
    teams: List[Team] = []  # For doubles tournaments
    matches: List[Match] = []
    registration_open: bool = True
    status: Literal['open', 'group_stage', 'playoffs', 'completed'] = 'open'
    invitation_link: Optional[str] = None
    playoff_participants: int = 4
    total_matchdays: Optional[int] = None

    class Config:
        from_attributes = True
