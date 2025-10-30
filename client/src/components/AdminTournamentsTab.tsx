import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreateTournamentView } from './CreateTournamentView';
import { AdminTournamentManagementView } from './AdminTournamentManagementView';
import { useGames } from '../hooks/useGames';
import { gamesAPI, Game } from '../lib/api';

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m9 12 2 2 4-4"/>
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

const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14"/>
    <path d="M12 5v14"/>
  </svg>
);

const Trash2Icon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    <line x1="10" x2="10" y1="11" y2="17"/>
    <line x1="14" x2="14" y1="11" y2="17"/>
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

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);

const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
  </svg>
);

// Helper function to format date
const formatDateDisplay = (dateStr: string): string => {
  if (dateStr.includes('.') && dateStr.length <= 5) {
    return dateStr;
  }
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}`;
  }
  return dateStr;
};

export function AdminTournamentsTab() {
  const { games, loading, refreshGames } = useGames({ status: 'all' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Game | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  // Refresh on mount
  useEffect(() => {
    refreshGames();
  }, []);

  // Show all active tournaments (upcoming + started, exclude finished)
  const upcomingTournaments = games.filter(g => g.tournament_status !== 'finished');

  const handleDeleteTournament = async () => {
    if (!deleteConfirm) return;
    
    try {
      await gamesAPI.delete(deleteConfirm.id);
      alert('Турнир удален');
      setDeleteConfirm(null);
      refreshGames();
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Ошибка при удалении турнира');
    }
  };

  const handleSaveTournament = async () => {
    // Callback после создания турнира
    await refreshGames();
  };

  return (
    <div className="bg-black pb-28">
      {/* Header with Admin Badge */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrophyIcon className="w-6 h-6 text-red-500" />
              <h1 className="text-2xl">Управление турнирами</h1>
              <div className="px-2 py-0.5 bg-red-700/20 border border-red-700/50 rounded-full flex items-center gap-1">
                <ShieldCheckIcon className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-400">Admin</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">Создавайте и управляйте турнирами</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-4 border border-red-700/50 hover:from-red-600 hover:to-red-800 transition-all flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Создать турнир</span>
          </button>
        </div>
      </div>

      {/* Tournaments List */}
      <div className="px-4 space-y-3">
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-red-500" />
              <h3 className="text-sm">Все турниры</h3>
            </div>
            <span className="text-xs text-gray-400">{upcomingTournaments.length} запланировано</span>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Загрузка турниров...
            </div>
          ) : upcomingTournaments.length > 0 ? (
            <div className="space-y-2">
              {upcomingTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-[#252525] rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                  onClick={() => setSelectedTournament(tournament)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm mb-0.5 truncate">{tournament.name}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>{formatDateDisplay(tournament.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>{tournament.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-3 h-3" />
                        <span>{tournament.registered_count || 0} / {tournament.max_players}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tournament.tournament_status && (
                      <div className={`text-xs shrink-0 px-2 py-0.5 rounded-full ${
                        tournament.tournament_status === 'upcoming'
                          ? 'bg-gray-700/50 text-gray-300'
                          : tournament.tournament_status === 'started'
                          ? 'bg-green-700/30 text-green-400'
                          : 'bg-red-700/30 text-red-400'
                      }`}>
                        {tournament.tournament_status === 'upcoming' 
                          ? 'Ожидание' 
                          : tournament.tournament_status === 'started' 
                          ? 'Идёт' 
                          : 'Завершён'}
                      </div>
                    )}
                    {!tournament.tournament_status && (
                      <div className="text-xs text-green-400 shrink-0">
                        {tournament.registered_count === tournament.max_players ? 'Заполнен' : 'Открыт'}
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ id: tournament.id, name: tournament.name });
                      }}
                      className="w-8 h-8 rounded-full bg-red-700/20 flex items-center justify-center hover:bg-red-700/30 transition-all shrink-0"
                    >
                      <Trash2Icon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Нет турниров. Загрузите тестовые!
            </div>
          )}
        </div>

        {/* Alerts - показываем если есть турниры с максимумом игроков */}
        {upcomingTournaments.some(t => t.registered_count === t.max_players) && (
          <div className="bg-gradient-to-br from-orange-900/30 to-orange-950/30 rounded-2xl p-4 border border-orange-700/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                <AlertCircleIcon className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-sm mb-1">Требуется внимание</div>
                <div className="text-xs text-gray-400">
                  Некоторые турниры полностью заполнены
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      {isCreateOpen && (
        <CreateTournamentView
          onClose={() => setIsCreateOpen(false)}
          onSave={handleSaveTournament}
        />
      )}

      {/* Tournament Management Modal */}
      {selectedTournament && (
        <AdminTournamentManagementView
          tournament={selectedTournament}
          onClose={() => {
            setSelectedTournament(null);
            refreshGames();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full border border-red-800/50"
          >
            <h3 className="text-lg mb-2">Удалить турнир?</h3>
            <p className="text-sm text-gray-400 mb-1">
              <span className="text-white">{deleteConfirm.name}</span>
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Все данные турнира будут безвозвратно удалены.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-700/20 border border-gray-700/50 hover:bg-gray-700/30 rounded-xl py-2 px-4"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteTournament}
                className="flex-1 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 rounded-xl py-2 px-4"
              >
                Удалить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

