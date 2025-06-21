import React, { useState } from 'react';
import { Participant, ParticipantCreate } from '../../types';
import { addParticipantToTournament, removeParticipantFromTournament } from '../../api';
import {
  Box, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Alert, Paper, Grid, Avatar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface TournamentParticipantsProps {
  participants: Participant[];
  tournamentId: string;
  onParticipantUpdate: () => void; // Callback per aggiornare i dati del torneo padre
}

const TournamentParticipants: React.FC<TournamentParticipantsProps> = ({ participants, tournamentId, onParticipantUpdate }) => {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [newParticipantRanking, setNewParticipantRanking] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenAddDialog = () => {
    setNewParticipantName('');
    setNewParticipantEmail('');
    setNewParticipantRanking('');
    setError(null);
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    if (!loading) {
      setOpenAddDialog(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim() || !newParticipantEmail.trim()) {
      setError("Nome ed Email sono obbligatori.");
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(newParticipantEmail)) {
        setError("Formato email non valido.");
        return;
    }

    const participantData: ParticipantCreate = {
      name: newParticipantName,
      email: newParticipantEmail,
      ranking: newParticipantRanking ? parseInt(newParticipantRanking, 10) : null,
    };

    setLoading(true);
    setError(null);
    try {
      await addParticipantToTournament(tournamentId, participantData);
      onParticipantUpdate(); // Aggiorna la lista nel componente padre
      handleCloseAddDialog();
    } catch (err: any) {
      console.error("Failed to add participant:", err);
      setError(err.response?.data?.detail || 'Errore durante l\'aggiunta del partecipante.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    // Potremmo aggiungere un dialogo di conferma qui
    setLoading(true); // Usiamo lo stesso stato di loading per semplicità
    setError(null);
    try {
      await removeParticipantFromTournament(tournamentId, participantId);
      onParticipantUpdate();
    } catch (err: any) {
      console.error("Failed to remove participant:", err);
      setError(err.response?.data?.detail || 'Errore durante la rimozione del partecipante.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Partecipanti ({participants.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenAddDialog}
        >
          Aggiungi Partecipante
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && !openAddDialog && <CircularProgress sx={{mb:2}}/>}


      {participants.length === 0 ? (
        <Typography sx={{mt:2}}>Nessun partecipante iscritto a questo torneo.</Typography>
      ) : (
        <List>
          {participants.map((participant) => (
            <ListItem key={participant.id} divider sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 30, height: 30, fontSize: '0.9rem' }}>
                    {participant.name.substring(0, 1).toUpperCase()}
                  </Avatar>
                </Grid>
                <Grid item xs>
                    <ListItemText
                    primary={participant.name}
                    secondary={
                        <>
                        <Typography component="span" variant="body2" color="text.primary">
                            {participant.email}
                        </Typography>
                        {participant.ranking && ` - Ranking: ${participant.ranking}`}
                        </>
                    }
                    />
                </Grid>
                <Grid item>
                    <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveParticipant(participant.id)} disabled={loading}>
                        <DeleteIcon />
                        </IconButton>
                    </ListItemSecondaryAction>
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Aggiungi Nuovo Partecipante</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label="Nome Partecipante"
            type="text"
            fullWidth
            variant="outlined"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            required
            sx={{mb:2}}
          />
          <TextField
            margin="dense"
            label="Email Partecipante"
            type="email"
            fullWidth
            variant="outlined"
            value={newParticipantEmail}
            onChange={(e) => setNewParticipantEmail(e.target.value)}
            required
            sx={{mb:2}}
          />
          <TextField
            margin="dense"
            label="Ranking (Opzionale)"
            type="number"
            fullWidth
            variant="outlined"
            value={newParticipantRanking}
            onChange={(e) => setNewParticipantRanking(e.target.value)}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </DialogContent>
        <DialogActions sx={{p: '16px 24px'}}>
          <Button onClick={handleCloseAddDialog} disabled={loading}>Annulla</Button>
          <Button onClick={handleAddParticipant} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Aggiungi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TournamentParticipants;
