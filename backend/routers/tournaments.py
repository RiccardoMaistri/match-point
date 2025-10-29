import uuid
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Path, status

from auth import get_current_active_user, get_optional_current_active_user
from database_adapter import (
    create_tournament_db,
    delete_tournament_db,
    get_all_tournaments_db,
    get_tournament_db,
    update_tournament_db,
)
from models import (
    Match,
    Participant,
    Tournament,
    TournamentCreate,
    User,
)
from services.playoff_service import _generate_playoffs_from_standings
from services.standings_service import _calculate_standings

router = APIRouter()

@router.post(
    "/",
    response_model=Tournament,
    status_code=status.HTTP_201_CREATED,
    summary="Crea un nuovo torneo",
)
async def create_tournament(
    tournament_payload: TournamentCreate,
    current_user: User = Depends(get_current_active_user),
):
    new_tournament_data = Tournament(
        **tournament_payload.model_dump(), user_id=current_user.id
    )

    if current_user.email:
        creator_as_participant = Participant(
            name=current_user.name or current_user.email,
            email=current_user.email,
        )
        new_tournament_data.participants.append(creator_as_participant)

    if not new_tournament_data.invitation_link:
        invite_code = str(uuid.uuid4())
        new_tournament_data.invitation_link = f"/join/{invite_code}"

    created_tournament_dict = create_tournament_db(new_tournament_data.model_dump())
    return Tournament(**created_tournament_dict)


@router.get(
    "/",
    response_model=List[Tournament],
    summary="Ottieni tutti i tornei",
)
async def get_all_tournaments(
    current_user: Optional[User] = Depends(get_optional_current_active_user),
):
    all_tournaments_db = get_all_tournaments_db()

    if current_user and current_user.email:
        user_tournaments_dict = {}
        for t_dict in all_tournaments_db:
            tournament = Tournament(**t_dict)

            if tournament.user_id == current_user.id:
                user_tournaments_dict[tournament.id] = tournament
                continue

            for participant in tournament.participants:
                if participant.email == current_user.email:
                    user_tournaments_dict[tournament.id] = tournament
                    break

        return list(user_tournaments_dict.values())
    else:
        return [Tournament(**t) for t in all_tournaments_db]


@router.get(
    "/{tournament_id}",
    response_model=Tournament,
    summary="Ottieni un torneo specifico",
)
async def get_tournament(
    tournament_id: str = Path(..., description="ID del torneo da recuperare"),
):
    tournament_db = get_tournament_db(tournament_id)
    if not tournament_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )
    return Tournament(**tournament_db)


@router.put(
    "/{tournament_id}",
    response_model=Tournament,
    status_code=status.HTTP_200_OK,
    summary="Aggiorna un torneo esistente",
)
async def update_tournament(
    tournament_id: str = Path(..., description="ID del torneo da aggiornare"),
    tournament_update_payload: TournamentCreate = Body(
        ..., description="Dati aggiornati del torneo"
    ),
    current_user: User = Depends(get_current_active_user),
):
    existing_tournament_dict = get_tournament_db(tournament_id)
    if not existing_tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )

    existing_tournament = Tournament(**existing_tournament_dict)

    if existing_tournament.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this tournament",
        )

    update_data = tournament_update_payload.model_dump(exclude_unset=True)
    updated_tournament = existing_tournament.copy(update=update_data)

    if not updated_tournament.invitation_link:
        invite_code = str(uuid.uuid4())
        updated_tournament.invitation_link = f"/join/{invite_code}"

    tournament_db = update_tournament_db(
        tournament_id, updated_tournament.model_dump()
    )
    if not tournament_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found during update process",
        )
    return Tournament(**tournament_db)


@router.delete(
    "/{tournament_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Elimina un torneo",
)
async def delete_tournament(
    tournament_id: str = Path(..., description="ID del torneo da eliminare"),
    current_user: User = Depends(get_current_active_user),
):
    tournament_to_delete = get_tournament_db(tournament_id)
    if not tournament_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )

    if tournament_to_delete.get("user_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this tournament",
        )

    if not delete_tournament_db(tournament_id):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete tournament from database",
        )

    return


