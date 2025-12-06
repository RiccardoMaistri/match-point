import math
import uuid
from typing import List, Dict, Any
from models import Tournament, Match, Participant
from services.standings_service import _calculate_standings

def _get_round_name(round_num: int, total_rounds: int) -> str:
    """
    Returns a human-readable name for the round.
    e.g., Final, Semifinals, Quarterfinals, Round of 16...
    """
    rounds_from_final = total_rounds - round_num
    if rounds_from_final == 0:
        return "Final"
    elif rounds_from_final == 1:
        return "Semifinals"
    elif rounds_from_final == 2:
        return "Quarterfinals"
    else:
        return f"Round of {2**(rounds_from_final + 1)}"

def _generate_playoffs_from_standings(tournament_obj: Tournament) -> Tournament:
    standings = _calculate_standings(tournament_obj)
    
    # 1. Select qualified participants
    num_playoff_participants = tournament_obj.playoff_participants
    if num_playoff_participants < 2:
        return tournament_obj

    qualified_participants = [s["participant"] for s in standings[:num_playoff_participants]]
    
    # Keep group stage matches, remove any existing playoff matches
    tournament_obj.matches = [m for m in tournament_obj.matches if m.phase == 'group']
    
    # 2. Calculate bracket size (Power of 2)
    N = len(qualified_participants)
    next_pow2 = 2**math.ceil(math.log2(N))
    num_byes = next_pow2 - N
    
    # 3. Seeding logic (Standard seeding: 1 vs N, 2 vs N-1, etc.)
    # Implementation of "standard" seeding placement is complex.
    # A simpler "Fold" method:
    # Round 1 matches are (1, N), (2, N-1)... but we need to order them correctly so winners meet correctly.
    # e.g. for 8: [1, 8, 4, 5, 3, 6, 2, 7] implies pairings (1,8), (4,5), (3,6), (2,7)
    
    def get_seeding_order(size):
        """Returns the list of seeds in order for the bracket."""
        rounds = math.log2(size)
        placements = [1, 2]
        
        for i in range(int(rounds) - 1):
            next_placements = []
            for p in placements:
                next_placements.append(p)
                next_placements.append(2**(i+2) + 1 - p) # Sum is 2^(i+2) + 1 (e.g., 5 for size 4, 9 for size 8)
            placements = next_placements
        return placements

    seed_order = get_seeding_order(next_pow2)
    
    # Prepare the actual player list including BYEs
    # Map qualified_participants to seeds (Index 0 is Seed 1)
    
    matches_list = []
    
    # Create First Round Matches
    initial_matches = []
    
    pairings = []
    for i in range(0, len(seed_order), 2):
        pairings.append((seed_order[i], seed_order[i+1]))
        
    # Now create matches from pairings
    match_num = len(tournament_obj.matches) + 1
    round_number = 1
    
    # Track matches by ID to link subsequent rounds (implicitly by order)
    current_round_matches = [] # list of Match objects
    
    for p1_seed, p2_seed in pairings:
        # Determine player 1 (seed is 1-based)
        player1 = qualified_participants[p1_seed-1] if p1_seed <= N else None
        player2 = qualified_participants[p2_seed-1] if p2_seed <= N else None
        
        match = Match(
            match_number=match_num,
            round_number=round_number,
            phase='playoff'
        )
        
        if player1 and player2:
            match.participant1_id = player1.id
            match.participant2_id = player2.id
            match.status = "pending"
        elif player1 and not player2:
            # BYE for player 1
            match.participant1_id = player1.id
            # Standard: if Bye, user wins immediately.
            # However, prompt says: "In caso di bye, il giocatore avanza automaticamente al round successivo."
            # and "Un bye produce un match con ... winner=player1"
            match.winner_id = player1.id
            match.is_bye = True
            match.status = "completed"
        elif not player1 and player2:
            match.participant1_id = player2.id # Treat p2 as p1 for simplicity
            match.winner_id = player2.id
            match.is_bye = True
            match.status = "completed"
        else:
             # Both None? 
             pass
             
        current_round_matches.append(match)
        match_num += 1

    matches_list.extend(current_round_matches)
    
    # Generate subsequent rounds
    total_rounds = int(math.log2(next_pow2))
    
    previous_round_matches = current_round_matches
    
    for r in range(2, total_rounds + 1):
        next_round_matches = []
        # Previous round matches pair up: 0 vs 1, 2 vs 3, etc.
        for i in range(0, len(previous_round_matches), 2):
            m1 = previous_round_matches[i]
            m2 = previous_round_matches[i+1]
            
            new_match = Match(
                match_number=match_num,
                round_number=r,
                phase='playoff',
                status='pending',
            )
            
            # Pre-fill players if known (e.g. from BYEs in previous round)
            if m1.winner_id:
               new_match.participant1_id = m1.winner_id
            if m2.winner_id:
               new_match.participant2_id = m2.winner_id
               
            # Check if match can be auto-completed (if both opponents are known... wait, usually they play)
            # Unless it's a double bye situation, but bracket size aligns.
            # If both are known, status is NOT completed, they must play.
            
            # Special Case: If implicit progression (BYEs) leads to a match where one is TBD?
            # Standard logic: if both slots are filled, it's pending.
            # If one is filled and other isn't, it's pending.
            
            next_round_matches.append(new_match)
            match_num += 1
            
        matches_list.extend(next_round_matches)
        previous_round_matches = next_round_matches

    tournament_obj.matches.extend(matches_list)
    tournament_obj.status = "playoffs"
    return tournament_obj

