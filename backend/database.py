import json
import os
from typing import Any, Dict, List, Optional, TypeVar

from pydantic import BaseModel

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
