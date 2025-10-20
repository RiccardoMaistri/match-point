from models import Tournament

def _calculate_standings(tournament: Tournament) -> list:
    standings = {}
    for p in tournament.participants:
        standings[p.id] = {
            "participant": p,
            "played": 0,
            "wins": 0,
            "losses": 0,
            "score_for": 0,
            "score_against": 0,
        }
    
    for match in tournament.matches:
        if match.phase == 'group' and match.status == 'completed':
            p1_id = match.participant1_id
            p2_id = match.participant2_id

            if p1_id in standings:
                standings[p1_id]["played"] += 1
                if match.score_participant1 is not None:
                    standings[p1_id]["score_for"] += match.score_participant1
                if match.score_participant2 is not None:
                    standings[p1_id]["score_against"] += match.score_participant2
            
            if p2_id in standings:
                standings[p2_id]["played"] += 1
                if match.score_participant2 is not None:
                    standings[p2_id]["score_for"] += match.score_participant2
                if match.score_participant1 is not None:
                    standings[p2_id]["score_against"] += match.score_participant1
            
            if match.winner_id:
                if match.winner_id in standings:
                    standings[match.winner_id]["wins"] += 1
                
                loser_id = p2_id if match.winner_id == p1_id else p1_id
                if loser_id in standings:
                    standings[loser_id]["losses"] += 1
    
    sorted_standings = sorted(
        standings.values(),
        key=lambda x: (x["wins"], x["score_for"] - x["score_against"]),
        reverse=True
    )
    return sorted_standings
