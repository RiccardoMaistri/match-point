import math
from models import Tournament, Match
from services.standings_service import _calculate_standings

def _generate_playoffs_from_standings(tournament_obj: Tournament):
    standings = _calculate_standings(tournament_obj)
    qualifiers = standings[:tournament_obj.playoff_participants]
    qualifiers_participants = [q["participant"] for q in qualifiers]
    num_qualifiers = len(qualifiers_participants)

    if num_qualifiers < 2:
        return tournament_obj

    bracket_size = 2**math.ceil(math.log2(num_qualifiers))
    num_byes = bracket_size - num_qualifiers

    bye_recipients = qualifiers_participants[:num_byes]
    first_round_players = qualifiers_participants[num_byes:]

    match_num = len(tournament_obj.matches) + 1
    
    player_indices = list(range(len(first_round_players)))
    while len(player_indices) >= 2:
        p1_idx = player_indices.pop(0)
        p2_idx = player_indices.pop(-1)
        
        p1 = first_round_players[p1_idx]
        p2 = first_round_players[p2_idx]
        
        match = Match(
            participant1_id=p1.id,
            participant2_id=p2.id,
            match_number=match_num,
            round_number=1,
            phase='playoff',
        )
        tournament_obj.matches.append(match)
        match_num += 1

    for p_bye in bye_recipients:
        bye_match = Match(
            participant1_id=p_bye.id,
            participant2_id=None,
            winner_id=p_bye.id,
            status="completed",
            is_bye=True,
            match_number=match_num,
            round_number=1,
            phase='playoff'
        )
        tournament_obj.matches.append(bye_match)
        match_num += 1

    tournament_obj.status = "playoffs"
    return tournament_obj
