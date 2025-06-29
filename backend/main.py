import uuid
from fastapi import Body, FastAPI, HTTPException, Path, status
from typing import List, Optional

from database import (create_tournament_db, delete_tournament_db, get_all_tournaments_db, get_tournament_db,
                      update_tournament_db)
# We will add user related db functions later
from models import Match, Participant, Tournament, User, UserCreate, TournamentCreate # Import User and UserCreate model
# Import auth related things
from auth import (
    SECRET_KEY as AUTH_SECRET_KEY, # Rename to avoid clash if main.py has its own SECRET_KEY
    ALGORITHM as AUTH_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES as AUTH_ACCESS_TOKEN_EXPIRE_MINUTES,
    GOOGLE_CLIENT_ID as AUTH_GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET as AUTH_GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI as AUTH_GOOGLE_REDIRECT_URI,
    # oauth2_scheme, # We might define this in main or use from auth
    # create_access_token,
    oauth2_scheme, # We might define this in main or use from auth
    create_access_token,
    get_current_active_user, # For protecting routes
    get_optional_current_active_user, # For optional user on public routes
    Token, # Make sure Token model is imported from auth
    verify_password, # For password flow
    get_password_hash # For user creation later
)
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends # To use Depends for get_current_active_user
from datetime import timedelta
from fastapi import Request # For Google OAuth
from fastapi.responses import RedirectResponse, HTMLResponse # For Google OAuth
import uuid # For generating invitation links and possibly other IDs if needed

from authlib.integrations.starlette_client import OAuth
# Placeholder for database user functions - will be replaced by actual db calls
from database import get_user_by_email_db, create_user_db, update_user_db # This function needs to be created in database.py


# --- Authentication Settings ---
# These would ideally come from environment variables or a config file
SECRET_KEY = AUTH_SECRET_KEY # Use the one from auth.py for now or define a new one
ALGORITHM = AUTH_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = AUTH_ACCESS_TOKEN_EXPIRE_MINUTES

# Google OAuth settings (ensure these are correctly set in auth.py or here)
GOOGLE_CLIENT_ID = AUTH_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = AUTH_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI = AUTH_GOOGLE_REDIRECT_URI
# --- End Authentication Settings ---

# Initialize OAuth client (for Google Login)
oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile',
        'redirect_url': GOOGLE_REDIRECT_URI # Ensure this is registered in Google Cloud Console
    }
)

