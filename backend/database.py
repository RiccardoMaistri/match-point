import json
import os
import uuid  # For generating IDs
from filelock import FileLock
from pydantic import BaseModel
from typing import Any, Dict, List, Optional, TypeVar

# Definiamo un tipo generico per i modelli Pydantic
T = TypeVar('T', bound=BaseModel)

DATA_DIR = "jsondata"
TOURNAMENTS_FILE = os.path.join(DATA_DIR, "tournaments.json")


# In futuro potremmo separare partecipanti e match, ma per ora li teniamo dentro tournaments
# PARTICIPANTS_FILE = os.path.join(DATA_DIR, "participants.json")
# MATCHES_FILE = os.path.join(DATA_DIR, "matches.json")

def _ensure_data_dir_exists():
    """Assicura che la directory jsondata esista."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)


def _load_data(filepath: str) -> List[Dict[str, Any]]:
    """Carica dati da un file JSON. Restituisce una lista vuota se il file non esiste o è vuoto/malformato."""
    _ensure_data_dir_exists()
    lock_path = filepath + ".lock"
    lock = FileLock(lock_path)
    with lock:
        if not os.path.exists(filepath):
            return []
        try:
            with open(filepath, "r") as f:
                content = f.read()
                if not content.strip():
                    return []
                return json.loads(content)
        except FileNotFoundError:
            return []
        except json.JSONDecodeError:
            print(f"Warning: Could not decode JSON from {filepath}. Returning empty list.")
            return []


def _save_data(filepath: str, data: List[Dict[str, Any]]):
    """Salva dati in un file JSON."""
    _ensure_data_dir_exists()
    lock_path = filepath + ".lock"
    lock = FileLock(lock_path)
    with lock:
        with open(filepath, "w") as f:
            json.dump(data, f, indent=4, default=str)


# --- Funzioni specifiche per i Tornei ---

def load_tournaments() -> List[Dict[str, Any]]:
    """Carica tutti i tornei."""
    return _load_data(TOURNAMENTS_FILE)


def save_tournaments(tournaments: List[Dict[str, Any]]):
    """Salva la lista di tornei."""
    _save_data(TOURNAMENTS_FILE, tournaments)


def get_all_tournaments_db() -> List[Dict[str, Any]]:
    return load_tournaments()


def get_tournament_db(tournament_id: str) -> Optional[Dict[str, Any]]:
    tournaments = load_tournaments()
    for t in tournaments:
        if t.get("id") == tournament_id:
            return t
    return None


def create_tournament_db(tournament_data: Dict[str, Any]) -> Dict[str, Any]:
    tournaments = load_tournaments()
    tournaments.append(tournament_data)
    save_tournaments(tournaments)
    return tournament_data


def update_tournament_db(tournament_id: str, tournament_update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    tournaments = load_tournaments()
    for i, t in enumerate(tournaments):
        if t.get("id") == tournament_id:
            # Un semplice update, potrebbe essere più sofisticato per aggiornamenti parziali
            updated_tournament = {**t, **tournament_update_data}
            tournaments[i] = updated_tournament
            save_tournaments(tournaments)
            return updated_tournament
    return None


def delete_tournament_db(tournament_id: str) -> bool:
    tournaments = load_tournaments()
    original_length = len(tournaments)
    tournaments = [t for t in tournaments if t.get("id") != tournament_id]
    if len(tournaments) < original_length:
        save_tournaments(tournaments)
        return True
    return False


# --- Inizializzazione (opzionale, per assicurarsi che i file esistano) ---
def initialize_database_files():
    _ensure_data_dir_exists()
    if not os.path.exists(TOURNAMENTS_FILE):
        _save_data(TOURNAMENTS_FILE, [])
    # if not os.path.exists(PARTICIPANTS_FILE):
    #     _save_data(PARTICIPANTS_FILE, [])
    # if not os.path.exists(MATCHES_FILE):
    #     _save_data(MATCHES_FILE, [])


# Esegui all'importazione per assicurare che la directory e i file base esistano
initialize_database_files()

# --- User Data Functions (Placeholder/To be implemented) ---
# These will interact with a new users.json file or a proper database.
USERS_FILE = os.path.join(DATA_DIR, "users.json")


def _load_users() -> List[Dict[str, Any]]:
    """Carica dati utenti da un file JSON."""
    _ensure_data_dir_exists()
    if not os.path.exists(USERS_FILE):
        _save_data(USERS_FILE, [])  # Create users.json if it doesn't exist
        return []
    return _load_data(USERS_FILE)


def _save_users(users: List[Dict[str, Any]]):
    """Salva dati utenti in un file JSON."""
    _save_data(USERS_FILE, users)


def get_user_by_email_db(email: str) -> Optional[Dict[str, Any]]:
    """
    Recupera un utente per email dal 'database' (users.json).
    """
    users = _load_users()
    for user in users:
        if user.get("email") == email:
            return user
    return None


def get_user_by_id_db(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Recupera un utente per ID dal 'database' (users.json).
    """
    users = _load_users()
    for user in users:
        if user.get("id") == user_id:
            return user
    return None


