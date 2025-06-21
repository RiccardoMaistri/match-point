import React, { useState, useEffect } from 'react';
import { getTournamentStandings } from '../../api';
import { Standing } from '../../types'; // Assicurati che Standing sia definito in types.ts
import {
  Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box
} from '@mui/material';

interface TournamentStandingsProps {
  tournamentId: string;
}

const TournamentStandings: React.FC<TournamentStandingsProps> = ({ tournamentId }) => {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      if (!tournamentId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getTournamentStandings(tournamentId);
        setStandings(data);
      } catch (err: any) {
        console.error("Failed to fetch standings:", err);
        setError(err.response?.data?.detail || 'Impossibile caricare la classifica.');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [tournamentId]);

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

  if (standings.length === 0) {
    return <Typography sx={{mt: 2}}>Nessuna partita completata o nessun partecipante per mostrare la classifica.</Typography>;
  }

  return (
    <Paper elevation={2} sx={{ p: {xs: 1, sm:2, md:3}, overflowX: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Classifica Girone
      </Typography>
      <TableContainer>
        <Table stickyHeader aria-label="classifica torneo">
          <TableHead>
            <TableRow>
              <TableCell sx={{fontWeight: 'bold'}}>Pos.</TableCell>
              <TableCell sx={{fontWeight: 'bold'}}>Partecipante</TableCell>
              <TableCell align="center" sx={{fontWeight: 'bold'}}>PG</TableCell>
              <TableCell align="center" sx={{fontWeight: 'bold'}}>V</TableCell>
              <TableCell align="center" sx={{fontWeight: 'bold'}}>P</TableCell> {/* Pareggi, se supportati */}
              <TableCell align="center" sx={{fontWeight: 'bold'}}>S</TableCell>
              <TableCell align="center" sx={{fontWeight: 'bold'}}>PF</TableCell>
              <TableCell align="center" sx={{fontWeight: 'bold'}}>PS</TableCell>
              <TableCell align="center" sx={{fontWeight: 'bold'}}>Diff</TableCell>
              <TableCell align="center" sx={{fontWeight: 'bold'}}>Punti</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standings.map((row, index) => (
              <TableRow key={row.email || index} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                <TableCell component="th" scope="row">
                  {index + 1}
                </TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell align="center">{row.played}</TableCell>
                <TableCell align="center">{row.wins}</TableCell>
                <TableCell align="center">{row.draws}</TableCell>
                <TableCell align="center">{row.losses}</TableCell>
                <TableCell align="center">{row.gf}</TableCell>
                <TableCell align="center">{row.ga}</TableCell>
                <TableCell align="center">{row.gd}</TableCell>
                <TableCell align="center" sx={{fontWeight: 'bold'}}>{row.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TournamentStandings;
