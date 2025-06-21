import axios from 'axios';
import { Tournament, TournamentCreate, ParticipantCreate, Participant, Match, MatchResult } from './types'; // Assicurati che i tipi siano definiti in types.ts

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tournament Endpoints
export const createTournament = async (tournamentData: TournamentCreate): Promise<Tournament> => {
  const response = await apiClient.post<Tournament>('/tournaments', tournamentData);
  return response.data;
};

export const getAllTournaments = async (): Promise<Tournament[]> => {
  const response = await apiClient.get<Tournament[]>('/tournaments');
  return response.data;
};

export const getTournamentDetails = async (tournamentId: string): Promise<Tournament> => {
  const response = await apiClient.get<Tournament>(`/tournaments/${tournamentId}`);
  return response.data;
};

export const updateTournament = async (tournamentId: string, tournamentData: TournamentCreate): Promise<Tournament> => {
  const response = await apiClient.put<Tournament>(`/tournaments/${tournamentId}`, tournamentData);
  return response.data;
};

export const deleteTournament = async (tournamentId: string): Promise<void> => {
  await apiClient.delete(`/tournaments/${tournamentId}`);
};

// Participant Endpoints
export const addParticipantToTournament = async (tournamentId: string, participantData: ParticipantCreate): Promise<Participant> => {
  const response = await apiClient.post<Participant>(`/tournaments/${tournamentId}/participants`, participantData);
  return response.data;
};

export const getTournamentParticipants = async (tournamentId: string): Promise<Participant[]> => {
  const response = await apiClient.get<Participant[]>(`/tournaments/${tournamentId}/participants`);
  return response.data;
};

export const removeParticipantFromTournament = async (tournamentId: string, participantId: string): Promise<void> => {
  await apiClient.delete(`/tournaments/${tournamentId}/participants/${participantId}`);
};

// Match and Schedule Endpoints
export const generateTournamentSchedule = async (tournamentId: string): Promise<Tournament> => {
  const response = await apiClient.post<Tournament>(`/tournaments/${tournamentId}/generate-schedule`);
  return response.data;
};

export const getTournamentMatches = async (tournamentId: string): Promise<Match[]> => {
  const response = await apiClient.get<Match[]>(`/tournaments/${tournamentId}/matches`);
  return response.data;
};

export const recordMatchResult = async (tournamentId: string, matchId: string, resultData: MatchResult): Promise<Match> => {
  const response = await apiClient.post<Match>(`/tournaments/${tournamentId}/matches/${matchId}/result`, resultData);
  return response.data;
};

export const getTournamentBracket = async (tournamentId: string): Promise<Match[]> => {
  // Questo endpoint potrebbe restituire una struttura più complessa per il bracket
  const response = await apiClient.get<Match[]>(`/tournaments/${tournamentId}/bracket`);
  return response.data;
};

export const getTournamentStandings = async (tournamentId: string): Promise<any[]> => { // Modifica 'any' con un tipo più specifico per la classifica se disponibile
  const response = await apiClient.get<any[]>(`/tournaments/${tournamentId}/standings`);
  return response.data;
};

export default apiClient;
