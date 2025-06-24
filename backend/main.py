import uuid
from typing import List, Optional

from fastapi import Body, FastAPI, HTTPException, Path, status

from .database import (create_tournament_db, delete_tournament_db, get_all_tournaments_db, get_tournament_db,
                       update_tournament_db)
from .models import Match, Participant, Tournament  # Usiamo i percorsi relativi per i moduli locali

app = FastAPI(
    title="Tournament Manager API",
    description="API per la gestione di tornei sportivi.",
    version="0.1.0"
)


# --- Endpoints Tornei ---

@app.post("/tournaments/", response_model=Tournament, status_code=status.HTTP_201_CREATED,
          summary="Crea un nuovo torneo")
async def create_tournament(tournament_data: Tournament = Body(...)):
    """
    Crea un nuovo torneo con i dati forniti.
    - **name**: Nome del torneo (richiesto)
    - **tournament_type**: 'single' o 'double' (richiesto)
    - **format**: 'elimination' o 'round_robin' (richiesto)
    - **start_date**: Data di inizio (opzionale)
    """
    # Il modello Tournament già assegna un ID di default e una lista vuota di partecipanti/match
    # Potremmo voler generare qui l'invitation_link se non fornito
    if not tournament_data.invitation_link:
        # Genera un link univoco più robusto
        tournament_data.invitation_link = f"/join/{uuid.uuid4()}"

    # Salva l'intero modello, Pydantic si occupa dei default
    tournament_dict = tournament_data.model_dump()
    created_tournament = create_tournament_db(tournament_dict)
    # Riconverti da dict a modello Pydantic per la risposta, assicurando la validazione
    return Tournament(**created_tournament)


@app.get("/tournaments/", response_model=List[Tournament], summary="Ottieni tutti i tornei")
async def get_all_tournaments():
    """
    Restituisce una lista di tutti i tornei esistenti.
    """
    tournaments_db = get_all_tournaments_db()
    return [Tournament(**t) for t in tournaments_db]


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
        tournament_update: Tournament = Body(...)  # Qui potremmo usare un modello diverso per l'update parziale
):
    """
    Aggiorna i dettagli di un torneo esistente.
    *Nota: Attualmente richiede l'intero oggetto torneo per l'aggiornamento.*
    *Future versioni potrebbero supportare aggiornamenti parziali (PATCH).*
    """
    # Per un vero PUT, ci si aspetta che l'intero stato della risorsa venga sostituito.
    # Se l'ID nel body non corrisponde a quello nel path, è un errore.
    if tournament_update.id != tournament_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tournament ID in path does not match ID in body."
        )

    # Per PUT, l'intero modello viene sostituito.
    # Se un campo non è nel payload, Pydantic userà il suo default se esiste,
    # o lo lascerà non impostato se Optional.
    updated_tournament_data = tournament_update.model_dump()
    tournament_db = update_tournament_db(tournament_id, updated_tournament_data)
    if not tournament_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found for update")
    return Tournament(**tournament_db)


@app.delete("/tournaments/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Elimina un torneo")
async def delete_tournament(tournament_id: str = Path(..., description="ID del torneo da eliminare")):
    """
    Elimina un torneo specifico.
    """
    if not delete_tournament_db(tournament_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found for deletion")
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

if __name__ == "__main__":
    import uvicorn

    # Questo è solo per debug facile, non per produzione
    # uvicorn.run(app, host="0.0.0.0", port=8000)
    # Per eseguire con reload dalla root del progetto:
    # uvicorn backend.main:app --reload
    pass
