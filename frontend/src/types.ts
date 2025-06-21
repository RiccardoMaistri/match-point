// Copia e adatta le definizioni dei modelli Pydantic del backend

export interface Participant {
    id: string; // UUID è una stringa in TS/JS
    name: string;
    email: string;
    ranking?: number | null;
}

export interface Match {
    id: string;
    participant1_id?: string | null;
    participant2_id?: string | null;
    participant1_score?: number | null;
    participant2_score?: number | null;
    winner_id?: string | null;
    round_number?: number | null;
    match_number_in_round?: number | null;
    start_time?: string | null; // ISO datetime string
    status: "pending" | "in_progress" | "completed" | "cancelled";
    // Frontend specific fields (optional)
    participant1_name?: string;
    participant2_name?: string;
}

export interface Tournament {
    id: string;
    name: string;
    type: "singolo" | "doppio";
    format: "eliminazione diretta" | "girone all'italiana";
    start_date?: string | null; // ISO datetime string
    end_date?: string | null; // ISO datetime string
    participants: Participant[];
    matches: Match[];
    invitation_link?: string | null;
}

export interface TournamentCreate {
    name: string;
    type: "singolo" | "doppio";
    format: "eliminazione diretta" | "girone all'italiana";
    start_date?: string | null;
    end_date?: string | null;
}

export interface ParticipantCreate {
    name: string;
    email: string;
    ranking?: number | null;
}

export interface MatchResult {
    participant1_score: number;
    participant2_score: number;
    winner_id: string;
    status?: "completed" | "cancelled"; // status è opzionale qui se il backend lo imposta di default
}

// Per la classifica del girone all'italiana
export interface Standing {
    name: string;
    email: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    gf: number; // Gol/Punti fatti
    ga: number; // Gol/Punti subiti
    gd: number; // Differenza gol/punti
    points: number;
    // Potrebbe includere l'id del partecipante se necessario per link o altro
    participant_id?: string;
}
