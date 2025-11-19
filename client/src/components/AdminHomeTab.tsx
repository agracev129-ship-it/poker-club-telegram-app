import { useState, useEffect } from 'react';
import { useGames } from '../hooks/useGames';
import { usersAPI } from '../lib/api';
import { useProfileModeration } from './ProfileModerationContext';
import { PlayersManagementView } from './PlayersManagementView';

// Helper function to format date
const formatDateDisplay = (dateStr: string): string => {
  // If already in DD.MM format, return as is
  if (dateStr.includes('.') && dateStr.length <= 5) {
    return dateStr;
  }
  
  // If in YYYY-MM-DD format, convert to DD.MM
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}`;
  }
  
  return dateStr;
};

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);

const UserCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <polyline points="16 11 18 13 22 9"/>
  </svg>
);

interface AdminHomeTabProps {
  onOpenProfileModeration: () => void;
}

export function AdminHomeTab({ onOpenProfileModeration }: AdminHomeTabProps) {
  const { games, loading } = useGames({ status: 'upcoming' });
  const { getPendingRequests } = useProfileModeration();
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeToday, setActiveToday] = useState(0);
  const [isPlayersManagementOpen, setIsPlayersManagementOpen] = useState(false);

  const pendingProfileRequests = getPendingRequests();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const users = await usersAPI.getAll(1000, 0);
        setTotalUsers(users.length);
        
        // Подсчет активных сегодня (упрощенно)
        const today = new Date().toISOString().split('T')[0];
        const active = users.filter(u => {
          const lastActive = new Date(u.last_active).toISOString().split('T')[0];
          return lastActive === today;
        });
        setActiveToday(active.length);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    
    loadStats();
  }, []);

  const activeTournaments = games.filter(g => g.tournament_status !== 'completed');
  const upcomingTournaments = activeTournaments.slice(0, 5);

  return (
    <div className="bg-black pb-28">
      {/* Header with Admin Badge */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl">Панель управления</h1>
              <div className="px-2 py-0.5 bg-red-700/20 border border-red-700/50 rounded-full flex items-center gap-1">
                <ShieldCheckIcon className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-400">Admin</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">Добро пожаловать в режим администратора</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="px-4 space-y-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 rounded-2xl p-4 border border-blue-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl">{totalUsers}</div>
            </div>
            <div className="text-xs text-gray-400">Всего игроков</div>
            <div className="text-xs text-blue-400 mt-1">Зарегистрировано</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/30 rounded-2xl p-4 border border-yellow-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-2xl">{activeTournaments.length}</div>
            </div>
            <div className="text-xs text-gray-400">Активных турниров</div>
            <div className="text-xs text-yellow-400 mt-1">В системе сейчас</div>
          </div>
        </div>

        {/* Profile Moderation Button */}
        <button
          onClick={onOpenProfileModeration}
          className="w-full bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 hover:bg-[#252525] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-600/40">
                <UserCheckIcon className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-left">
                <h3 className="text-sm mb-0.5">Модерация профилей</h3>
                <p className="text-xs text-gray-500">Заявки на изменение профилей</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingProfileRequests.length > 0 && (
                <span className="text-xs px-3 py-1.5 bg-purple-600/20 border border-purple-600/40 rounded-full text-purple-400">
                  {pendingProfileRequests.length}
                </span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </div>
        </button>

        {/* Players Management Button */}
        <button
          onClick={() => setIsPlayersManagementOpen(true)}
          className="w-full bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 hover:bg-[#252525] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-600/40">
                <UsersIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-left">
                <h3 className="text-sm mb-0.5">Управление игроками</h3>
                <p className="text-xs text-gray-500">Блокировка и управление пользователями</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 bg-blue-600/20 border border-blue-600/40 rounded-full text-blue-400">
                {totalUsers}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </div>
        </button>

        {/* Upcoming Tournaments */}
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-red-500" />
              <h3 className="text-sm">Все турниры</h3>
            </div>
            <span className="text-xs text-gray-400">{activeTournaments.length} активно</span>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Загрузка...
            </div>
          ) : upcomingTournaments.length > 0 ? (
            <div className="space-y-2">
              {upcomingTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-[#252525] rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm mb-0.5 truncate">{tournament.name}</div>
                    <div className="text-xs text-gray-400">
                      {formatDateDisplay(tournament.date)}, {tournament.time} • {tournament.registered_count || 0} / {tournament.max_players} мест
                    </div>
                  </div>
                  <div className="text-xs shrink-0">
                    {tournament.registered_count === tournament.max_players ? (
                      <span className="text-red-400">Заполнен</span>
                    ) : (
                      <span className="text-green-400">Открыт</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Нет турниров
            </div>
          )}
        </div>

        {/* Alerts */}
        {games.length > 0 && (
          <div className="bg-gradient-to-br from-orange-900/30 to-orange-950/30 rounded-2xl p-4 border border-orange-700/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                <AlertCircleIcon className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-sm mb-1">Требуется внимание</div>
                <div className="text-xs text-gray-400">
                  Есть игроки в очереди ожидания на некоторые турниры
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Players Management View Modal */}
      {isPlayersManagementOpen && (
        <PlayersManagementView onClose={() => setIsPlayersManagementOpen(false)} />
      )}
    </div>
  );
}

