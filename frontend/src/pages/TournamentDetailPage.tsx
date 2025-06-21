import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom';
import { getTournamentDetails, deleteTournament as apiDeleteTournament, generateTournamentSchedule as apiGenerateSchedule } from '../api';
import { Tournament, Participant, Match } from '../types';
import {
  Container, Typography, CircularProgress, Alert, Paper, Grid, Button, Box, Tabs, Tab, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SettingsIcon from '@mui/icons-material/Settings'; // Per "Gestisci" o "Modifica"
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // Per "Genera Calendario/Tabellone"

import TournamentParticipants from '../components/TournamentDetails/TournamentParticipants';
import TournamentMatches from '../components/TournamentDetails/TournamentMatches';
import TournamentStandings from '../components/TournamentDetails/TournamentStandings';
import TournamentBracket from '../components/TournamentDetails/TournamentBracket';


const TournamentDetailPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const fetchTournamentDetails = useCallback(async () => {
    if (!tournamentId) {
      setError("ID Torneo non fornito.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getTournamentDetails(tournamentId);
      setTournament(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch tournament details:", err);
      setError('Impossibile caricare i dettagli del torneo.');
      if ((err as any).response?.status === 404) {
        // navigate('/404'); // o una pagina di errore più specifica
      }
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournamentDetails();
  }, [fetchTournamentDetails]);

  const handleDeleteTournament = async () => {
    if (!tournamentId) return;
    try {
      await apiDeleteTournament(tournamentId);
      setDeleteDialogOpen(false);
      navigate('/'); // Torna alla lista dei tornei dopo l'eliminazione
    } catch (err) {
      console.error("Failed to delete tournament:", err);
      setError('Errore durante l\'eliminazione del torneo.');
      setDeleteDialogOpen(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!tournamentId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const updatedTournament = await apiGenerateSchedule(tournamentId);
      setTournament(updatedTournament); // Aggiorna i dati del torneo con le partite generate
      setGenerateDialogOpen(false);
    } catch (err: any) {
      console.error("Failed to generate schedule:", err);
      setError(err.response?.data?.detail || 'Errore durante la generazione del calendario/tabellone.');
      // Non chiudere il dialogo se c'è un errore, così l'utente vede il messaggio
    } finally {
      setIsGenerating(false);
    }
  };

  const getTabValue = () => {
    if (location.pathname.endsWith('/participants')) return 'participants';
    if (location.pathname.endsWith('/matches')) return 'matches';
    if (location.pathname.endsWith('/standings')) return 'standings';
    if (location.pathname.endsWith('/bracket')) return 'bracket';
    return 'participants'; // Default tab
  };
  const [selectedTab, setSelectedTab] = useState<'participants' | 'matches' | 'standings' | 'bracket'>(getTabValue());

  useEffect(() => {
    setSelectedTab(getTabValue());
  }, [location.pathname]);


  const handleTabChange = (event: React.SyntheticEvent, newValue: 'participants' | 'matches' | 'standings' | 'bracket') => {
    setSelectedTab(newValue);
    navigate(`/tournaments/${tournamentId}/${newValue}`);
  };


  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !tournament) { // Mostra errore solo se il torneo non è stato caricato affatto
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        <Button component={RouterLink} to="/" sx={{ mt: 2 }}>Torna alla Home</Button>
      </Container>
    );
  }

  if (!tournament) { // Caso in cui non c'è errore ma il torneo è ancora null (dovrebbe essere coperto da loading o error)
    return (
        <Container>
            <Typography>Torneo non trovato.</Typography>
            <Button component={RouterLink} to="/" sx={{ mt: 2 }}>Torna alla Home</Button>
        </Container>
    );
  }


  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mt: 4 }}>
        <Grid container spacing={2} justifyContent="space-between" alignItems="center">
          <Grid item xs={12} md>
            <Typography variant="h4" component="h1" gutterBottom>
              {tournament.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Formato: {tournament.format} - Tipo: {tournament.type}
            </Typography>
            {tournament.start_date && (
              <Typography variant="body2" color="text.secondary">
                Inizio: {new Date(tournament.start_date).toLocaleString()}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md="auto">
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mt: { xs: 2, md: 0 } }}>
              {/* <Button variant="outlined" startIcon={<EditIcon />} component={RouterLink} to={`/tournaments/${tournamentId}/edit`}>
                Modifica Torneo
              </Button> */}
               <Button
                variant="contained"
                color="secondary"
                startIcon={<PlayArrowIcon />}
                onClick={() => setGenerateDialogOpen(true)}
                disabled={tournament.participants.length < 2 || isGenerating}
              >
                {isGenerating ? <CircularProgress size={20} color="inherit"/> : 'Genera Partite'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Elimina Torneo
              </Button>
            </Box>
          </Grid>
        </Grid>

        {error && ( // Mostra errori non fatali (es. errore generazione partite)
             <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs value={selectedTab} onChange={handleTabChange} aria-label="Dettagli torneo tabs">
            <Tab icon={<GroupIcon />} iconPosition="start" label="Partecipanti" value="participants" component={RouterLink} to="participants" />
            <Tab icon={<ScheduleIcon />} iconPosition="start" label="Partite" value="matches" component={RouterLink} to="matches" />
            {tournament.format === 'girone all\'italiana' && (
              <Tab icon={<EmojiEventsIcon />} iconPosition="start" label="Classifica" value="standings" component={RouterLink} to="standings" />
            )}
            {tournament.format === 'eliminazione diretta' && (
              <Tab icon={<EmojiEventsIcon />} iconPosition="start" label="Tabellone" value="bracket" component={RouterLink} to="bracket" />
            )}
          </Tabs>
        </Box>

        <Box sx={{ pt: 3 }}>
          <Routes>
            <Route path="participants" element={
                <TournamentParticipants
                    participants={tournament.participants}
                    tournamentId={tournament.id}
                    onParticipantUpdate={fetchTournamentDetails} // Per ricaricare i dati del torneo
                />}
            />
            <Route path="matches" element={
                <TournamentMatches
                    matches={tournament.matches}
                    participants={tournament.participants} // Passa i partecipanti per mappare gli ID ai nomi
                    tournamentId={tournament.id}
                    tournamentFormat={tournament.format}
                    onMatchUpdate={fetchTournamentDetails}
                />}
            />
            {tournament.format === 'girone all\'italiana' && (
              <Route path="standings" element={<TournamentStandings tournamentId={tournament.id} />} />
            )}
             {tournament.format === 'eliminazione diretta' && (
              <Route path="bracket" element={<TournamentBracket tournamentId={tournament.id} participants={tournament.participants}/>} />
            )}
            {/* Default route for /tournaments/:tournamentId/ */}
            <Route index element={
                 <TournamentParticipants
                    participants={tournament.participants}
                    tournamentId={tournament.id}
                    onParticipantUpdate={fetchTournamentDetails}
                />}
            />
          </Routes>
        </Box>
      </Paper>

      {/* Dialog per conferma eliminazione */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler eliminare il torneo "{tournament.name}"? Questa azione è irreversibile.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleDeleteTournament} color="error">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per conferma generazione partite */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => !isGenerating && setGenerateDialogOpen(false)}
      >
        <DialogTitle>Genera Partite</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler generare le partite per il torneo "{tournament.name}"?
            Eventuali partite esistenti verranno sovrascritte.
            Sono necessari almeno 2 partecipanti.
          </DialogContentText>
          {error && <Alert severity="error" sx={{mt:1}}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)} disabled={isGenerating}>Annulla</Button>
          <Button onClick={handleGenerateSchedule} color="primary" disabled={isGenerating || tournament.participants.length < 2}>
            {isGenerating ? <CircularProgress size={24} /> : "Genera"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TournamentDetailPage;
