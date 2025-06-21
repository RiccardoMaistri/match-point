from fastapi import FastAPI, HTTPException, status, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import json
from uuid import UUID, uuid4
from datetime import datetime
import os
import math
import random

from models import (
    Tournament, TournamentCreate,
    Participant, ParticipantCreate,
    Match, MatchResult
)

app = FastAPI(
    title="Tournament Manager API",
    description="API per la gestione di tornei sportivi.",
    version="0.1.0"
)

# CORS middleware (allow all for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "data"
TOURNAMENTS_FILE = os.path.join(DATA_DIR, "tournaments.json")
# PARTICIPANTS_FILE e MATCHES_FILE non sono più usati come file separati
# perché i partecipanti e le partite sono ora annidati dentro ciascun torneo.

def ensure_data_dir_exists():
    os.makedirs(DATA_DIR, exist_ok=True)

def load_data(file_path: str) -> List[Dict]:
    ensure_data_dir_exists()
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def_save_data(file_path: str, data: List[Dict]):
    def_ensure_data_dir_exists()
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4, default=str) # default=str per datetime e UUID

# Carica i dati all'avvio (simulazione di un "database")
tournaments_db: List[Tournament] = [Tournament(**t) for t in load_data(TOURNAMENTS_FILE)]

def find_tournament_by_id(tournament_id: UUID) -> Optional[Tournament]:
    for t in tournaments_db:
        if t.id == tournament_id:
            return t
    return None

def find_match_by_id(tournament: Tournament, match_id: UUID) -> Optional[Match]:
    for m in tournament.matches:
        if m.id == match_id:
            return m
    return None

def find_participant_by_id(tournament: Tournament, participant_id: UUID) -> Optional[Participant]:
    for p in tournament.participants:
        if p.id == participant_id:
            return p
    return None


# --- Tournament Endpoints ---

@app.post("/tournaments", response_model=Tournament, status_code=status.HTTP_201_CREATED, summary="Crea un nuovo torneo")
async def create_tournament(tournament_data: TournamentCreate):
    """
    Crea un nuovo torneo.
    - **name**: Nome del torneo (stringa)
    - **type**: Tipologia ('singolo' o 'doppio')
    - **format**: Formato ('eliminazione diretta' o 'girone all'italiana')
    - **start_date**: Data di inizio (opzionale, formato ISO datetime)
    - **end_date**: Data di fine (opzionale, formato ISO datetime)
    """
    new_tournament = Tournament(
        id=uuid4(),
        name=tournament_data.name,
        type=tournament_data.type,
        format=tournament_data.format,
        start_date=tournament_data.start_date,
        end_date=tournament_data.end_date,
        participants=[],
        matches=[],
        invitation_link=f"/tournaments/{str(uuid4())}/join" # Semplice link di invito
    )
    tournaments_db.append(new_tournament)
    save_data(TOURNAMENTS_FILE, [t.model_dump() for t in tournaments_db])
    return new_tournament

@app.get("/tournaments", response_model=List[Tournament], summary="Ottieni la lista di tutti i tornei")
async def get_all_tournaments():
    """
    Restituisce una lista di tutti i tornei creati.
    """
    return tournaments_db

