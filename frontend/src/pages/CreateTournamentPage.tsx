import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTournament } from '../api';
import { TournamentCreate } from '../types';
import {
  Container, Typography, TextField, Button, Box, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert, Paper, Grid
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { isValid, formatISO } from 'date-fns';
import itLocale from 'date-fns/locale/it';


const CreateTournamentPage: React.FC = () => {
  const navigate = useNavigate();
  const [tournamentName, setTournamentName] = useState<string>('');
  const [tournamentType, setTournamentType] = useState<'singolo' | 'doppio'>('singolo');
  const [tournamentFormat, setTournamentFormat] = useState<'eliminazione diretta' | 'girone all\'italiana'>('eliminazione diretta');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!tournamentName.trim()) {
      setError("Il nome del torneo è obbligatorio.");
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setError("La data di inizio non può essere successiva alla data di fine.");
      return;
    }

    const tournamentData: TournamentCreate = {
      name: tournamentName,
      type: tournamentType,
      format: tournamentFormat,
      start_date: startDate && isValid(startDate) ? formatISO(startDate) : null,
      end_date: endDate && isValid(endDate) ? formatISO(endDate) : null,
    };

    setLoading(true);
    try {
      const newTournament = await createTournament(tournamentData);
      navigate(`/tournaments/${newTournament.id}`);
    } catch (err: any) {
      console.error("Failed to create tournament:", err);
      setError(err.response?.data?.detail || 'Errore durante la creazione del torneo. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Crea Nuovo Torneo
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Nome Torneo"
                variant="outlined"
                fullWidth
                required
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                error={!!(error && error.includes("nome"))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" required>
                <InputLabel id="tournament-type-label">Tipologia</InputLabel>
                <Select
                  labelId="tournament-type-label"
                  label="Tipologia"
                  value={tournamentType}
                  onChange={(e) => setTournamentType(e.target.value as 'singolo' | 'doppio')}
                >
                  <MenuItem value="singolo">Singolo</MenuItem>
                  <MenuItem value="doppio">Doppio</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" required>
                <InputLabel id="tournament-format-label">Formato</InputLabel>
                <Select
                  labelId="tournament-format-label"
                  label="Formato"
                  value={tournamentFormat}
                  onChange={(e) => setTournamentFormat(e.target.value as 'eliminazione diretta' | 'girone all\'italiana')}
                >
                  <MenuItem value="eliminazione diretta">Eliminazione Diretta</MenuItem>
                  <MenuItem value="girone all'italiana">Girone all'Italiana</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={itLocale}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="Data e Ora Inizio (Opzionale)"
                      value={startDate}
                      onChange={setStartDate}
                      slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="Data e Ora Fine (Opzionale)"
                      value={endDate}
                      onChange={setEndDate}
                      slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                      minDateTime={startDate || undefined}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </Grid>
            {error && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                sx={{ mt: 2, py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Crea Torneo'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateTournamentPage;
