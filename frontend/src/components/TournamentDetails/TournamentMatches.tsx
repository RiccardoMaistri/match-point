import React, { useState, useMemo } from 'react';
import { Match, Participant, MatchResult as MatchResultType } from '../../types';
import { recordMatchResult } from '../../api';
import {
  Box, Typography, List, ListItem, ListItemText, IconButton, TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Alert, Paper, Grid, Select, MenuItem, FormControl, InputLabel, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel'; // Per partite cancellate

interface TournamentMatchesProps {
  matches: Match[];
  participants: Participant[];
  tournamentId: string;
  tournamentFormat: 'eliminazione diretta' | 'girone all\'italiana';
  onMatchUpdate: () => void;
}

const TournamentMatches: React.FC<TournamentMatchesProps> = ({ matches, participants, tournamentId, tournamentFormat, onMatchUpdate }) => {
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [score1, setScore1] = useState<string>('');
  const [score2, setScore2] = useState<string>('');
  const [winnerId, setWinnerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const participantMap = useMemo(() => {
    return new Map(participants.map(p => [p.id, p.name]));
  }, [participants]);

  const getParticipantName = (id?: string | null) => {
    if (!id) return 'N/D';
    return participantMap.get(id) || 'Sconosciuto';
  };

  const handleOpenEditDialog = (match: Match) => {
    setEditingMatch(match);
    setScore1(match.participant1_score?.toString() || '');
    setScore2(match.participant2_score?.toString() || '');
    setWinnerId(match.winner_id || '');
    setError(null);
  };

  const handleCloseEditDialog = () => {
    if (!loading) {
      setEditingMatch(null);
    }
  };

  const handleSaveResult = async () => {
    if (!editingMatch) return;

    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      setError("I punteggi devono essere numeri positivi.");
      return;
    }
    if (!winnerId) {
        setError("Devi selezionare un vincitore.");
        return;
    }
    if (winnerId !== editingMatch.participant1_id && winnerId !== editingMatch.participant2_id) {
        setError("Il vincitore selezionato non è uno dei partecipanti di questa partita.");
        return;
    }


    const resultData: MatchResultType = {
      participant1_score: s1,
      participant2_score: s2,
      winner_id: winnerId,
      status: 'completed' // Il backend potrebbe gestirlo, ma è bene essere espliciti
    };

    setLoading(true);
    setError(null);
    try {
      await recordMatchResult(tournamentId, editingMatch.id, resultData);
      onMatchUpdate();
      handleCloseEditDialog();
    } catch (err: any) {
      console.error("Failed to record match result:", err);
      setError(err.response?.data?.detail || 'Errore durante la registrazione del risultato.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Match['status']) => {
    switch (status) {
      case 'completed':
        return <Tooltip title="Completata"><CheckCircleIcon color="success" /></Tooltip>;
      case 'pending':
        return <Tooltip title="In attesa"><PendingIcon color="action" /></Tooltip>;
      case 'in_progress':
        return <Tooltip title="In corso"><CircularProgress size={20} color="info" /></Tooltip>;
      case 'cancelled':
        return <Tooltip title="Cancellata"><CancelIcon color="error" /></Tooltip>;
      default:
        return null;
    }
  };

  const getRoundRobinRoundLabel = (roundNumber?: number | null) => {
    if (roundNumber === undefined || roundNumber === null) return '';
    return `Giornata ${roundNumber}`;
  }

  const getEliminationRoundLabel = (roundNumber?: number | null, totalParticipants?: number) => {
    if (roundNumber === undefined || roundNumber === null || totalParticipants === undefined) return '';
    // Semplice logica per etichettare i round di eliminazione diretta
    // Questo può essere reso più sofisticato
    const totalRounds = Math.ceil(Math.log2(totalParticipants));
    if (roundNumber === totalRounds) return "Finale";
    if (roundNumber === totalRounds - 1 && totalParticipants > 2) return "Semifinale";
    if (roundNumber === totalRounds - 2 && totalParticipants > 4) return "Quarti di finale";
    return `Round ${roundNumber}`;
  };


  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
        const roundComparison = (a.round_number || 0) - (b.round_number || 0);
        if (roundComparison !== 0) return roundComparison;
        return (a.match_number_in_round || 0) - (b.match_number_in_round || 0);
    });
  }, [matches]);

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Partite
      </Typography>

      {error && !editingMatch && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {sortedMatches.length === 0 ? (
        <Typography>Nessuna partita generata per questo torneo. Vai alla pagina principale del torneo per generarne.</Typography>
      ) : (
        <List>
          {sortedMatches.map((match) => (
            <ListItem key={match.id} divider sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item xs={12} sm={5} md={tournamentFormat === 'eliminazione diretta' ? 4 : 5}>
                  <ListItemText
                    primary={
                        <Typography variant="body1">
                            {getParticipantName(match.participant1_id)} vs {getParticipantName(match.participant2_id)}
                        </Typography>
                    }
                    secondary={
                        <>
                        {tournamentFormat === 'girone all\'italiana' && getRoundRobinRoundLabel(match.round_number)}
                        {tournamentFormat === 'eliminazione diretta' && getEliminationRoundLabel(match.round_number, participants.length)}
                        {match.start_time && ` - ${new Date(match.start_time).toLocaleString()}`}
                        </>
                    }
                  />
                </Grid>
                <Grid item xs={6} sm={3} md={2} sx={{ textAlign: {sm: 'center'} }}>
                  <Typography variant="h6">
                    {match.participant1_score ?? '-'} : {match.participant2_score ?? '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2} md={tournamentFormat === 'eliminazione diretta' ? 2 : 1} sx={{ textAlign: 'center' }}>
                  {getStatusIcon(match.status)}
                </Grid>
                {tournamentFormat === 'eliminazione diretta' && match.winner_id && (
                     <Grid item xs={12} sm={12} md={2} sx={{ textAlign: {sm: 'left', md: 'center'} }}>
                        <Typography variant="caption" color="text.secondary">
                            Vincitore: {getParticipantName(match.winner_id)}
                        </Typography>
                    </Grid>
                )}
                <Grid item xs={12} sm={2} md={tournamentFormat === 'eliminazione diretta' ? 2 : 3} sx={{ textAlign: 'right' }}>
                  {match.status !== 'completed' && match.status !== 'cancelled' && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEditDialog(match)}
                        disabled={!match.participant1_id || !match.participant2_id} // Disabilita se mancano partecipanti
                    >
                      Risultato
                    </Button>
                  )}
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
      )}

      {editingMatch && (
        <Dialog open={!!editingMatch} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Registra Risultato</DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              {getParticipantName(editingMatch.participant1_id)} vs {getParticipantName(editingMatch.participant2_id)}
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2} sx={{mt:1}}>
              <Grid item xs={6}>
                <TextField
                  label={`Punteggio ${getParticipantName(editingMatch.participant1_id)}`}
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={score1}
                  onChange={(e) => setScore1(e.target.value)}
                  InputProps={{ inputProps: { min: 0 } }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={`Punteggio ${getParticipantName(editingMatch.participant2_id)}`}
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={score2}
                  onChange={(e) => setScore2(e.target.value)}
                  InputProps={{ inputProps: { min: 0 } }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" required error={!!(error && error.includes("vincitore"))}>
                  <InputLabel id="winner-select-label">Vincitore</InputLabel>
                  <Select
                    labelId="winner-select-label"
                    value={winnerId}
                    onChange={(e) => setWinnerId(e.target.value as string)}
                    label="Vincitore"
                  >
                    <MenuItem value={editingMatch.participant1_id!}>
                      {getParticipantName(editingMatch.participant1_id)}
                    </MenuItem>
                    <MenuItem value={editingMatch.participant2_id!}>
                      {getParticipantName(editingMatch.participant2_id)}
                    </MenuItem>
                    {/* Considerare l'opzione pareggio se il backend la supporta o se winner_id può essere null */}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{p: '16px 24px'}}>
            <Button onClick={handleCloseEditDialog} disabled={loading}>Annulla</Button>
            <Button onClick={handleSaveResult} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Salva Risultato'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
};

export default TournamentMatches;
