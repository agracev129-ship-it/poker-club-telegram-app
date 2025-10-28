import { getTelegramInitData } from './telegram';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Базовая функция для выполнения API запросов
 */
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const initData = getTelegramInitData();
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': initData,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// ============= USERS API =============

export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  is_admin: boolean;
  created_at: string;
  last_active: string;
}

export interface UserStats {
  id: number;
  user_id: number;
  games_played: number;
  games_won: number;
  total_points: number;
  total_winnings: number;
  current_rank?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

export interface UserProfile extends User {
  games_played: number;
  games_won: number;
  total_points: number;
  total_winnings: number;
  current_rank?: number;
  achievements?: Achievement[];
  activities?: Activity[];
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_at?: string;
}

export interface Activity {
  id: number;
  user_id: number;
  activity_type: string;
  description: string;
  related_id?: number;
  created_at: string;
}

export const usersAPI = {
  async getMe(): Promise<UserProfile> {
    return fetchAPI('/users/me');
  },

  async getStats(): Promise<UserStats> {
    return fetchAPI('/users/stats');
  },

  async getLeaderboard(limit = 50): Promise<UserStats[]> {
    return fetchAPI(`/users/leaderboard?limit=${limit}`);
  },

  async getAll(limit = 100, offset = 0): Promise<User[]> {
    return fetchAPI(`/users?limit=${limit}&offset=${offset}`);
  },

  async getFriends(): Promise<User[]> {
    return fetchAPI('/users/friends');
  },

  async getFriendRequests(): Promise<User[]> {
    return fetchAPI('/users/friend-requests');
  },

  async sendFriendRequest(userId: number): Promise<{ message: string }> {
    return fetchAPI('/users/friend-request', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async acceptFriendRequest(userId: number): Promise<{ message: string }> {
    return fetchAPI('/users/accept-friend', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async declineFriendRequest(userId: number): Promise<{ message: string }> {
    return fetchAPI('/users/decline-friend', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async removeFriend(userId: number): Promise<{ message: string }> {
    return fetchAPI('/users/remove-friend', {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  },

  async updateStats(userId: number, updates: Partial<UserStats>): Promise<UserStats> {
    return fetchAPI(`/users/${userId}/stats`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// ============= GAMES API =============

export interface Game {
  id: number;
  name: string;
  description?: string;
  game_type: 'cash' | 'tournament';
  date: string;
  time: string;
  max_players: number;
  buy_in?: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  registered_count: number;
  creator_username?: string;
  created_at: string;
}

export interface GameRegistration {
  id: number;
  game_id: number;
  user_id: number;
  registered_at: string;
  status: 'registered' | 'cancelled' | 'participated';
  position?: number;
  winnings?: number;
}

export const gamesAPI = {
  async getAll(filters?: { status?: string; fromDate?: string; toDate?: string }): Promise<Game[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    
    const query = params.toString();
    return fetchAPI(`/games${query ? `?${query}` : ''}`);
  },

  async getById(id: number): Promise<Game> {
    return fetchAPI(`/games/${id}`);
  },

  async create(gameData: Partial<Game>): Promise<Game> {
    return fetchAPI('/games', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  },

  async update(id: number, updates: Partial<Game>): Promise<Game> {
    return fetchAPI(`/games/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: number): Promise<void> {
    return fetchAPI(`/games/${id}`, {
      method: 'DELETE',
    });
  },

  async register(id: number): Promise<GameRegistration> {
    return fetchAPI(`/games/${id}/register`, {
      method: 'POST',
    });
  },

  async unregister(id: number): Promise<void> {
    return fetchAPI(`/games/${id}/register`, {
      method: 'DELETE',
    });
  },

  async getRegistrations(id: number): Promise<User[]> {
    return fetchAPI(`/games/${id}/registrations`);
  },

  async checkRegistration(id: number): Promise<{ isRegistered: boolean }> {
    return fetchAPI(`/games/${id}/check-registration`);
  },

  async complete(id: number, results: Array<{ userId: number; position: number; winnings: number; points: number }>): Promise<void> {
    return fetchAPI(`/games/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ results }),
    });
  },

  async getMyGames(status?: string): Promise<Game[]> {
    return fetchAPI(`/games/user/my-games${status ? `?status=${status}` : ''}`);
  },

  // Admin tournament management
  async startTournament(id: number): Promise<{ message: string; assignments: any[] }> {
    return fetchAPI(`/games/${id}/start`, { method: 'POST' });
  },

  async getSeating(id: number): Promise<any[]> {
    return fetchAPI(`/games/${id}/seating`);
  },

  async eliminatePlayer(id: number, userId: number, finishPlace: number, pointsEarned: number): Promise<{ message: string }> {
    return fetchAPI(`/games/${id}/eliminate`, {
      method: 'POST',
      body: JSON.stringify({ userId, finishPlace, pointsEarned }),
    });
  },

  async restorePlayer(id: number, userId: number): Promise<{ message: string }> {
    return fetchAPI(`/games/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async addBonusPoints(id: number, userId: number, bonusPoints: number): Promise<{ message: string }> {
    return fetchAPI(`/games/${id}/bonus-points`, {
      method: 'POST',
      body: JSON.stringify({ userId, bonusPoints }),
    });
  },

  async rebalanceTables(id: number, seating: any[]): Promise<{ message: string }> {
    return fetchAPI(`/games/${id}/rebalance`, {
      method: 'POST',
      body: JSON.stringify({ seating }),
    });
  },

  async finishTournament(id: number): Promise<{ message: string; results: any[] }> {
    return fetchAPI(`/games/${id}/finish`, { method: 'POST' });
  },

  async cancelStart(id: number): Promise<{ message: string }> {
    return fetchAPI(`/games/${id}/cancel-start`, { method: 'POST' });
  },
};

// ============= TOURNAMENTS API =============

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  prize_pool?: number;
  date: string;
  time: string;
  max_players: number;
  buy_in?: number;
  status: 'upcoming' | 'registration' | 'active' | 'completed' | 'cancelled';
  registered_count: number;
  creator_username?: string;
  created_at: string;
}

export interface TournamentRegistration {
  id: number;
  tournament_id: number;
  user_id: number;
  registered_at: string;
  status: 'registered' | 'cancelled' | 'participated';
  position?: number;
  winnings?: number;
}

export const tournamentsAPI = {
  async getAll(filters?: { status?: string; fromDate?: string }): Promise<Tournament[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    
    const query = params.toString();
    return fetchAPI(`/tournaments${query ? `?${query}` : ''}`);
  },

  async getById(id: number): Promise<Tournament> {
    return fetchAPI(`/tournaments/${id}`);
  },

  async create(tournamentData: Partial<Tournament>): Promise<Tournament> {
    return fetchAPI('/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  },

  async update(id: number, updates: Partial<Tournament>): Promise<Tournament> {
    return fetchAPI(`/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: number): Promise<void> {
    return fetchAPI(`/tournaments/${id}`, {
      method: 'DELETE',
    });
  },

  async register(id: number): Promise<TournamentRegistration> {
    return fetchAPI(`/tournaments/${id}/register`, {
      method: 'POST',
    });
  },

  async unregister(id: number): Promise<void> {
    return fetchAPI(`/tournaments/${id}/register`, {
      method: 'DELETE',
    });
  },

  async getRegistrations(id: number): Promise<User[]> {
    return fetchAPI(`/tournaments/${id}/registrations`);
  },

  async checkRegistration(id: number): Promise<{ isRegistered: boolean }> {
    return fetchAPI(`/tournaments/${id}/check-registration`);
  },

  async complete(id: number, results: Array<{ userId: number; position: number; winnings: number; points: number }>): Promise<void> {
    return fetchAPI(`/tournaments/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ results }),
    });
  },

  async getMyTournaments(status?: string): Promise<Tournament[]> {
    return fetchAPI(`/tournaments/user/my-tournaments${status ? `?status=${status}` : ''}`);
  },
};

export default {
  users: usersAPI,
  games: gamesAPI,
  tournaments: tournamentsAPI,
};

