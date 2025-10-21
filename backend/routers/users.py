from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm

from auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    Token,
    create_access_token,
    get_current_active_user,
    get_password_hash,
    oauth2_scheme_optional,
    revoke_token,
    verify_password,
)
from database_adapter import get_user_by_email_db, create_user_db
from models import User, UserCreate

router = APIRouter()

@router.post(
    "/token", response_model=Token, summary="Create access token for user login"
)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user_dict = get_user_by_email_db(form_data.username)

    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_in_db = User(**user_dict)

    if not user_in_db.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user_in_db.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_in_db.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_in_db.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/logout", summary="Logout user")
async def logout(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    token_query: Optional[str] = Query(None, alias="token"),
):
    final_token = token or token_query
    if not final_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
        )
    revoke_token(final_token)
    return {"message": "Successfully logged out"}


@router.post(
    "/register",
    response_model=User,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register_user(user_in: UserCreate):
    if not user_in.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required for registration.",
        )

    existing_user = get_user_by_email_db(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please try logging in or use a different email.",
        )

    hashed_password = get_password_hash(user_in.password)
    new_user_data = User(
        email=user_in.email,
        hashed_password=hashed_password,
        is_active=True,
        name=user_in.name # Make sure to pass the name
    )
    user_to_save_dict = new_user_data.model_dump()
    created_user_dict = create_user_db(user_to_save_dict)
    return User(**created_user_dict)


@router.get(
    "/me",
    response_model=User,
    summary="Get current authenticated user's details",
)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user
