const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Helper function to handle API responses.
 * @param {Response} response - The fetch API response.
 * @returns {Promise<any>} - The JSON response.
 * @throws {Error} - If the response is not ok.
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { detail: response.statusText || 'Unknown error occurred' };
    }
    const errorMessage = errorData.detail || `Request failed with status ${response.status}`;
    // Logga l'errore completo per debug
    console.error('API Error:', response.status, errorData);
    throw new Error(errorMessage);
  }
  // Se lo status è 204 No Content, non c'è corpo JSON da parsare
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

// --- Tournament Endpoints ---

export const getTournaments = async () => {
  const response = await fetch(`${API_BASE_URL}/tournaments/`);
  return handleResponse(response);
};

export const getTournamentById = async (tournamentId) => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`);
  return handleResponse(response);
};

export const createTournament = async (tournamentData) => {
  // Assicurati che i campi opzionali non inviati come undefined siano gestiti
  // Pydantic dovrebbe gestire i default se i campi non sono presenti
  const payload = { ...tournamentData };
  if (!payload.start_date) delete payload.start_date; // Rimuovi se vuoto/nullo

  const response = await fetch(`${API_BASE_URL}/tournaments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const updateTournament = async (tournamentId, tournamentData) => {
  const payload = { ...tournamentData };
  if (!payload.start_date) delete payload.start_date;

  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
    method: 'PUT', // o PATCH se il backend lo supporta per aggiornamenti parziali
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const deleteTournament = async (tournamentId) => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
    method: 'DELETE',
  });
  // DELETE spesso restituisce 204 No Content, gestito da handleResponse
  return handleResponse(response);
};

// --- Participant Endpoints ---

export const addParticipantToTournament = async (tournamentId, participantData) => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/participants/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(participantData),
  });
  return handleResponse(response);
};

export const getTournamentParticipants = async (tournamentId) => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/participants/`);
  return handleResponse(response);
};

export const removeParticipantFromTournament = async (tournamentId, participantId) => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/participants/${participantId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

// --- Match & Results Endpoints ---

export const generateMatches = async (tournamentId) => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/matches/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // Anche se non c'è body, buona pratica
    },
  });
  return handleResponse(response);
};

export const getTournamentMatches = async (tournamentId) => {
  // Potrebbe essere /bracket o /schedule a seconda del tipo di torneo,
  // o un endpoint generico /matches come definito nel backend.
  // Per ora usiamo /matches come da API backend.
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/matches`);
  return handleResponse(response);
};

export const recordMatchResult = async (tournamentId, matchId, resultData) => {
  // resultData potrebbe essere: { score_participant1, score_participant2, winner_id }
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/matches/${matchId}/result`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resultData),
  });
  return handleResponse(response);
};


// --- Specific view endpoints (Bracket/Schedule) ---

export const getTournamentBracket = async (tournamentId) => {
    const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/bracket`);
    return handleResponse(response);
};

export const getTournamentSchedule = async (tournamentId) => {
    const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/schedule`);
    return handleResponse(response);
};


export { API_BASE_URL }; // Esporta anche API_BASE_URL se serve altrove direttamente.