@app.get("/tournaments/{tournament_id}", response_model=Tournament, summary="Ottieni i dettagli di un torneo")
async def get_tournament_details(tournament_id: UUID = Path(..., description="ID del torneo da recuperare")):
    """
    Restituisce i dettagli di un torneo specifico, inclusi partecipanti e partite.
    """
    tournament = find_tournament_by_id(tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torneo non trovato")
    return tournament

@app.put("/tournaments/{tournament_id}", response_model=Tournament, summary="Aggiorna un torneo esistente")
async def update_tournament(tournament_data: TournamentCreate, tournament_id: UUID = Path(..., description="ID del torneo da aggiornare")):
    """
    Aggiorna i dettagli di un torneo esistente.
    """
    tournament = find_tournament_by_id(tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torneo non trovato")

    tournament.name = tournament_data.name
    tournament.type = tournament_data.type
    tournament.format = tournament_data.format
    tournament.start_date = tournament_data.start_date
    tournament.end_date = tournament_data.end_date
    # Non permettiamo di modificare partecipanti o partite direttamente qui per ora

    save_data(TOURNAMENTS_FILE, [t.model_dump() for t in tournaments_db])
    return tournament

@app.delete("/tournaments/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Elimina un torneo")
async def delete_tournament(tournament_id: UUID = Path(..., description="ID del torneo da eliminare")):
    """
    Elimina un torneo specifico.
    """
    global tournaments_db
    tournament_to_delete = find_tournament_by_id(tournament_id)
    if not tournament_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torneo non trovato")

    tournaments_db = [t for t in tournaments_db if t.id != tournament_id]
    save_data(TOURNAMENTS_FILE, [t.model_dump() for t in tournaments_db])
    return


# --- Participant Endpoints ---

@app.post("/tournaments/{tournament_id}/participants", response_model=Participant, status_code=status.HTTP_201_CREATED, summary="Aggiungi un partecipante a un torneo")
async def add_participant_to_tournament(
    participant_data: ParticipantCreate,
    tournament_id: UUID = Path(..., description="ID del torneo a cui aggiungere il partecipante")
):
    """
    Aggiunge un nuovo partecipante a un torneo specifico.
    - **name**: Nome del partecipante
    - **email**: Email del partecipante
    - **ranking**: Ranking (opzionale)
    """
    tournament = find_tournament_by_id(tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torneo non trovato")

    # Controlla se l'email esiste già nel torneo
    if any(p.email == participant_data.email for p in tournament.participants):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Un partecipante con questa email esiste già nel torneo.")

    new_participant = Participant(
        id=uuid4(),
        name=participant_data.name,
        email=participant_data.email,
        ranking=participant_data.ranking
    )
    tournament.participants.append(new_participant)
    save_data(TOURNAMENTS_FILE, [t.model_dump() for t in tournaments_db])
    return new_participant

@app.get("/tournaments/{tournament_id}/participants", response_model=List[Participant], summary="Ottieni la lista dei partecipanti di un torneo")
async def get_tournament_participants(tournament_id: UUID = Path(..., description="ID del torneo")):
    """
    Restituisce la lista di tutti i partecipanti per un torneo specifico.
    """
    tournament = find_tournament_by_id(tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torneo non trovato")
    return tournament.participants

@app.delete("/tournaments/{tournament_id}/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Rimuovi un partecipante da un torneo")
async def remove_participant_from_tournament(
    tournament_id: UUID = Path(..., description="ID del torneo"),
    participant_id: UUID = Path(..., description="ID del partecipante da rimuovere")
):
    """
    Rimuove un partecipante da un torneo specifico.
    """
    tournament = find_tournament_by_id(tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torneo non trovato")

    participant_to_remove = find_participant_by_id(tournament, participant_id)
    if not participant_to_remove:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partecipante non trovato nel torneo")

    tournament.participants = [p for p in tournament.participants if p.id != participant_id]
    # Se il partecipante era in qualche match, potremmo volerlo annullare o gestire
    save_data(TOURNAMENTS_FILE, [t.model_dump() for t in tournaments_db])
    return


# --- Match Generation and Management ---

def generate_elimination_bracket(participants: List[Participant]) -> List[Match]:
    """
    Genera un tabellone a eliminazione diretta.
    I partecipanti vengono mescolati e accoppiati.
    Se il numero di partecipanti non è una potenza di 2, alcuni passano il primo turno (bye).
    """
    matches = []
    num_participants = len(participants)
    if num_participants < 2:
        return []

    # Mescola i partecipanti per accoppiamenti casuali
    shuffled_participants = random.sample(participants, num_participants)

    # Calcola il numero di round e il numero di posti nel primo round (potenza di 2 >= num_participants)
    num_rounds = math.ceil(math.log2(num_participants))
    bracket_size = 2 ** num_rounds # Dimensione ideale del bracket (potenza di 2)

    # Numero di "bye" (partecipanti che passano il primo turno automaticamente)
    byes = bracket_size - num_participants

    round_number = 1
    current_round_participants = [] # Lista di ID o Participant stessi

    # Primo round: accoppia i partecipanti che non hanno un bye
    participants_playing_round1 = shuffled_participants[byes:]
    participants_with_byes = shuffled_participants[:byes]

    # Aggiungi i "bye" direttamente come "vincitori" del loro finto match del primo turno (o come in attesa nel secondo)
    for i in range(byes):
        # Questi partecipanti passano al secondo turno
        # Potremmo creare un "match" fittizio o semplicemente gestirli nel prossimo round
        # Per semplicità, li aggiungiamo alla lista dei partecipanti del prossimo round
        # current_round_participants.append(participants_with_byes[i].id)
        pass # La logica di gestione dei bye è complessa per un bracket visuale, per ora li ignoriamo nella generazione diretta dei match
             # Idealmente, si creano match con un solo partecipante che avanza


    # Gestione semplificata per ora: accoppia i partecipanti disponibili
    # Questa è una versione base, non gestisce i "bye" in modo completo per la struttura del bracket
    # Per un bracket completo, si dovrebbero creare "slot" e poi popolarli.

    temp_participants = list(shuffled_participants) # Copia per manipolazione

    # Round 1
    round_matches = []
    match_num_in_round = 1
    while len(temp_participants) >= 2:
        p1 = temp_participants.pop(0)
        p2 = temp_participants.pop(0)
        match = Match(
            participant1_id=p1.id,
            participant2_id=p2.id,
            round_number=round_number,
            match_number_in_round=match_num_in_round
        )
        round_matches.append(match)
        match_num_in_round += 1
    matches.extend(round_matches)

    # Se c'è un partecipante spaiato (numero dispari), questo è un problema per l'eliminazione diretta base
    # Una gestione corretta dei "bye" risolverebbe questo.
    # Per ora, se avanza un partecipante, non verrà accoppiato.

    # Generazione dei round successivi (molto semplificata, non crea un bracket completo)
    # Un vero bracket generator è più complesso, tiene traccia delle posizioni.
    # Questa versione crea solo i match del primo turno.
    # Per i turni successivi, i match si creano man mano che i vincitori avanzano.

    return matches


def generate_round_robin_schedule(participants: List[Participant]) -> List[Match]:
    """
    Genera un calendario per un girone all'italiana (ogni partecipante incontra ogni altro).
    """
    matches = []
    num_participants = len(participants)
    if num_participants < 2:
        return []

    # Algoritmo Round Robin (Circle method)
    # Aggiungi un partecipante "fantasma" se il numero è dispari per bilanciare i round
    local_participants = list(participants) # Copia
    ghost = False
    if num_participants % 2 != 0:
        ghost = True
        local_participants.append(Participant(id=uuid4(), name="BYE", email="bye@example.com")) # Dummy participant
        num_participants += 1

    # Crea le giornate (rounds)
    # In ogni giornata, ogni partecipante (tranne uno fisso) ruota
    fixed_participant = local_participants[0]
    rotating_participants = local_participants[1:]

    for r in range(num_participants - 1): # Numero di giornate
        match_num_in_round = 1
        # Accoppia il partecipante fisso con l'ultimo dei rotanti (che arriva in prima posizione dopo la rotazione)
        p1 = fixed_participant
        p2 = rotating_participants[-1]
        if not (ghost and (p1.name == "BYE" or p2.name == "BYE")): # Non creare match con il fantasma
            match = Match(
                participant1_id=p1.id,
                participant2_id=p2.id,
                round_number=r + 1,
                match_number_in_round=match_num_in_round
            )
            matches.append(match)
            match_num_in_round +=1

        # Accoppia gli altri partecipanti
        for i in range((num_participants // 2) - 1):
            p1 = rotating_participants[i]
            p2 = rotating_participants[num_participants - 2 - i] # Indice opposto
            if not (ghost and (p1.name == "BYE" or p2.name == "BYE")):
                match = Match(
                    participant1_id=p1.id,
                    participant2_id=p2.id,
                    round_number=r + 1,
                    match_number_in_round=match_num_in_round
                )
                matches.append(match)
                match_num_in_round +=1

        # Ruota i partecipanti (l'ultimo diventa il primo dei rotanti)
        rotating_participants.insert(0, rotating_participants.pop())

    return matches


@app.post("/tournaments/{tournament_id}/generate-schedule", response_model=Tournament, summary="Genera il tabellone o il calendario per un torneo")
async def generate_tournament_schedule(tournament_id: UUID = Path(..., description="ID del torneo per cui generare il calendario/tabellone")):
    """
    Genera automaticamente il tabellone (eliminazione diretta) o il calendario (girone all'italiana)
    per un torneo. Sovrascrive eventuali partite esistenti.
    Richiede che ci siano almeno 2 partecipanti.
    """
    tournament = find_tournament_by_id(tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torneo non trovato")

    if len(tournament.participants) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sono necessari almeno 2 partecipanti per generare un calendario/tabellone.")

    if tournament.format == "eliminazione diretta":
        # La generazione del bracket di eliminazione diretta è più complessa per i round successivi.
        # Questa funzione genererà solo il primo round. I round successivi
        # dovrebbero essere creati quando i vincitori avanzano.
        # Per un bracket completo, si potrebbero usare librerie o una logica più avanzata.
        tournament.matches = generate_elimination_bracket(tournament.participants)
        if not tournament.matches:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Non è stato possibile generare il tabellone (es. numero dispari di partecipanti per eliminazione diretta base).")
    elif tournament.format == "girone all'italiana":
        tournament.matches = generate_round_robin_schedule(tournament.participants)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formato torneo non supportato per la generazione automatica.")

    save_data(TOURNAMENTS_FILE, [t.model_dump() for t in tournaments_db])
    return tournament


@app.get("/tournaments/{tournament_id}/matches", response_model=List[Match], summary="Ottieni le partite di un torneo")
async def get_tournament_matches(tournament_id: UUID = Path(..., description="ID del torneo")):
    """
    Restituisce la lista di tutte le partite per un torneo specifico.
    """
    tournament = find_tournament_by_id(tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torneo non trovato")
    return tournament.matches


@app.post("/tournaments/{tournament_id}/matches/{match_id}/result", response_model=Match, summary="Inserisci o aggiorna il risultato di una partita")
async def record_match_result(
    result_data: MatchResult,
    tournament_id: UUID = Path(..., description="ID del torneo"),
    match_id: UUID = Path(..., description="ID della partita")
):
    """
    Registra il risultato di una partita.
    - **participant1_score**: Punteggio del partecipante 1
    - **participant2_score**: Punteggio del partecipante 2
    - **winner_id**: ID del partecipante vincitore
    - **status**: Stato della partita (es. 'completed')
    """
    tournament = find_tournament_by_id(tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torneo non trovato")

    match = find_match_by_id(tournament, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata nel torneo")

    if match.participant1_id != result_data.winner_id and match.participant2_id != result_data.winner_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="L'ID del vincitore non corrisponde a nessuno dei partecipanti della partita.")

    if match.status == "completed" and match.winner_id is not None:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Il risultato per questa partita è già stato registrato e completato.")


    match.participant1_score = result_data.participant1_score
    match.participant2_score = result_data.participant2_score
    match.winner_id = result_data.winner_id
    match.status = result_data.status

    save_data(TOURNAMENTS_FILE, [t.model_dump() for t in tournaments_db])

    # Logica post-risultato (es. avanzamento nel bracket di eliminazione diretta)
    # if tournament.format == "eliminazione diretta" and match.status == "completed" and match.winner_id:
    #     # Trova il prossimo match per il vincitore
    #     # Questa parte richiede una struttura di bracket più definita
    #     pass

    return match


# --- Utility Endpoints (es. per visualizzazione tabellone/classifica) ---

@app.get("/tournaments/{tournament_id}/bracket", response_model=List[Match], summary="Ottieni il tabellone (per eliminazione diretta)")
async def get_tournament_bracket(tournament_id: UUID = Path(..., description="ID del torneo")):
    """
    Restituisce le partite organizzate in modo da poter visualizzare un tabellone
    per tornei a eliminazione diretta.
    NOTA: Questa è una versione semplificata, restituisce solo la lista delle partite.
    Una vera struttura a tabellone richiederebbe una formattazione diversa.
    """
    tournament = find_tournament_by_id(tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torneo non trovato")
    if tournament.format != "eliminazione diretta":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Questo endpoint è solo per tornei a eliminazione diretta.")

    # Ordina per round e poi per numero di match nel round per una visualizzazione più logica
    sorted_matches = sorted(
        tournament.matches,
        key=lambda m: (m.round_number or float('inf'), m.match_number_in_round or float('inf'))
    )
    return sorted_matches


@app.get("/tournaments/{tournament_id}/standings", response_model=List[Dict], summary="Ottieni la classifica (per girone all'italiana)")
async def get_tournament_standings(tournament_id: UUID = Path(..., description="ID del torneo")):
    """
    Calcola e restituisce la classifica per un torneo a girone all'italiana.
    La classifica è basata su: Punti (3 per vittoria, 1 per pareggio), Differenza reti/punti, Punti fatti.
    """
    tournament = find_tournament_by_id(tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torneo non trovato")
    if tournament.format != "girone all'italiana":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Questo endpoint è solo per tornei a girone all'italiana.")

    if not tournament.participants:
        return []

    standings = {p.id: {"name": p.name, "email": p.email, "played": 0, "wins": 0, "draws": 0, "losses": 0, "gf": 0, "ga": 0, "gd": 0, "points": 0} for p in tournament.participants}

    for match in tournament.matches:
        if match.status == "completed" and match.participant1_id and match.participant2_id and \
           match.participant1_score is not None and match.participant2_score is not None:

            p1_id, p2_id = match.participant1_id, match.participant2_id
            s1, s2 = match.participant1_score, match.participant2_score

            if p1_id not in standings or p2_id not in standings: continue # Partecipante non più nel torneo?

            standings[p1_id]["played"] += 1
            standings[p2_id]["played"] += 1
            standings[p1_id]["gf"] += s1
            standings[p1_id]["ga"] += s2
            standings[p2_id]["gf"] += s2
            standings[p2_id]["ga"] += s1
            standings[p1_id]["gd"] = standings[p1_id]["gf"] - standings[p1_id]["ga"]
            standings[p2_id]["gd"] = standings[p2_id]["gf"] - standings[p2_id]["ga"]

            if match.winner_id == p1_id:
                standings[p1_id]["wins"] += 1
                standings[p1_id]["points"] += 3
                standings[p2_id]["losses"] += 1
            elif match.winner_id == p2_id:
                standings[p2_id]["wins"] += 1
                standings[p2_id]["points"] += 3
                standings[p1_id]["losses"] += 1
            else: # Pareggio (se winner_id è None e status completed, o se i punteggi sono uguali)
                  # La nostra logica MatchResult richiede un winner_id, quindi un pareggio puro non è gestito.
                  # Assumiamo che se winner_id non è specificato ma i punteggi sono uguali, è un pareggio.
                  # Per ora, la logica di vittoria è basata su winner_id.
                  # Se si vogliono i pareggi, MatchResult e la logica qui devono cambiare.
                  # Ad esempio, se s1 == s2 e winner_id è None:
                  # standings[p1_id]["draws"] += 1
                  # standings[p2_id]["draws"] += 1
                  # standings[p1_id]["points"] += 1
                  # standings[p2_id]["points"] += 1
                  pass


    # Converti il dizionario di classifiche in una lista e ordinala
    sorted_standings = sorted(
        standings.values(),
        key=lambda x: (x["points"], x["gd"], x["gf"]),
        reverse=True
    )
    return sorted_standings


if __name__ == "__main__":
    import uvicorn
    ensure_data_dir_exists()
    # Crea file JSON vuoti se non esistono per evitare errori al primo avvio se non ci sono dati
    if not os.path.exists(TOURNAMENTS_FILE): save_data(TOURNAMENTS_FILE, [])

    uvicorn.run(app, host="0.0.0.0", port=8000)
