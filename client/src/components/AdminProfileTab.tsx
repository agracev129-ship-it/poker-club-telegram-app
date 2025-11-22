import { useState, useEffect } from 'react';
import { useAdmin } from './AdminContext';
import { SettingsView } from './SettingsView';
import { useGames } from '../hooks/useGames';
import { usersAPI } from '../lib/api';
import { getIOSPaddingTop } from '../lib/platform';

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
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

const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export function AdminProfileTab() {
  const { setAdminMode } = useAdmin();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { games, loading: gamesLoading } = useGames({ status: 'all' });
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeToday, setActiveToday] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const users = await usersAPI.getAll(1000, 0);
        setTotalUsers(users.length);
        
        // Подсчет активных сегодня
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

  const finishedTournaments = games.filter(g => g.tournament_status === 'completed').length;
  const upcomingTournaments = games.filter(g => g.tournament_status === 'upcoming').length;

  const handleExitAdminMode = () => {
    setAdminMode(false);
  };

  return (
    <div className={`min-h-screen bg-black pb-28 ${getIOSPaddingTop()}`}>
      {/* Admin Header with Badge */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border-2 border-red-700 relative">
            <span className="text-2xl">AD</span>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center border-2 border-black">
              <ShieldCheckIcon className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-xl mb-1">Администратор</h1>
            <p className="text-sm text-gray-400">Полный доступ • Режим управления</p>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-all"
          >
            <SettingsIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Admin Notice */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-2xl p-4 border border-red-700/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-700/30 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm mb-1">Режим администратора активен</div>
              <div className="text-xs text-gray-400 leading-relaxed">
                У вас есть полный доступ к управлению турнирами, игроками и настройками клуба
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mb-4">
        <div className="text-sm text-gray-400 mb-2">Общая статистика</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl">{totalUsers}</div>
            </div>
            <div className="text-xs text-gray-400">Всего игроков</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-2xl">{gamesLoading ? '...' : finishedTournaments}</div>
            </div>
            <div className="text-xs text-gray-400">Турниров проведено</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl">{gamesLoading ? '...' : upcomingTournaments}</div>
            </div>
            <div className="text-xs text-gray-400">Запланировано</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl">{activeToday}</div>
            </div>
            <div className="text-xs text-gray-400">Активных сегодня</div>
          </div>
        </div>
      </div>

      {/* Exit Admin Mode */}
      <div className="px-4 mb-4">
        <button 
          onClick={handleExitAdminMode}
          className="w-full bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-4 border border-red-700/50 hover:from-red-600 hover:to-red-800 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm">Вид пользователя</div>
                <div className="text-xs text-gray-300">Выйти из режима администратора</div>
              </div>
            </div>
            <ChevronDownIcon className="w-5 h-5 rotate-[-90deg]" />
          </div>
        </button>
      </div>

      {/* Settings View */}
      {isSettingsOpen && <SettingsView onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}