@router.get(
    "/{tournament_id}/participants/",
    response_model=List[Participant],
    summary="Ottieni i partecipanti di un torneo",
)
async def get_tournament_participants(
    tournament_id: str = Path(..., description="ID del torneo"),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )
    tournament = Tournament(**tournament_dict)
    return tournament.participants


@router.get(
    "/by-invite/{invite_code}",
    response_model=Tournament,
    summary="Get tournament details by invite code",
)
async def get_tournament_by_invite_code(
    invite_code: str = Path(
        ..., description="The invitation code (UUID part of the link)"
    ),
):
    all_tournaments = get_all_tournaments_db()
    for t_dict in all_tournaments:
        stored_invite_link = t_dict.get("invitation_link")
        if stored_invite_link and stored_invite_link.endswith(f"/{invite_code}"):
            return Tournament(**t_dict)
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Tournament not found or invalid invite code.",
    )


@router.delete(
    "/{tournament_id}/participants/{participant_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Rimuovi un partecipante da un torneo",
)
async def remove_participant_from_tournament(
    tournament_id: str = Path(..., description="ID del torneo"),
    participant_id: str = Path(..., description="ID del partecipante da rimuovere"),
    current_user: User = Depends(get_current_active_user),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )

    tournament = Tournament(**tournament_dict)

    if tournament.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to remove participants from this tournament",
        )

    if tournament.status != 'open':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot remove participants after the tournament has started.",
        )

    participant_to_remove = next((p for p in tournament.participants if p.id == participant_id), None)

    if not participant_to_remove:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found in this tournament",
        )

    if participant_to_remove.email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The tournament creator cannot be removed from the participants list.",
        )

    tournament.participants = [
        p for p in tournament.participants if p.id != participant_id
    ]

    update_tournament_db(tournament_id, tournament.model_dump())
    return


@router.post(
    "/{tournament_id}/join_authenticated",
    response_model=Participant,
    status_code=status.HTTP_201_CREATED,
    summary="Join a tournament as an authenticated user",
)
async def join_tournament_authenticated(
    tournament_id: str = Path(..., description="ID of the tournament to join"),
    current_user: User = Depends(get_current_active_user),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )

    tournament = Tournament(**tournament_dict)

    if tournament.status != 'open':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration for this tournament is closed.",
        )

    for p in tournament.participants:
        if p.email == current_user.email:
            return p

    participant_name = current_user.name or current_user.email
    new_participant = Participant(name=participant_name, email=current_user.email)
    tournament.participants.append(new_participant)
    update_tournament_db(tournament_id, tournament.model_dump())
    return new_participant


@router.post(
    "/{tournament_id}/matches/generate",
    summary="Genera bracket/calendario per un torneo",
)
async def generate_matches_for_tournament(
    tournament_id: str = Path(..., description="ID del torneo"),
    current_user: User = Depends(get_current_active_user),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )

    tournament = Tournament(**tournament_dict)

    if tournament.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate matches for this tournament",
        )

    if not tournament.participants or len(tournament.participants) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough participants to generate matches.",
        )

    tournament.matches = []
    tournament.status = "group_stage"
    tournament.registration_open = False
    
    if tournament.format == "round_robin":
        participants = tournament.participants[:]
        num_participants = len(participants)
        
        total_matches = (num_participants * (num_participants - 1)) // 2
        matches_per_day = num_participants // 2
        tournament.total_matchdays = (total_matches + matches_per_day - 1) // matches_per_day
        
        if num_participants % 2 == 1:
            participants.append(None)
            num_participants += 1
        
        match_num = 1
        
        for matchday in range(num_participants - 1):
            
            for i in range(num_participants // 2):
                p1_idx = i
                p2_idx = num_participants - 1 - i
                
                p1 = participants[p1_idx]
                p2 = participants[p2_idx]
                
                if p1 is not None and p2 is not None:
                    match = Match(
                        participant1_id=p1.id,
                        participant2_id=p2.id,
                        match_number=match_num,
                        match_day=matchday + 1,
                        phase='group',
                    )
                    tournament.matches.append(match)
                    match_num += 1
            
            participants = [participants[0]] + [participants[-1]] + participants[1:-1]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only round_robin format is supported.",
        )

    update_tournament_db(tournament_id, tournament.model_dump())
    return {
        "message": "Group stage matches generated",
        "tournament_id": tournament_id,
        "total_matchdays": tournament.total_matchdays,
        "matches": tournament.matches,
    }


