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
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    // Если пользователь заблокирован - показываем специальное сообщение
    if (response.status === 403 && errorData.blocked) {
      alert(errorData.message || 'Ваш аккаунт был заблокирован администратором');
      throw new Error(errorData.message || 'Доступ заблокирован');
    }
    
    // Формируем понятное сообщение об ошибке
    const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    const error = new Error(errorMessage);
    (error as any).error = errorData.error;
    (error as any).response = errorData;
    (error as any).status = response.status;
    throw error;
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
  name?: string;  // Отображаемое имя (first_name + last_name)
  photo_url?: string;
  is_admin: boolean;
  is_blocked?: boolean;
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

  async cancelFriendRequest(userId: number): Promise<{ message: string }> {
    return fetchAPI('/users/cancel-friend-request', {
      method: 'DELETE',
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

  async getTournamentResults(id: number): Promise<{
    game: Game;
    participants: Array<{
      user_id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      finish_place?: number;
      points_earned: number;
      bonus_points: number;
      total_points: number;
      participated: boolean;
    }>;
  }> {
    return fetchAPI(`/games/${id}/results`);
  },

  // ============ SIMPLIFIED TOURNAMENT LIFECYCLE METHODS ============

  async confirmPayment(
    id: number,
    userId: number,
    amount: number,
    paymentMethod: string,
    notes?: string
  ): Promise<{ message: string; registration: GameRegistration }> {
    return fetchAPI(`/games/${id}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ userId, amount, paymentMethod, notes }),
    });
  },

  async markNoShow(id: number, userId: number, reason?: string): Promise<{ message: string; registration: GameRegistration }> {
    return fetchAPI(`/games/${id}/mark-no-show`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason }),
    });
  },

  async restorePlayer(id: number, userId: number): Promise<{ message: string; registration: GameRegistration }> {
    return fetchAPI(`/games/${id}/restore-player`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async onsiteRegistration(
    id: number,
    userId: number,
    amount: number,
    paymentMethod: string,
    notes?: string
  ): Promise<{ message: string; registration: GameRegistration }> {
    return fetchAPI(`/games/${id}/onsite-registration`, {
      method: 'POST',
      body: JSON.stringify({ userId, amount, paymentMethod, notes }),
    });
  },

  async lateRegistration(
    id: number,
    userId: number,
    amount: number,
    paymentMethod: string,
    tableNumber?: number,
    seatNumber?: number,
    initialStack?: number,
    notes?: string
  ): Promise<{ message: string; registration: GameRegistration }> {
    return fetchAPI(`/games/${id}/late-registration`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        amount,
        paymentMethod,
        tableNumber: tableNumber || 0,
        seatNumber: seatNumber || 0,
        initialStack,
        notes,
      }),
    });
  },

  async excludeNoShow(id: number): Promise<{ message: string; count: number; excluded: GameRegistration[] }> {
    return fetchAPI(`/games/${id}/exclude-no-show`, { method: 'POST' });
  },

  async getTournamentStats(id: number): Promise<{
    registered_count: string;
    paid_count: string;
    no_show_count: string;
    late_registered_count: string;
    playing_count: string;
    eliminated_count: string;
    total_prize_pool: string;
  }> {
    return fetchAPI(`/games/${id}/stats`);
  },

  async getPlayersByStatus(id: number, status: string): Promise<Array<GameRegistration & {
    user_name: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
    telegram_id: number;
  }>> {
    return fetchAPI(`/games/${id}/players?status=${status}`);
  },

  async getLateRegistrationStatus(id: number): Promise<{
    available: boolean;
    endsAt?: string;
    levelsRemaining?: number;
    tournamentStatus: string;
  }> {
    return fetchAPI(`/games/${id}/late-registration/status`);
  },

  async finalizeResults(
    id: number,
    options?: {
      autoCalculatePoints?: boolean;
      manualAdjustments?: Array<{ userId: number; bonusPoints: number; reason: string }>;
    }
  ): Promise<{ message: string; results: any }> {
    return fetchAPI(`/games/${id}/finalize-results`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },

  async getActions(id: number, limit?: number): Promise<Array<{
    id: number;
    game_id: number;
    admin_id: number;
    action_type: string;
    target_user_id?: number;
    details: any;
    created_at: string;
    admin_name: string;
    admin_photo?: string;
    target_user_name?: string;
    target_user_photo?: string;
  }>> {
    const params = limit ? `?limit=${limit}` : '';
    return fetchAPI(`/games/${id}/actions${params}`);
  },

  async getPayments(id: number): Promise<Array<{
    id: number;
    game_id: number;
    user_id: number;
    registration_id?: number;
    amount: string;
    payment_method: string;
    status: string;
    confirmed_by?: number;
    confirmed_at?: string;
    notes?: string;
    created_at: string;
    user_name: string;
    user_photo?: string;
    confirmed_by_name?: string;
  }>> {
    return fetchAPI(`/games/${id}/payments`);
  },

  async getPointStructure(id: number): Promise<Array<{
    id: number;
    game_id: number;
    place_from: number;
    place_to: number;
    points: number;
    prize_percentage?: string;
    created_at: string;
  }>> {
    return fetchAPI(`/games/${id}/point-structure`);
  },

  async updatePointStructure(
    id: number,
    structure: Array<{
      place_from: number;
      place_to: number;
      points: number;
      prize_percentage?: number;
    }>
  ): Promise<{ message: string; structure: any[] }> {
    return fetchAPI(`/games/${id}/point-structure`, {
      method: 'POST',
      body: JSON.stringify({ structure }),
    });
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

// ============= PROFILE REQUESTS API =============

export interface ProfileChangeRequest {
  id: number;
  user_id: number;
  current_name: string;
  current_avatar_url?: string;
  requested_name?: string;
  requested_avatar_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user_name?: string;
  telegram_id?: number;
  user_avatar_url?: string;
}

export const profileRequestsAPI = {
  async create(data: {
    currentName: string;
    currentAvatarUrl?: string;
    requestedName?: string;
    requestedAvatarUrl?: string;
  }): Promise<ProfileChangeRequest> {
    return fetchAPI('/profile-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAll(status?: 'pending' | 'approved' | 'rejected'): Promise<ProfileChangeRequest[]> {
    return fetchAPI(`/profile-requests${status ? `?status=${status}` : ''}`);
  },

  async getMy(status?: string): Promise<ProfileChangeRequest[]> {
    return fetchAPI(`/profile-requests/my${status ? `?status=${status}` : ''}`);
  },

  async getById(id: number): Promise<ProfileChangeRequest> {
    return fetchAPI(`/profile-requests/${id}`);
  },

  async approve(id: number): Promise<ProfileChangeRequest> {
    return fetchAPI(`/profile-requests/${id}/approve`, {
      method: 'POST',
    });
  },

  async reject(id: number): Promise<ProfileChangeRequest> {
    return fetchAPI(`/profile-requests/${id}/reject`, {
      method: 'POST',
    });
  },

  async delete(id: number): Promise<void> {
    return fetchAPI(`/profile-requests/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============= USER MANAGEMENT API =============

export const userManagementAPI = {
  async search(query: string): Promise<User[]> {
    return fetchAPI(`/users/search?q=${encodeURIComponent(query)}`);
  },

  async block(userId: number): Promise<{ message: string; user: User }> {
    return fetchAPI(`/users/${userId}/block`, {
      method: 'POST',
    });
  },

  async unblock(userId: number): Promise<{ message: string; user: User }> {
    return fetchAPI(`/users/${userId}/unblock`, {
      method: 'POST',
    });
  },
};

export default {
  users: usersAPI,
  games: gamesAPI,
  tournaments: tournamentsAPI,
  profileRequests: profileRequestsAPI,
  userManagement: userManagementAPI,
};

