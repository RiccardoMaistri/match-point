import React, { useState, useEffect, useMemo } from 'react';
import { getTournamentBracket } from '../../api';
import { Match, Participant } from '../../types';
import { Typography, CircularProgress, Alert, Paper, Box, Grid } from '@mui/material';
import './TournamentBracket.css'; // Creeremo questo file CSS per lo styling

interface TournamentBracketProps {
  tournamentId: string;
  participants: Participant[]; // Necessari per mappare ID a nomi
}

interface BracketMatch extends Match {
  participant1_name?: string;
  participant2_name?: string;
  winner_name?: string;
  children?: BracketMatch[]; // Per strutture ad albero, se necessario
  position?: number; // Per aiutare nel layout
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournamentId, participants }) => {
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const participantMap = useMemo(() => {
    return new Map(participants.map(p => [p.id, p.name]));
  }, [participants]);

  const getParticipantName = (id?: string | null) => {
    if (!id) return 'Da definire';
    return participantMap.get(id) || 'Sconosciuto';
  };

  useEffect(() => {
    const fetchBracket = async () => {
      if (!tournamentId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getTournamentBracket(tournamentId);
        const enhancedMatches = data.map(match => ({
          ...match,
          participant1_name: getParticipantName(match.participant1_id),
          participant2_name: getParticipantName(match.participant2_id),
          winner_name: match.winner_id ? getParticipantName(match.winner_id) : undefined,
        }));
        setMatches(enhancedMatches);
      } catch (err: any) {
        console.error("Failed to fetch bracket:", err);
        setError(err.response?.data?.detail || 'Impossibile caricare il tabellone.');
      } finally {
        setLoading(false);
      }
    };

    fetchBracket();
  }, [tournamentId, participantMap, getParticipantName]);


  const rounds = useMemo(() => {
    const groupedByRound: { [key: number]: BracketMatch[] } = {};
    matches.forEach(match => {
      const roundNum = match.round_number || 0; // Gestisci round null o undefined
      if (!groupedByRound[roundNum]) {
        groupedByRound[roundNum] = [];
      }
      groupedByRound[roundNum].push(match);
    });
    // Ordina le partite all'interno di ogni round per match_number_in_round
    Object.values(groupedByRound).forEach(roundMatches => {
        roundMatches.sort((a,b) => (a.match_number_in_round || 0) - (b.match_number_in_round || 0));
    });
    return Object.entries(groupedByRound)
                 .sort(([roundA], [roundB]) => parseInt(roundA) - parseInt(roundB))
                 .map(([, roundMatches]) => roundMatches);
  }, [matches]);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (matches.length === 0) {
    return <Typography sx={{mt: 2}}>Nessuna partita trovata per questo tabellone. Genera le partite dalla pagina principale del torneo.</Typography>;
  }

  const getRoundLabel = (roundIndex: number, totalRounds: number, numParticipants: number) => {
    if (numParticipants < 2) return "Round Unico";
    const actualRoundNumber = roundIndex + 1; // rounds è 0-indexed
    if (actualRoundNumber === totalRounds) return "Finale";
    if (actualRoundNumber === totalRounds - 1 && numParticipants > 2) return "Semifinali";
    if (actualRoundNumber === totalRounds - 2 && numParticipants > 4) return "Quarti di Finale";
    // Calcola il numero di squadre per questo round (approssimativo)
    // const teamsInThisRound = numParticipants / Math.pow(2, roundIndex);
    // if (teamsInThisRound <= 8 && teamsInThisRound > 4 && totalRounds - actualRoundNumber >=2 ) return "Ottavi di Finale";
    return `Round ${actualRoundNumber}`;
  };


  return (
    <Paper elevation={2} sx={{ p: {xs:1, sm:2}, overflowX: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{textAlign: 'center', mb:3}}>
        Tabellone Eliminazione Diretta
      </Typography>
      <Box className="bracket-container">
        {rounds.map((roundMatches, roundIndex) => (
          <Box key={`round-${roundIndex}`} className="bracket-round">
            <Typography variant="h6" className="bracket-round-title">
              {getRoundLabel(roundIndex, rounds.length, participants.length)}
            </Typography>
            {roundMatches.map((match) => (
              <Box key={match.id} className="bracket-match">
                <Paper elevation={1} className="bracket-match-paper">
                  <Box className={`bracket-participant ${match.winner_id === match.participant1_id ? 'winner' : ''} ${!match.participant1_id ? 'tbd' : ''}`}>
                    <span className="participant-name">{match.participant1_name || 'TBD'}</span>
                    <span className="participant-score">{match.participant1_score ?? '-'}</span>
                  </Box>
                  <Box className="bracket-match-separator">vs</Box>
                  <Box className={`bracket-participant ${match.winner_id === match.participant2_id ? 'winner' : ''} ${!match.participant2_id ? 'tbd' : ''}`}>
                    <span className="participant-name">{match.participant2_name || 'TBD'}</span>
                    <span className="participant-score">{match.participant2_score ?? '-'}</span>
                  </Box>
                  {match.status === 'completed' && match.winner_name && (
                     <Typography variant="caption" display="block" sx={{textAlign: 'center', mt:0.5, color: 'success.main'}}>
                        Vincitore: {match.winner_name}
                    </Typography>
                  )}
                   {match.status === 'pending' && (
                     <Typography variant="caption" display="block" sx={{textAlign: 'center', mt:0.5, color: 'text.secondary'}}>
                        Da giocare
                    </Typography>
                  )}
                </Paper>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
       {/* Legenda Semplificata */}
       <Box sx={{ mt: 3, p: 1, borderTop: '1px solid #ccc' }}>
            <Typography variant="caption">
                <strong>Legenda:</strong> TBD = To Be Determined (Da Definire). Il partecipante in <strong>grassetto</strong> (o con sfondo colorato) indica il vincitore della partita.
                Le linee di connessione tra le partite non sono visualizzate in questa versione semplificata.
            </Typography>
        </Box>
    </Paper>
  );
};

export default TournamentBracket;