@router.get(
    "/{tournament_id}/matches",
    response_model=List[Match],
    summary="Ottieni i match di un torneo",
)
async def get_tournament_matches(
    tournament_id: str = Path(..., description="ID del torneo"),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )
    tournament = Tournament(**tournament_dict)
    return tournament.matches


@router.post(
    "/{tournament_id}/matches/{match_id}/result",
    response_model=Match,
    summary="Inserisci/Aggiorna il risultato di un match",
)
async def record_match_result(
    tournament_id: str = Path(..., description="ID del torneo"),
    match_id: str = Path(..., description="ID del match"),
    score_participant1_set1: Optional[int] = Body(None, embed=True),
    score_participant2_set1: Optional[int] = Body(None, embed=True),
    score_participant1_set2: Optional[int] = Body(None, embed=True),
    score_participant2_set2: Optional[int] = Body(None, embed=True),
    current_user: User = Depends(get_current_active_user),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )

    tournament = Tournament(**tournament_dict)
    match_to_update = None
    match_index = -1

    for i, m in enumerate(tournament.matches):
        if m.id == match_id:
            match_to_update = m
            match_index = i
            break

    if not match_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found in this tournament",
        )

    if match_to_update.is_bye:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot record result for a bye match",
        )

    participant1 = next(
        (p for p in tournament.participants if p.id == match_to_update.participant1_id),
        None,
    )
    participant2 = next(
        (p for p in tournament.participants if p.id == match_to_update.participant2_id),
        None,
    )

    participant_emails = []
    if participant1:
        participant_emails.append(participant1.email)
    if participant2:
        participant_emails.append(participant2.email)

    if current_user.email not in participant_emails and current_user.id != tournament.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to record results for this match.",
        )

    if score_participant1_set1 is not None:
        match_to_update.set1_score_participant1 = score_participant1_set1
    if score_participant2_set1 is not None:
        match_to_update.set1_score_participant2 = score_participant2_set1
    if score_participant1_set2 is not None:
        match_to_update.set2_score_participant1 = score_participant1_set2
    if score_participant2_set2 is not None:
        match_to_update.set2_score_participant2 = score_participant2_set2

    score1 = (score_participant1_set1 or 0) + (score_participant1_set2 or 0)
    score2 = (score_participant2_set1 or 0) + (score_participant2_set2 or 0)
    match_to_update.score_participant1 = score1
    match_to_update.score_participant2 = score2

    if score1 is not None and score2 is not None:
        if score1 > score2:
            match_to_update.winner_id = match_to_update.participant1_id
        elif score2 > score1:
            match_to_update.winner_id = match_to_update.participant2_id
        else:
            pass

    if match_to_update.winner_id:
        match_to_update.status = "completed"
    elif score1 is not None or score2 is not None:
        match_to_update.status = "in_progress"

    tournament.matches[match_index] = match_to_update

    if tournament.status == 'group_stage':
        group_matches = [m for m in tournament.matches if m.phase == 'group']
        if all(m.status == 'completed' for m in group_matches):
            tournament = _generate_playoffs_from_standings(tournament)

    if match_to_update.phase == 'playoff' and match_to_update.status == 'completed':
        current_round = match_to_update.round_number
        playoff_matches = [m for m in tournament.matches if m.phase == 'playoff']
        
        current_round_matches = [m for m in playoff_matches if m.round_number == current_round]
        
        if all(m.status == 'completed' for m in current_round_matches):
            
            sorted_round_matches = sorted(current_round_matches, key=lambda m: m.match_number)
            winners = [m.winner_id for m in sorted_round_matches if m.winner_id]
            
            if len(winners) == 1:
                if any(not m.is_bye for m in current_round_matches):
                    tournament.status = "completed"

            elif len(winners) > 1:
                next_round = current_round + 1
                next_round_matches_exist = any(m.round_number == next_round for m in playoff_matches)
                
                if not next_round_matches_exist:
                    match_num = max((m.match_number for m in tournament.matches), default=0) + 1
                    
                    paired_winners = list(winners)
                    while len(paired_winners) >= 2:
                        p1_id = paired_winners.pop(0)
                        p2_id = paired_winners.pop(-1)
                        new_match = Match(
                            participant1_id=p1_id,
                            participant2_id=p2_id,
                            match_number=match_num,
                            round_number=next_round,
                            phase='playoff',
                        )
                        tournament.matches.append(new_match)
                        match_num += 1

    update_tournament_db(tournament_id, tournament.model_dump())
    return match_to_update


