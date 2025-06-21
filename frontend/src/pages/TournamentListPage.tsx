import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getAllTournaments } from '../api';
import { Tournament } from '../types';
import {
  Container, Typography, List, ListItem, ListItemText, Button, CircularProgress, Alert, Paper, Grid, Box
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';

const TournamentListPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const data = await getAllTournaments();
        setTournaments(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch tournaments:", err);
        setError('Impossibile caricare i tornei. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Elenco Tornei
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/create-tournament"
          startIcon={<AddIcon />}
        >
          Nuovo Torneo
        </Button>
      </Box>

      {tournaments.length === 0 ? (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1">Nessun torneo trovato.</Typography>
          <Typography variant="body2">Crea il tuo primo torneo per iniziare!</Typography>
        </Paper>
      ) : (
        <List component={Paper} elevation={3}>
          {tournaments.map((tournament) => (
            <ListItem
              key={tournament.id}
              button
              component={RouterLink}
              to={`/tournaments/${tournament.id}`}
              divider
            >
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={1}>
                  <EventIcon color="action" />
                </Grid>
                <Grid item xs={8}>
                  <ListItemText
                    primary={tournament.name}
                    secondary={`Formato: ${tournament.format} - Tipo: ${tournament.type}`}
                  />
                </Grid>
                <Grid item xs={3} sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'Data da definire'}
                  </Typography>
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
};

export default TournamentListPage;
