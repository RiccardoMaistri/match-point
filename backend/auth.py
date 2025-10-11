import json
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

SECRET_KEY = "your-secret-key"  # Replace with a strong, randomly generated key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REVOKED_TOKENS_FILE = "revoked_tokens.json"


# --- Token Revocation ---

def load_revoked_tokens():
    try:
        with open(REVOKED_TOKENS_FILE, "r") as f:
            return set(json.load(f))
    except (FileNotFoundError, json.JSONDecodeError):
        return set()

def is_token_revoked(token: str):
    return token in load_revoked_tokens()

def revoke_token(token: str):
    revoked_tokens = load_revoked_tokens()
    revoked_tokens.add(token)
    with open(REVOKED_TOKENS_FILE, "w") as f:
        json.dump(list(revoked_tokens), f)


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # Points to the /token endpoint
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="token", auto_error=False) # For optional authentication

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None
    sub: Optional[str] = None # 'sub' is a standard claim for subject (user ID)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # Use 'sub' (subject) standard claim for user identifier (e.g., email or user_id)
    # Ensure 'sub' key exists in data
    if "sub" not in to_encode and "email" in to_encode: # Fallback to email if sub not present
        to_encode["sub"] = to_encode["email"]

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# This function will be used as a dependency to protect routes
from database import get_user_by_email_db # Import the actual db function
from models import User # Import User model for type hinting and instantiation

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    if is_token_revoked(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub") # 'sub' claim should hold the email
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, sub=email)
    except JWTError:
        raise credentials_exception

    user_dict = get_user_by_email_db(email=token_data.email)
    if user_dict is None:
        raise credentials_exception

    user = User(**user_dict) # Convert dict to User model instance
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

async def get_optional_current_active_user(token: Optional[str] = Depends(oauth2_scheme_optional)) -> Optional[User]:
    if not token:
        return None
    if is_token_revoked(token):
        return None
    try:
        # This reuses the logic from get_current_user and get_current_active_user
        # but allows for no token to be present.
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            # If token is present but invalid (e.g. no sub), it's an error,
            # but for optional auth, we might just return None or let it pass if not critical.
            # However, if a token IS provided, it SHOULD be valid.
            # For simplicity, if a token is bad, we can let it raise here or return None.
            # Let's treat a bad token as if no token was provided for "optional" user.
            return None # Or raise HTTPException(status_code=401, detail="Invalid token for optional user")

        user_dict = get_user_by_email_db(email=email)
        if user_dict is None:
            return None # Or raise

        user = User(**user_dict)
        if not user.is_active:
            return None # Or raise HTTPException(status_code=400, detail="Inactive user for optional auth")
        return user
    except JWTError:
        # Invalid token
        return None # Or raise HTTPException(status_code=401, detail="Invalid token for optional user")
