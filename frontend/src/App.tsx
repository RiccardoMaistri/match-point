import App from './App';

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Button, Box, CssBaseline } from '@mui/material';
import TournamentListPage from './pages/TournamentListPage';
import CreateTournamentPage from './pages/CreateTournamentPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';

function App() {
  return (
    <Router>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tournament Manager
          </Typography>
          <Button color="inherit" component={RouterLink} to="/" startIcon={<HomeIcon />}>
            Home
          </Button>
          <Button color="inherit" component={RouterLink} to="/create-tournament" startIcon={<AddIcon />}>
            Crea Torneo
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ marginTop: 4, marginBottom: 4 }}>
        <Routes>
          <Route path="/" element={<TournamentListPage />} />
          <Route path="/create-tournament" element={<CreateTournamentPage />} />
          <Route path="/tournaments/:tournamentId/*" element={<TournamentDetailPage />} />
          {/* Aggiungi altre route qui se necessario, es. /tournaments/:id/edit */}
        </Routes>
      </Container>
      <Box component="footer" sx={{ bgcolor: 'background.paper', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Tournament App by Jules
          </Typography>
        </Container>
      </Box>
    </Router>
  );
}

export default App;