@router.get(
    "/{tournament_id}/bracket",
    summary="Ottieni il tabellone (per eliminazione diretta)",
)
async def get_tournament_bracket(
    tournament_id: str = Path(..., description="ID del torneo"),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )
    tournament = Tournament(**tournament_dict)
    if tournament.format != "elimination":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bracket view is for elimination tournaments only.",
        )
    return {
        "tournament_id": tournament.id,
        "name": tournament.name,
        "matches": tournament.matches,
    }


@router.get(
    "/{tournament_id}/schedule",
    summary="Ottieni il calendario (per girone all'italiana)",
)
async def get_tournament_schedule(
    tournament_id: str = Path(..., description="ID del torneo"),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )
    tournament = Tournament(**tournament_dict)
    if tournament.format != "round_robin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Schedule view is for round-robin tournaments only.",
        )
    return {
        "tournament_id": tournament.id,
        "name": tournament.name,
        "matches": tournament.matches,
    }


@router.get(
    "/{tournament_id}/standings",
    summary="Get current tournament standings",
)
async def get_tournament_standings(
    tournament_id: str = Path(..., description="ID del torneo"),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )

    tournament = Tournament(**tournament_dict)
    sorted_standings = _calculate_standings(tournament)
    return {"standings": sorted_standings}


@router.post(
    "/{tournament_id}/generate-playoffs",
    summary="Generate playoff bracket from group stage",
)
async def generate_playoffs(
    tournament_id: str = Path(..., description="ID del torneo"),
    current_user: User = Depends(get_current_active_user),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )

    tournament = Tournament(**tournament_dict)

    if tournament.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate playoffs for this tournament",
        )

    if tournament.status == "playoffs":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Playoffs already generated",
        )

    group_matches = [m for m in tournament.matches if m.phase == 'group']
    if not all(m.status == 'completed' for m in group_matches):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All group stage matches must be completed first",
        )

    tournament = _generate_playoffs_from_standings(tournament)
    update_tournament_db(tournament_id, tournament.model_dump())
    
    return {
        "message": "Playoff bracket generated",
        "playoff_matches": [m for m in tournament.matches if m.phase == 'playoff'],
    }


@router.get(
    "/{tournament_id}/matchday/{matchday}",
    summary="Get matches for a specific matchday",
)
async def get_matchday_matches(
    tournament_id: str = Path(..., description="ID del torneo"),
    matchday: int = Path(..., description="Matchday number"),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )

    tournament = Tournament(**tournament_dict)
    
    matchday_matches = [
        m for m in tournament.matches 
        if m.match_day == matchday and m.phase == 'group'
    ]
    
    return {
        "matchday": matchday,
        "total_matchdays": tournament.total_matchdays,
        "matches": matchday_matches,
    }


@router.get(
    "/{tournament_id}/results",
    summary="Ottieni i risultati finali di un torneo",
)
async def get_tournament_results(
    tournament_id: str = Path(..., description="ID del torneo"),
):
    tournament_dict = get_tournament_db(tournament_id)
    if not tournament_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found"
        )

    tournament = Tournament(**tournament_dict)

    results = []
    if tournament.status == "completed":
        playoff_matches = [m for m in tournament.matches if m.phase == 'playoff']
        if playoff_matches:
            final_match = max(playoff_matches, key=lambda m: m.round_number or 0)
            if final_match.winner_id:
                winner = next(
                    (p for p in tournament.participants if p.id == final_match.winner_id),
                    None,
                )
                if winner:
                    results.append({"participant": winner.name, "rank": 1})
    
    standings_response = await get_tournament_standings(tournament_id)
    for i, standing in enumerate(standings_response["standings"]):
        if not any(r["participant"] == standing["participant"].name for r in results):
            results.append({
                "participant": standing["participant"].name,
                "rank": len(results) + 1,
                "wins": standing["wins"],
            })

    return results
