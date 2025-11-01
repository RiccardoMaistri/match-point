const API_BASE_URL = (process.env.REACT_APP_API_URL || '') + '/api';

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

/**
 * Helper function to make authenticated API requests.
 * @param {string} url - The full URL for the API endpoint.
 * @param {string} method - The HTTP method (GET, POST, PUT, DELETE).
 * @param {object} [body] - The request body for POST/PUT requests.
 * @returns {Promise<any>} - The JSON response.
 */
const authenticatedFetch = async (url, method, body) => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);
  return handleResponse(response);
};

// --- Tournament Endpoints ---

export const getTournaments = async () => {
  return authenticatedFetch(`${API_BASE_URL}/tournaments/`, 'GET');
};

export const getTournamentById = async (tournamentId) => {
  // This might remain public, or use authenticatedFetch if details are protected
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`);
  return handleResponse(response);
};

export const createTournament = async (tournamentData) => {
  // Assicurati che i campi opzionali non inviati come undefined siano gestiti
  // Pydantic dovrebbe gestire i default se i campi non sono presenti
  const payload = { ...tournamentData };
  if (!payload.start_date) delete payload.start_date; // Rimuovi se vuoto/nullo
  if (!payload.end_date) delete payload.end_date; // Rimuovi se vuoto/nullo

  return authenticatedFetch(`${API_BASE_URL}/tournaments/`, 'POST', payload);
};

export const updateTournament = async (tournamentId, tournamentData) => {
  const payload = { ...tournamentData };
  if (!payload.start_date) delete payload.start_date;
  if (!payload.end_date) delete payload.end_date;

  return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}`, 'PUT', payload);
};

export const deleteTournament = async (tournamentId) => {
  return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}`, 'DELETE');
};

// --- Participant Endpoints ---
// Assuming these require authentication for modification or viewing specific user's participant data

export const addParticipantToTournament = async (tournamentId, participantData) => {
  return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/participants/`, 'POST', participantData);
};

export const getTournamentParticipants = async (tournamentId) => {
  // This could be public or require auth depending on app logic. Assuming auth for now.
  return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/participants/`, 'GET');
};

export const removeParticipantFromTournament = async (tournamentId, participantId) => {
  return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/participants/${participantId}`, 'DELETE');
};

// --- Match & Results Endpoints ---
// Assuming these actions require authentication

export const generateMatches = async (tournamentId) => {
  return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/matches/generate`, 'POST');
};

export const getTournamentMatches = async (tournamentId) => {
  // Assuming viewing matches might require login, or to see user-specific context
  return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/matches`, 'GET');
};

export const recordMatchResult = async (tournamentId, matchId, resultData) => {
  return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/matches/${matchId}/result`, 'POST', resultData);
};

export const getTournamentResults = async (tournamentId) => {
    return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/results`, 'GET');
};

export const getTournamentStandings = async (tournamentId) => {
    return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/standings`, 'GET');
};

export const generatePlayoffs = async (tournamentId) => {
    return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/generate-playoffs`, 'POST');
};

export const getMatchdayMatches = async (tournamentId, matchday) => {
    return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/matchday/${matchday}`, 'GET');
};


// --- Specific view endpoints (Bracket/Schedule) ---
// Assuming these might require authentication

export const getTournamentBracket = async (tournamentId) => {
    return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/bracket`, 'GET');
};

export const getTournamentSchedule = async (tournamentId) => {
    return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/schedule`, 'GET');
};

// --- Invitation Link Endpoints ---
export const getTournamentByInviteCode = async (inviteCode) => {
  // This is a public endpoint
  const response = await fetch(`${API_BASE_URL}/tournaments/by-invite/${inviteCode}`);
  return handleResponse(response);
};

export const joinTournamentAuthenticated = async (tournamentId) => {
  // Requires authentication
  return authenticatedFetch(`${API_BASE_URL}/tournaments/${tournamentId}/join_authenticated`, 'POST');
};

// --- Auth Endpoints ---

export const registerUser = async (userData) => {
  // userData: { email, password, username }
  const response = await fetch(`${API_BASE_URL}/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return handleResponse(response); // Expects User object without password
};

export const loginUser = async (usernameOrEmail, password) => {
  const formData = new URLSearchParams();
  formData.append('username', usernameOrEmail); // FastAPI's OAuth2PasswordRequestForm expects 'username'
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/users/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });
  return handleResponse(response); // Expects { access_token, token_type }
};

export const getCurrentUserDetails = async () => {
  // This function assumes the user is already authenticated and token is in localStorage
  return authenticatedFetch(`${API_BASE_URL}/users/me`, 'GET');
};


export const submitFeedback = async (feedbackText) => {
  return authenticatedFetch(`${API_BASE_URL}/feedback/`, 'POST', { feedback: feedbackText });
};

export { API_BASE_URL };
