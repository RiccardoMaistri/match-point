import math
from models import Tournament, Match
from services.standings_service import _calculate_standings

def _generate_playoffs_from_standings(tournament_obj: Tournament) -> Tournament:
    standings = _calculate_standings(tournament_obj)
    
    num_playoff_participants = tournament_obj.playoff_participants
    if num_playoff_participants < 2:
        return tournament_obj

    qualified_participants = [s["participant"] for s in standings[:num_playoff_participants]]

    # Keep group stage matches, remove any existing playoff matches
    group_matches_before = len([m for m in tournament_obj.matches if m.phase == 'group'])
    tournament_obj.matches = [m for m in tournament_obj.matches if m.phase == 'group']
    group_matches_after = len(tournament_obj.matches)
    print(f"DEBUG: Group matches before={group_matches_before}, after={group_matches_after}")

    # Determine the bracket size (next power of 2)
    bracket_size = 2**math.ceil(math.log2(num_playoff_participants))
    num_byes = bracket_size - num_playoff_participants

    # Seed players
    seeded_players = [None] * bracket_size
    top_seeds = qualified_participants[:num_byes]
    remaining_players = qualified_participants[num_byes:]

    # Distribute top seeds to receive byes
    for i in range(num_byes):
        seeded_players[i * (bracket_size // num_byes)] = top_seeds[i]

    # Fill remaining spots
    j = 0
    for i in range(bracket_size):
        if seeded_players[i] is None:
            if j < len(remaining_players):
                seeded_players[i] = remaining_players[j]
                j += 1

    # Generate first round matches
    match_num = len(tournament_obj.matches) + 1
    round_number = 1
    current_round_matches = []

    for i in range(0, bracket_size, 2):
        p1 = seeded_players[i]
        p2 = seeded_players[i+1]

        if p1 and p2:
            match = Match(
                participant1_id=p1.id,
                participant2_id=p2.id,
                match_number=match_num,
                round_number=round_number,
                phase='playoff',
            )
            current_round_matches.append(match)
            match_num += 1
        elif p1:
            # This player has a bye
            bye_match = Match(
                participant1_id=p1.id,
                winner_id=p1.id,
                status="completed",
                is_bye=True,
                match_number=match_num,
                round_number=round_number,
                phase='playoff'
            )
            current_round_matches.append(bye_match)
            match_num += 1
        elif p2:
            # This should not happen in a well-formed bracket
            pass

    tournament_obj.matches.extend(current_round_matches)
    tournament_obj.status = "playoffs"
    return tournament_obj
