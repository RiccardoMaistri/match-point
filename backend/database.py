import json
import math
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
            tournaments[i] = tournament_update_data
            save_tournaments(tournaments)
            return tournament_update_data
    return None


def delete_tournament_db(tournament_id: str) -> bool:
    tournaments = load_tournaments()
    original_length = len(tournaments)
    tournaments = [t for t in tournaments if t.get("id") != tournament_id]
    if len(tournaments) < original_length:
        save_tournaments(tournaments)
        return True
    return False


def record_match_result_db(tournament_id: str, match_id: str, winner_id: str) -> Optional[Dict[str, Any]]:
    """Records a match result and updates the tournament bracket for elimination tournaments."""
    tournament = get_tournament_db(tournament_id)
    if not tournament or tournament.get("format") != "elimination":
        print(f"Tournament {tournament_id} not found or not an elimination tournament.")
        return None

    matches = tournament.get("matches", [])
    
    current_match = None
    for m in matches:
        if m.get("id") == match_id:
            current_match = m
            break
    
    if not current_match:
        print(f"Match {match_id} not found in tournament {tournament_id}.")
        return None

    # Update current match
    current_match["winner_id"] = winner_id
    current_match["status"] = "completed"

    # --- Advance winner to next round ---
    num_participants = len(tournament.get("participants", []))
    if num_participants == 0:
        return update_tournament_db(tournament_id, tournament)

    num_rounds = math.ceil(math.log2(num_participants))
    current_round_num = current_match.get("round_number")

    if current_round_num is None or current_round_num >= num_rounds:
        # This was the final match or a match with no round number
        if current_round_num and current_round_num >= num_rounds:
            tournament["status"] = "completed"
        return update_tournament_db(tournament_id, tournament)

    current_match_num_in_round = current_match.get("match_number")
    if current_match_num_in_round is None:
        return update_tournament_db(tournament_id, tournament)

    next_round_num = current_round_num + 1
    next_match_num_in_round = current_match_num_in_round // 2
    
    next_match = None
    for m in matches:
        if m.get("round_number") == next_round_num and m.get("match_number") == next_match_num_in_round:
            next_match = m
            break
            
    if next_match:
        if current_match_num_in_round % 2 == 0:
            next_match["participant1_id"] = winner_id
        else:
            next_match["participant2_id"] = winner_id
            
        if next_match.get("participant1_id") and next_match.get("participant2_id"):
            next_match["status"] = "pending"

    # The update_tournament_db function saves the whole tournament object.
    # We have modified `tournament` in place, so we just need to call it.
    return update_tournament_db(tournament_id, tournament)


# --- Inizializzazione (opzionale, per assicurarsi che i file esistano) ---
FEEDBACK_FILE = os.path.join(DATA_DIR, "feedback.json")

def initialize_database_files():
    _ensure_data_dir_exists()
    if not os.path.exists(TOURNAMENTS_FILE):
        _save_data(TOURNAMENTS_FILE, [])
    if not os.path.exists(FEEDBACK_FILE):
        _save_data(FEEDBACK_FILE, [])
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
    if not email:
        return None
    users = _load_users()
    email_lower = email.lower()
    for user in users:
        if user.get("email") and user.get("email").lower() == email_lower:
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
    user_data["email"] = user_data["email"].lower()
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
            if 'email' in users[i]:
                users[i]['email'] = users[i]['email'].lower()
            updated_user = users[i]
            user_found = True
            break

    if user_found:
        _save_users(users)
        return updated_user
    return None  # User not found


def save_feedback_db(feedback_data: Dict[str, Any]) -> Dict[str, Any]:
    feedback_list = _load_data(FEEDBACK_FILE)
    feedback_list.append(feedback_data)
    _save_data(FEEDBACK_FILE, feedback_list)
    return feedback_data

def get_all_feedback_db() -> List[Dict[str, Any]]:
    return _load_data(FEEDBACK_FILE)

# Ensure users.json is initialized
if not os.path.exists(USERS_FILE):
    _save_data(USERS_FILE, [])