app = FastAPI(
    title="Tournament Manager API",
    description="API per la gestione di tornei sportivi.",
    version="0.1.0"
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Endpoints Tornei ---

@app.post("/tournaments/", response_model=Tournament, status_code=status.HTTP_201_CREATED,
          summary="Crea un nuovo torneo")
async def create_tournament(
    tournament_payload: TournamentCreate, # Use TournamentCreate for request body
    current_user: User = Depends(get_current_active_user)
):
    """
    Crea un nuovo torneo con i dati forniti. Richiede autenticazione.
    L'ID dell'utente autenticato verrà associato al torneo.
    - **name**: Nome del torneo (richiesto)
    - **tournament_type**: 'single' o 'double' (richiesto)
    - **format**: 'elimination' o 'round_robin' (richiesto)
    - **start_date**: Data di inizio (opzionale)
    """

    # Construct the full Tournament object, including the user_id from the authenticated user
    # and default values for id, participants, matches from the Tournament model itself.
    new_tournament_data = Tournament(
        **tournament_payload.model_dump(),
        user_id=current_user.id
    )

    # Generate invitation link if not provided
    if not new_tournament_data.invitation_link:
        new_tournament_data.invitation_link = f"/join/{uuid.uuid4()}" # uuid needs to be imported

    # Save to database
    created_tournament_dict = create_tournament_db(new_tournament_data.model_dump())

    # Return the created tournament, Pydantic will validate against Tournament model
    return Tournament(**created_tournament_dict)


@app.get("/tournaments/", response_model=List[Tournament], summary="Ottieni tutti i tornei")
async def get_all_tournaments(current_user: Optional[User] = Depends(get_optional_current_active_user)):
    """
    Restituisce una lista di tutti i tornei esistenti.
    Se l'utente è autenticato, restituisce solo i tornei a cui partecipa (basato sull'email del partecipante).
    Altrimenti, restituisce tutti i tornei.
    """
    all_tournaments_db = get_all_tournaments_db()

    if current_user and current_user.email:
        user_email = current_user.email
        user_tournaments = []
        for t_dict in all_tournaments_db:
            tournament = Tournament(**t_dict) # Validate and work with model instances
            for participant in tournament.participants:
                if participant.email == user_email:
                    user_tournaments.append(tournament)
                    break # Found user in this tournament, move to next tournament
        return user_tournaments
    else:
        # No user logged in or user has no email (should not happen for active users)
        # Return all tournaments
        return [Tournament(**t) for t in all_tournaments_db]


@app.get("/tournaments/{tournament_id}", response_model=Tournament, summary="Ottieni un torneo specifico")
async def get_tournament(tournament_id: str = Path(..., description="ID del torneo da recuperare")):
    """
    Restituisce i dettagli di un torneo specifico basato sul suo ID.
    """
    tournament_db = get_tournament_db(tournament_id)
    if not tournament_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    return Tournament(**tournament_db)


@app.put("/tournaments/{tournament_id}", response_model=Tournament, summary="Aggiorna un torneo esistente")
async def update_tournament(
        tournament_id: str = Path(..., description="ID del torneo da aggiornare"),
        tournament_update_payload: TournamentCreate, # Use TournamentCreate, user_id will be handled
        current_user: User = Depends(get_current_active_user)
):
    """
    Aggiorna i dettagli di un torneo esistente. Richiede autenticazione.
    L'utente deve essere il proprietario del torneo.
    *Nota: Attualmente richiede l'intero oggetto torneo per l'aggiornamento (escluso user_id, id).*
    """
    existing_tournament_dict = get_tournament_db(tournament_id)
    if not existing_tournament_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")

    existing_tournament = Tournament(**existing_tournament_dict)

    if existing_tournament.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this tournament")

    # Construct the full updated Tournament object
    # Preserve existing id, user_id, participants, matches
    updated_tournament_data = Tournament(
        id=existing_tournament.id,
        user_id=current_user.id, # Owner doesn't change
        name=tournament_update_payload.name,
        tournament_type=tournament_update_payload.tournament_type,
        format=tournament_update_payload.format,
        start_date=tournament_update_payload.start_date,
        registration_open=tournament_update_payload.registration_open,
        invitation_link=tournament_update_payload.invitation_link if tournament_update_payload.invitation_link else existing_tournament.invitation_link,
        participants=existing_tournament.participants, # Participants are managed by separate endpoints
        matches=existing_tournament.matches # Matches are managed by separate endpoints
    )

    # Generate new invitation link if not provided and was missing, or if explicitly cleared
    if not updated_tournament_data.invitation_link:
         updated_tournament_data.invitation_link = f"/join/{uuid.uuid4()}"


    tournament_db = update_tournament_db(tournament_id, updated_tournament_data.model_dump())
    if not tournament_db:
        # This case should ideally not be reached if the initial get_tournament_db succeeded
        # and update_tournament_db correctly finds the tournament by ID.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found during update process")
    return Tournament(**tournament_db)


@app.delete("/tournaments/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Elimina un torneo")
async def delete_tournament(
    tournament_id: str = Path(..., description="ID del torneo da eliminare"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Elimina un torneo specifico. Richiede autenticazione.
    L'utente deve essere il proprietario del torneo.
    """
    tournament_to_delete = get_tournament_db(tournament_id)
    if not tournament_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")

    if tournament_to_delete.get("user_id") != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this tournament")

    if not delete_tournament_db(tournament_id):
        # This case should not be reached if previous checks passed
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete tournament from database")

    return  # No content response


# --- Endpoints Partecipanti (da implementare) ---
# Questi endpoint agiranno su un torneo specifico

@app.post("/tournaments/{tournament_id}/participants/", response_model=Participant, status_code=status.HTTP_201_CREATED,
          summary="Aggiungi un partecipante a un torneo")
async def add_participant_to_tournament(
        tournament_id: str = Path(..., description="ID del torneo"),
        participant_data: Participant = Body(...)
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")

    tournament = Tournament(**tournament_dict)

    # Verifica se il partecipante (basato sull'email, per esempio) esiste già
    for p in tournament.participants:
        if p.email == participant_data.email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Participant with email {participant_data.email} already registered.")

    # Il modello Participant già assegna un ID
    new_participant = Participant(**participant_data.model_dump())
    tournament.participants.append(new_participant)

    update_tournament_db(tournament_id, tournament.model_dump())
    return new_participant


@app.get("/tournaments/{tournament_id}/participants/", response_model=List[Participant],
         summary="Ottieni i partecipanti di un torneo")
async def get_tournament_participants(tournament_id: str = Path(..., description="ID del torneo")):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    tournament = Tournament(**tournament_dict)
    return tournament.participants


@app.delete("/tournaments/{tournament_id}/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT,
            summary="Rimuovi un partecipante da un torneo")
async def remove_participant_from_tournament(
        tournament_id: str = Path(..., description="ID del torneo"),
        participant_id: str = Path(..., description="ID del partecipante da rimuovere")
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")

    tournament = Tournament(**tournament_dict)
    original_participant_count = len(tournament.participants)
    tournament.participants = [p for p in tournament.participants if p.id != participant_id]

    if len(tournament.participants) == original_participant_count:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found in this tournament")

    update_tournament_db(tournament_id, tournament.model_dump())
    return


# --- Endpoints Match e Risultati (da implementare) ---

@app.post("/tournaments/{tournament_id}/matches/generate", summary="Genera bracket/calendario per un torneo")
async def generate_matches_for_tournament(tournament_id: str = Path(..., description="ID del torneo")):
    # TODO: Implementare la logica di generazione bracket/calendario
    # Questo dipenderà dal formato del torneo (elimination/round_robin)
    # e dal numero di partecipanti.
    # Potrebbe usare librerie come bracket-maker o round-robin-tournament.
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")

    tournament = Tournament(**tournament_dict)
    if not tournament.participants or len(tournament.participants) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Not enough participants to generate matches.")

    # Logica di generazione placeholder
    tournament.matches = []  # Resetta i match esistenti
    if tournament.format == "elimination":
        # Semplice logica di placeholder per eliminazione diretta
        # In un'implementazione reale, questo sarebbe molto più complesso
        # (gestione bye, seeding, etc.)
        num_participants = len(tournament.participants)
        # Per ora, solo match diretti se il numero è pari
        if num_participants % 2 == 0:
            for i in range(0, num_participants, 2):
                p1 = tournament.participants[i]
                p2 = tournament.participants[i + 1]
                match = Match(
                    participant1_id=p1.id,
                    participant2_id=p2.id,
                    round_number=1,
                    match_number=(i // 2) + 1
                )
                tournament.matches.append(match)
        else:
            # Gestione bye semplificata (il primo partecipante passa)
            # Questo è solo un esempio, non una logica di bracket completa
            tournament.matches.append(
                Match(participant1_id=tournament.participants[0].id, is_bye=True, round_number=1, match_number=1))
            for i in range(1, num_participants, 2):
                if i + 1 < num_participants:
                    p1 = tournament.participants[i]
                    p2 = tournament.participants[i + 1]
                    match = Match(
                        participant1_id=p1.id,
                        participant2_id=p2.id,
                        round_number=1,
                        match_number=((i - 1) // 2) + 2
                    )
                    tournament.matches.append(match)


    elif tournament.format == "round_robin":
        # Semplice logica di placeholder per girone all'italiana
        participants_shuffled = tournament.participants[:]  # Copia
        # random.shuffle(participants_shuffled) # Opzionale: mescolare i partecipanti

        num_participants = len(participants_shuffled)
        match_num_counter = 1
        for i in range(num_participants):
            for j in range(i + 1, num_participants):
                p1 = participants_shuffled[i]
                p2 = participants_shuffled[j]
                match = Match(
                    participant1_id=p1.id,
                    participant2_id=p2.id,
                    match_number=match_num_counter
                )
                tournament.matches.append(match)
                match_num_counter += 1
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Tournament format not supported for match generation yet.")

    update_tournament_db(tournament_id, tournament.model_dump())
    return {"message": "Matches generated (placeholder logic)", "tournament_id": tournament_id,
            "matches": tournament.matches}


@app.get("/tournaments/{tournament_id}/matches", response_model=List[Match], summary="Ottieni i match di un torneo")
async def get_tournament_matches(tournament_id: str = Path(..., description="ID del torneo")):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    tournament = Tournament(**tournament_dict)
    return tournament.matches


@app.post("/tournaments/{tournament_id}/matches/{match_id}/result", response_model=Match,
          summary="Inserisci/Aggiorna il risultato di un match")
async def record_match_result(
        tournament_id: str = Path(..., description="ID del torneo"),
        match_id: str = Path(..., description="ID del match"),
        score_participant1: Optional[int] = Body(None, embed=True),
        score_participant2: Optional[int] = Body(None, embed=True),
        winner_id: Optional[str] = Body(None, embed=True)
        # Il client dovrebbe determinare il vincitore o l'API lo deduce
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")

    tournament = Tournament(**tournament_dict)
    match_to_update = None
    match_index = -1

    for i, m in enumerate(tournament.matches):
        if m.id == match_id:
            match_to_update = m
            match_index = i
            break

    if not match_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found in this tournament")

    if match_to_update.is_bye:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot record result for a bye match")

    # Aggiorna i punteggi e lo stato
    if score_participant1 is not None:
        match_to_update.score_participant1 = score_participant1
    if score_participant2 is not None:
        match_to_update.score_participant2 = score_participant2

    # Determina il vincitore se non fornito esplicitamente e i punteggi sono presenti
    if winner_id:
        if winner_id not in [match_to_update.participant1_id, match_to_update.participant2_id]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Winner ID does not match participants in the match")
        match_to_update.winner_id = winner_id
    elif score_participant1 is not None and score_participant2 is not None:
        if score_participant1 > score_participant2:
            match_to_update.winner_id = match_to_update.participant1_id
        elif score_participant2 > score_participant1:
            match_to_update.winner_id = match_to_update.participant2_id
        else:
            # Gestione pareggio (potrebbe non essere permessa in tutti i formati)
            # Per ora, non impostiamo un vincitore se c'è pareggio e non è specificato
            pass

    if match_to_update.winner_id:  # Se c'è un vincitore (o è stato determinato)
        match_to_update.status = 'completed'
    elif score_participant1 is not None or score_participant2 is not None:  # Se sono stati inseriti punteggi parziali
        match_to_update.status = 'in_progress'

    tournament.matches[match_index] = match_to_update
    update_tournament_db(tournament_id, tournament.model_dump())
    return match_to_update


# --- Endpoint per tabellone/calendario (GET) ---
# Questi potrebbero essere gli stessi di get_tournament_matches o più specifici

@app.get("/tournaments/{tournament_id}/bracket", summary="Ottieni il tabellone (per eliminazione diretta)")
async def get_tournament_bracket(tournament_id: str = Path(..., description="ID del torneo")):
    # Per ora, restituisce semplicemente i match.
    # In futuro, potrebbe formattare i dati specificamente per una visualizzazione a tabellone.
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    tournament = Tournament(**tournament_dict)
    if tournament.format != "elimination":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Bracket view is for elimination tournaments only.")
    return {"tournament_id": tournament.id, "name": tournament.name, "matches": tournament.matches}


@app.get("/")
def read_root():
    return {"message": "Backend is running!"}


@app.get("/tournaments/{tournament_id}/schedule", summary="Ottieni il calendario (per girone all'italiana)")
async def get_tournament_schedule(tournament_id: str = Path(..., description="ID del torneo")):
    # Per ora, restituisce semplicemente i match.
    # In futuro, potrebbe raggruppare per round o data.
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    tournament = Tournament(**tournament_dict)
    if tournament.format != "round_robin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Schedule view is for round-robin tournaments only.")
    return {"tournament_id": tournament.id, "name": tournament.name, "matches": tournament.matches}


# Per avviare l'app con Uvicorn (per lo sviluppo):
# uvicorn backend.main:app --reload --port 8000
# Assicurati di essere nella directory principale del progetto (non dentro backend/)
# quando esegui questo comando.
# Oppure, se sei in backend/: uvicorn main:app --reload --port 8000


# --- Authentication Endpoints ---

@app.post("/token", response_model=Token, summary="Create access token for user login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token endpoint.
    Takes email (as username) and password. Returns an access token.
    """
    user_dict = get_user_by_email_db(form_data.username) # form_data.username is the email

    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password", # Keep it generic
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Convert dict to User model instance
    user_in_db = User(**user_dict)

    # Check if user has a password (e.g. not a Google-only user)
    if not user_in_db.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User registered through an external provider or password not set.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify the password
    if not verify_password(form_data.password, user_in_db.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password", # Keep it generic
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify the password
    # The hashed_password should come from your user model in the database
    if not verify_password(form_data.password, user_in_db.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_in_db.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # The 'sub' (subject) of the token should be a unique identifier for the user.
    # Using user's email here, but user.id is also common.
    access_token = create_access_token(
        data={"sub": user_in_db.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/login/google", summary="Redirect to Google OAuth for login")
async def login_google(request: Request):
    """
    Redirects the user to Google's OAuth 2.0 server to initiate the login process.
    The GOOGLE_REDIRECT_URI specified in auth.py (and used by main.py's oauth object)
    is where Google will send the user back after authentication.
    """
    # The redirect_uri for authorize_redirect must match one of the
    # OAuth 2.0 client's Authorized redirect URIs in Google Cloud Console.
    # This is taken from the oauth.register client_kwargs or can be overridden here.
    # Ensure it's the same as GOOGLE_REDIRECT_URI.
    redirect_uri = GOOGLE_REDIRECT_URI # Or request.url_for('auth_google') if you name the route
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/auth/google", summary="Handle Google OAuth callback")
async def auth_google(request: Request):
    """
    Handles the callback from Google OAuth.
    If authentication is successful, it fetches the user's info,
    creates or updates the user in the database, generates a JWT token,
    and ideally redirects the user to the frontend with the token or a session.
    For a SPA, it's common to pass the token back to the frontend,
    which then stores it. This can be done via query parameters,
    or by rendering a simple HTML page that posts the token to the parent window.
    """
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        # Log the error e
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Could not authorize Google token: {str(e)}")

    user_info_from_google = token.get('userinfo')
    if not user_info_from_google:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not fetch user info from Google")

    google_email = user_info_from_google.get('email')
    google_id = user_info_from_google.get('sub') # 'sub' is the standard subject identifier

    if not google_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email not provided by Google")

    user_dict = get_user_by_email_db(google_email)
    user: Optional[User] = None

    if user_dict:
        user = User(**user_dict)
        # If user exists, ensure their google_id is stored if not already
        if not user.google_id:
            user.google_id = google_id
            # Here we would call an update_user_db function if it existed
            # For now, create_user_db might overwrite or we handle it manually
            # This requires users.json to be an array of dicts, and update means replacing the dict.
            # Let's assume create_user_db can handle updates if the user exists by email,
            # or we add a specific update function later.
            # For simplicity, if found, we assume it's correctly linked or we link it.
            # This part needs robust handling in database.py: update_user_db
            # For now, we'll rely on re-saving if we modify 'user' object from User model.
            # This is not ideal as database.py works with dicts.
            # Let's fetch, modify dict, then save.
            # user_dict["google_id"] = google_id # Modify the dict
            # This would require an update_user_db(user_dict) or similar.
            # For the current json file approach, we'd need to rewrite the whole file.
            # This logic will be refined in step 8.
            # For now: (REPLACED WITH update_user_db)
            update_data = {"google_id": google_id}
            if not user.id: # Should not happen if user was created properly
                 update_data["id"] = str(uuid.uuid4()) # Assign a new ID if missing

            updated_user_dict = update_user_db(user.id, update_data)
            if not updated_user_dict:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not update user with Google ID.")
            user = User(**updated_user_dict) # Re-fetch/re-init to get the updated User model

    else:
        # User does not exist, create a new one
        # Ensure new user gets an ID from the User model's default_factory
        new_user_data = User(
            email=google_email,
            google_id=google_id,
            is_active=True
            # hashed_password is None as they are using Google to log in
        )
        created_user_dict = create_user_db(new_user_data.model_dump())
        user = User(**created_user_dict)

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is inactive or could not be processed")

    # Generate JWT token for our application
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    app_access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    # For SPAs, redirecting with the token in a query parameter is common.
    # The frontend then extracts it and stores it.
    # IMPORTANT: Ensure your frontend URL is correct.
    frontend_url = "http://localhost:3000" # Configure this appropriately
    redirect_url_with_token = f"{frontend_url}/auth/callback?token={app_access_token}&token_type=bearer"

    # Alternatively, render an HTML page that posts the token to the parent window (more secure than query params for history)
    # html_content = f"""
    # <html>
    # <head><title>Authentication Success</title></head>
    # <body>
    #   <p>Authenticated successfully. Please wait...</p>
    #   <script>
    #     window.opener.postMessage({{
    #       type: 'auth_success',
    #       token: '{app_access_token}',
    #       token_type: 'bearer'
    #     }}, '{frontend_url}'); // Target origin for security
    #     window.close();
    #   </script>
    # </body>
    # </html>
    # """
    # return HTMLResponse(content=html_content)

    return RedirectResponse(url=redirect_url_with_token)


@app.post("/users/register", response_model=User, status_code=status.HTTP_201_CREATED, summary="Register a new user")
async def register_user(user_in: UserCreate):
    """
    Registers a new user with email and password.
    - **email**: User's email address.
    - **password**: User's password (min length 8 characters).
    - **name**: Optional user's name.
    """
    existing_user = get_user_by_email_db(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please try logging in or use a different email.",
        )

    hashed_password = get_password_hash(user_in.password)

    # Create the new user object. The User model includes an id field with a default factory.
    new_user_data = User(
        email=user_in.email,
        hashed_password=hashed_password,
        is_active=True # Users are active by default upon registration
        # name=user_in.name # If you added 'name' to User model and want to store it
    )

    # Convert Pydantic model to dict for database storage, ensuring default factory for ID is called.
    user_to_save_dict = new_user_data.model_dump()

    created_user_dict = create_user_db(user_to_save_dict)

    # Return the created user, conforming to the response_model=User
    # Pydantic will validate the created_user_dict against the User model.
    return User(**created_user_dict)


# import uuid # No longer needed here directly as User model handles ID generation and update_user_db handles missing IDs if necessary


if __name__ == "__main__":
    import uvicorn

    # Questo è solo per debug facile, non per produzione
    uvicorn.run(app, host="0.0.0.0", port=8001)
    # Per eseguire con reload dalla root del progetto:
    # uvicorn backend.main:app --reload
    pass