def create_user_db(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Crea un nuovo utente nel 'database' (users.json).
    Assumes user_data is a dict representation of the User model.
    """
    users = _load_users()
    # The caller (e.g., registration endpoint in main.py) should ensure email uniqueness before calling this.
    # However, a check here can be a safeguard.
    existing_user = get_user_by_email_db(user_data.get("email"))
    if existing_user and existing_user.get("id") != user_data.get("id"):  # Different user with same email
        # This situation should ideally be prevented by the calling logic.
        # If it happens, it indicates a problem. For now, we'll log or raise.
        print(
            f"Error: Attempting to create user with email {user_data.get('email')} that already exists for another user.")
        return None  # Or raise an exception

    # Ensure ID is present (Pydantic model default_factory should handle this)
    if not user_data.get("id"):
        user_data["id"] = str(uuid.uuid4())  # Should be done by User model

    users.append(user_data)
    _save_users(users)
    return user_data


def update_user_db(user_id: str, user_update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Aggiorna un utente esistente nel 'database' (users.json).
    user_update_data è un dizionario con i campi da aggiornare.
    """
    users = _load_users()
    user_found = False
    updated_user = None
    for i, user in enumerate(users):
        if user.get("id") == user_id:
            # Merge existing user data with update data
            # Ensure not to overwrite 'id' from update_data if it's there by mistake
            original_id = user["id"]
            users[i].update(user_update_data)
            users[i]["id"] = original_id  # Preserve original ID
            updated_user = users[i]
            user_found = True
            break

    if user_found:
        _save_users(users)
        return updated_user
    return None  # User not found


# Ensure users.json is initialized
if not os.path.exists(USERS_FILE):
    _save_data(USERS_FILE, [])

# Need uuid for create_user_db safeguard for ID # Moved to top


# --- Dummy Data Generation ---
# Import models for type hinting and instantiation if needed directly
from models import Tournament as TournamentModel, Participant as ParticipantModel, Match as MatchModel
from datetime import datetime, timezone

FRONTEND_BASE_URL_FOR_DUMMY_DATA = "http://localhost:3000" # Duplicated for direct use here if main.py not imported

def _generate_dummy_matches(participants: List[ParticipantModel], tournament_format: str) -> List[MatchModel]:
    matches = []
    num_participants = len(participants)
    if num_participants < 2:
        return []

    if tournament_format == "elimination":
        match_num_counter = 1
        round_num_counter = 1
        # Simplified: assumes powers of 2 or handles byes naively.
        # For a real scenario, a proper bracket generation algorithm is needed.
        if num_participants % 2 != 0: # Odd number, first participant gets a bye
            bye_match = MatchModel(
                participant1_id=participants[0].id,
                is_bye=True,
                round_number=round_num_counter,
                match_number=match_num_counter,
                status='completed', # Byes are auto-completed
                winner_id=participants[0].id
            )
            matches.append(bye_match)
            # remaining_participants = participants[1:] # For next round logic (not fully implemented here)
            match_num_counter +=1

        # Pair the rest for the first round
        # This is still simplified and doesn't build a full bracket tree
        for i in range(num_participants % 2, num_participants, 2):
             if i + 1 < num_participants:
                p1 = participants[i]
                p2 = participants[i+1]
                match = MatchModel(
                    participant1_id=p1.id,
                    participant2_id=p2.id,
                    round_number=round_num_counter,
                    match_number=match_num_counter
                )
                matches.append(match)
                match_num_counter +=1

    elif tournament_format == "round_robin":
        match_num_counter = 1
        for i in range(num_participants):
            for j in range(i + 1, num_participants):
                p1 = participants[i]
                p2 = participants[j]
                match = MatchModel(
                    participant1_id=p1.id,
                    participant2_id=p2.id,
                    match_number=match_num_counter # Round number less critical for basic round robin display
                )
                matches.append(match)
                match_num_counter += 1
    return [m.model_dump() for m in matches] # Return as dicts


def create_dummy_data():
    """Creates dummy tournament data if tournaments.json is empty."""
    tournaments = load_tournaments()
    if tournaments:
        print("Tournaments file is not empty. Skipping dummy data creation.")
        return

    print("Creating dummy tournament data...")
    dummy_tournaments_data = []

    # Dummy User IDs - in a real app, these would be valid existing user IDs
    # For now, let's use some fixed UUIDs for consistency or generate new ones
    user_id_1 = str(uuid.uuid4())
    user_id_2 = str(uuid.uuid4())

    # Create a dummy user for user_id_1 to ensure they exist for ownership checks
    # This is a simplified way, ideally user creation is handled separately.
    users = _load_users()
    if not any(u['id'] == user_id_1 for u in users):
        users.append({"id": user_id_1, "email": "dummyowner1@example.com", "is_active": True, "hashed_password": "fakepasswordhash"})
        _save_users(users)
    if not any(u['id'] == user_id_2 for u in users):
        users.append({"id": user_id_2, "email": "dummyowner2@example.com", "is_active": True, "hashed_password": "fakepasswordhash"})
        _save_users(users)


    # Tournament 1: Beach Volley Knockout
    p1_t1 = ParticipantModel(name="Alice Wonderland", email="alice@example.com")
    p2_t1 = ParticipantModel(name="Bob The Builder", email="bob@example.com")
    p3_t1 = ParticipantModel(name="Charlie Brown", email="charlie@example.com")
    p4_t1 = ParticipantModel(name="Diana Prince", email="diana@example.com")
    participants_t1 = [p1_t1, p2_t1, p3_t1, p4_t1]

    t1_id = str(uuid.uuid4())
    tournament1 = TournamentModel(
        id=t1_id,
        user_id=user_id_1, # Assume this user exists
        name="Beach Volley Knockout",
        tournament_type="single",
        format="elimination",
        start_date=datetime.now(timezone.utc),
        participants=[p.model_dump() for p in participants_t1],
        matches=_generate_dummy_matches(participants_t1, "elimination"),
        registration_open=True,
        invitation_link=f"{FRONTEND_BASE_URL_FOR_DUMMY_DATA}/join/{str(uuid.uuid4())}"
    )
    dummy_tournaments_data.append(tournament1.model_dump())

    # Tournament 2: Chess Round Robin
    p1_t2 = ParticipantModel(name="Edward Scissorhands", email="edward@example.com")
    p2_t2 = ParticipantModel(name="Fiona Apple", email="fiona@example.com")
    p3_t2 = ParticipantModel(name="George Costanza", email="george@example.com")
    participants_t2 = [p1_t2, p2_t2, p3_t2]

    t2_id = str(uuid.uuid4())
    tournament2 = TournamentModel(
        id=t2_id,
        user_id=user_id_2, # Assume this user exists
        name="Chess Masters Round Robin",
        tournament_type="single",
        format="round_robin",
        start_date=datetime.now(timezone.utc),
        participants=[p.model_dump() for p in participants_t2],
        matches=_generate_dummy_matches(participants_t2, "round_robin"),
        registration_open=False, # Example of a closed tournament
        invitation_link=f"{FRONTEND_BASE_URL_FOR_DUMMY_DATA}/join/{str(uuid.uuid4())}"
    )
    dummy_tournaments_data.append(tournament2.model_dump())

    # Tournament 3: Ping Pong Open (more participants)
    pt3_players = [
        ParticipantModel(name="Harry Potter", email="harry@example.com"),
        ParticipantModel(name="Hermione Granger", email="hermione@example.com"),
        ParticipantModel(name="Ron Weasley", email="ron@example.com"),
        ParticipantModel(name="Draco Malfoy", email="draco@example.com"),
        ParticipantModel(name="Luna Lovegood", email="luna@example.com"),
        ParticipantModel(name="Neville Longbottom", email="neville@example.com")
    ]
    t3_id = str(uuid.uuid4())
    tournament3 = TournamentModel(
        id=t3_id,
        user_id=user_id_1,
        name="Grand Ping Pong Open",
        tournament_type="single",
        format="elimination",
        participants=[p.model_dump() for p in pt3_players],
        matches=_generate_dummy_matches(pt3_players, "elimination"),
        registration_open=True,
        invitation_link=f"{FRONTEND_BASE_URL_FOR_DUMMY_DATA}/join/{str(uuid.uuid4())}"
    )
    dummy_tournaments_data.append(tournament3.model_dump())

    save_tournaments(dummy_tournaments_data)
    print(f"Saved {len(dummy_tournaments_data)} dummy tournaments to {TOURNAMENTS_FILE}")

# Call this function once, perhaps during initial setup, or add a CLI command to trigger it.
# For example, you could add:
# if __name__ == "__main__":
# create_dummy_data()
# And run `python backend/database.py` directly.
# For now, it will be called if initialize_database_files finds an empty tournaments.json.

def initialize_database_files_with_dummies():
    _ensure_data_dir_exists()
    if not os.path.exists(USERS_FILE): # Ensure users file exists
        _save_data(USERS_FILE, [])

    if not os.path.exists(TOURNAMENTS_FILE) or not _load_data(TOURNAMENTS_FILE):
        # If tournaments file doesn't exist or is empty, create dummy data
        create_dummy_data()
    else:
        print("Tournaments file exists and is not empty. Skipping dummy data creation.")

# Replace the old initialize_database_files call with the new one
# initialize_database_files() # Old call
initialize_database_files_with_dummies() # New call
