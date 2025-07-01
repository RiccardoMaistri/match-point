import json
import os
import uuid  # For generating IDs
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
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, "r") as f:
            # Prima leggi il contenuto, poi fai il parse
            content = f.read()
            if not content.strip():  # File vuoto o solo spazi bianchi
                return []
            return json.loads(content)  # Usa json.loads per stringhe
    except FileNotFoundError:
        return []  # Il file non esiste
    except json.JSONDecodeError:
        print(f"Warning: Could not decode JSON from {filepath}. Returning empty list.")
        return []  # File malformato


def _save_data(filepath: str, data: List[Dict[str, Any]]):
    """Salva dati in un file JSON."""
    _ensure_data_dir_exists()
    with open(filepath, "w") as f:
        json.dump(data, f, indent=4, default=str)  # default=str per datetime


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
    # Check for existing user by email before creating
    if get_user_by_email_db(user_data.get("email")):
        print("sdasdsa")
        # This case should ideally be handled by the caller (e.g., in main.py endpoint)
        # For now, let's just not add if email exists, or raise an error.
        # Raising an error or returning None might be better.
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
