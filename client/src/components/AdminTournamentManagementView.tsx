import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Game, gamesAPI, User } from '../lib/api';
import { AdminCheckInView } from './AdminCheckInView';
import { AdminLateRegistrationView } from './AdminLateRegistrationView';

// Types
interface PlayerSeating {
  user_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  table_number: number;
  seat_number: number;
  is_eliminated: boolean;
  finish_place?: number;
  points_earned?: number;
  bonus_points?: number;
}

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const UserXIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="17" x2="22" y1="8" y2="13"/>
    <line x1="22" x2="17" y1="8" y2="13"/>
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

const ShuffleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/>
    <polyline points="18 2 22 6 18 10"/>
    <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/>
    <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/>
    <polyline points="18 14 22 18 18 22"/>
  </svg>
);

const PlusCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 12h8"/>
    <path d="M12 8v8"/>
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

interface AdminTournamentManagementViewProps {
  tournament: Game;
  onClose: () => void;
}

export function AdminTournamentManagementView({ tournament, onClose }: AdminTournamentManagementViewProps) {
  const [seating, setSeating] = useState<PlayerSeating[]>([]);
  const [registeredPlayers, setRegisteredPlayers] = useState<User[]>([]);
  const [tournamentStatus, setTournamentStatus] = useState<'upcoming' | 'started' | 'finished'>(
    (tournament.tournament_status as any) || 'upcoming'
  );
  const [bonusPointsDialog, setBonusPointsDialog] = useState<{ playerId: number; playerName: string } | null>(null);
  const [bonusPointsAmount, setBonusPointsAmount] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // NEW: Tournament lifecycle states
  const [isCheckInViewOpen, setIsCheckInViewOpen] = useState(false);
  const [isLateRegistrationViewOpen, setIsLateRegistrationViewOpen] = useState(false);
  const [tournamentStats, setTournamentStats] = useState<any>(null);

  // Load seating and registrations
  useEffect(() => {
    loadTournamentData();
  }, [tournament.id]);

  const loadTournamentData = async () => {
    try {
      setLoading(true);
      
      // Загружаем зарегистрированных игроков
      const players = await gamesAPI.getRegistrations(tournament.id);
      setRegisteredPlayers(players);
      
      // Всегда пытаемся загрузить рассадку (API вернет пустой массив если рассадки нет)
      const seatingData = await gamesAPI.getSeating(tournament.id);
      setSeating(seatingData);
      
      // NEW: Загружаем статистику турнира
      try {
        const stats = await gamesAPI.getTournamentStats(tournament.id);
        setTournamentStats(stats);
      } catch (error) {
        console.error('Error loading tournament stats:', error);
      }
    } catch (error) {
      console.error('Error loading tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Tournament lifecycle methods
  const handleOpenRegistration = async () => {
    try {
      await gamesAPI.openRegistration(tournament.id);
      alert('Регистрация открыта!');
      await loadTournamentData();
    } catch (error) {
      console.error('Error opening registration:', error);
      alert('Ошибка при открытии регистрации');
    }
  };

  const handleStartCheckIn = async () => {
    try {
      await gamesAPI.startCheckIn(tournament.id);
      alert('Прием игроков начат!');
      setIsCheckInViewOpen(true);
      await loadTournamentData();
    } catch (error) {
      console.error('Error starting check-in:', error);
      alert('Ошибка при начале приема');
    }
  };

  const handleOpenCheckInView = () => {
    setIsCheckInViewOpen(true);
  };

  const handleOpenLateRegistration = () => {
    setIsLateRegistrationViewOpen(true);
  };

  // Rebalance tables to consolidate players
  const handleRebalanceTables = async () => {
    try {
      const activePlayers = seating.filter(p => !p.is_eliminated);
      const playersPerTable = 10;
      
      const tablesNeeded = Math.ceil(activePlayers.length / playersPerTable);
      
      const playersByTable: Record<number, PlayerSeating[]> = {};
      activePlayers.forEach(player => {
        if (!playersByTable[player.table_number]) {
          playersByTable[player.table_number] = [];
        }
        playersByTable[player.table_number].push(player);
      });
      
      const existingTables = Object.keys(playersByTable).map(Number).sort((a, b) => a - b);
      const tablesToKeep = existingTables.slice(0, tablesNeeded);
      const tablesToClose = existingTables.slice(tablesNeeded);
      
      const playersToRelocate: PlayerSeating[] = [];
      tablesToClose.forEach(tableNum => {
        playersToRelocate.push(...playersByTable[tableNum]);
      });
      
      const shuffledPlayersToRelocate = [...playersToRelocate].sort(() => Math.random() - 0.5);
      
      const availableSeats: Array<{ table: number; seat: number }> = [];
      tablesToKeep.forEach(tableNum => {
        const occupiedSeats = new Set(playersByTable[tableNum].map(p => p.seat_number));
        for (let seat = 1; seat <= playersPerTable; seat++) {
          if (!occupiedSeats.has(seat)) {
            availableSeats.push({ table: tableNum, seat });
          }
        }
      });
      
      const rebalanceData = shuffledPlayersToRelocate.map((player, index) => ({
        userId: player.user_id,
        tableNumber: index < availableSeats.length ? availableSeats[index].table : player.table_number,
        seatNumber: index < availableSeats.length ? availableSeats[index].seat : player.seat_number,
      }));

      await gamesAPI.rebalanceTables(tournament.id, rebalanceData);
      await loadTournamentData();
      
      alert(`Столы ребалансированы! Пересажено игроков: ${rebalanceData.length}`);
    } catch (error) {
      console.error('Error rebalancing tables:', error);
      alert('Ошибка при ребалансировке столов');
    }
  };

  const handleStartTournament = async () => {
    try {
      setLoading(true);
      await gamesAPI.startTournament(tournament.id);
      setTournamentStatus('started');
      await loadTournamentData();
      alert('Турнир начался! Рассадка сгенерирована.');
    } catch (error) {
      console.error('Error starting tournament:', error);
      alert('Ошибка при начале турнира: ' + (error instanceof Error ? error.message : ''));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTournament = async () => {
    try {
      setLoading(true);
      await gamesAPI.cancelStart(tournament.id);
      setSeating([]);
      setTournamentStatus('upcoming');
      setShowCancelConfirm(false);
      alert('Турнир отменен. Можно начать заново.');
      await loadTournamentData();
    } catch (error) {
      console.error('Error cancelling tournament:', error);
      alert('Ошибка при отмене турнира');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTournament = async () => {
    try {
      setLoading(true);
      await gamesAPI.finishTournament(tournament.id);
      setTournamentStatus('finished');
      alert('Турнир завершён! Результаты сохранены в историю.');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Error finishing tournament:', error);
      alert('Ошибка при завершении турнира');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminatePlayer = async (playerId: number) => {
    try {
      const activePlayers = seating.filter(p => !p.is_eliminated);
      const newPlace = activePlayers.length;
      
      // Get points from localStorage tournamentSettings
      const tournamentSettings = JSON.parse(localStorage.getItem('tournamentSettings') || '{}');
      const settings = tournamentSettings[tournament.id] || {};
      const pointDist = settings.pointDistribution || [];
      const points = pointDist.find((p: any) => p.place === newPlace)?.points || 0;

      // Call API to eliminate player
      await gamesAPI.eliminatePlayer(tournament.id, playerId, newPlace, points);
      
      // Reload seating
      await loadTournamentData();
      
      alert(`Игрок выбыл. Место: ${newPlace}, Очки: ${points}`);

      // Check if only one player remains
      const updatedSeating = await gamesAPI.getSeating(tournament.id);
      const remainingPlayers = updatedSeating.filter((p: any) => !p.is_eliminated);
      
      if (remainingPlayers.length === 1) {
        const winner = remainingPlayers[0];
        const firstPlacePoints = pointDist.find((p: any) => p.place === 1)?.points || 0;
        
        // Eliminate winner with 1st place
        await gamesAPI.eliminatePlayer(tournament.id, winner.user_id, 1, firstPlacePoints);
        
        // Finish tournament
        await handleFinishTournament();
        
        alert(`Турнир завершен! Победитель: ${winner.first_name} ${winner.last_name || ''}`);
      }
    } catch (error) {
      console.error('Error eliminating player:', error);
      alert('Ошибка при выбывании игрока');
    }
  };

  const handleRestorePlayer = async (playerId: number) => {
    try {
      await gamesAPI.restorePlayer(tournament.id, playerId);
      await loadTournamentData();
      alert('Игрок восстановлен');
    } catch (error) {
      console.error('Error restoring player:', error);
      alert('Ошибка при восстановлении игрока');
    }
  };

  const handleAddBonusPoints = async () => {
    if (!bonusPointsDialog) return;
    
    const points = parseInt(bonusPointsAmount);
    if (isNaN(points) || points <= 0) {
      alert('Введите корректное количество очков');
      return;
    }

    try {
      await gamesAPI.addBonusPoints(tournament.id, bonusPointsDialog.playerId, points);
      await loadTournamentData();
      alert(`Начислено +${points} бонусных очков игроку ${bonusPointsDialog.playerName}`);
      setBonusPointsDialog(null);
      setBonusPointsAmount('');
    } catch (error) {
      console.error('Error adding bonus points:', error);
      alert('Ошибка при начислении бонусных очков');
    }
  };

  // Group players by table
  const tableGroups = seating.reduce((acc, player) => {
    if (!acc[player.table_number]) {
      acc[player.table_number] = [];
    }
    acc[player.table_number].push(player);
    return acc;
  }, {} as Record<number, PlayerSeating[]>);

  Object.keys(tableGroups).forEach(tableNum => {
    tableGroups[Number(tableNum)].sort((a, b) => a.seat_number - b.seat_number);
  });

  const activePlayers = seating
    .filter(p => !p.is_eliminated)
    .sort((a, b) => {
      if (a.table_number !== b.table_number) {
        return a.table_number - b.table_number;
      }
      return a.seat_number - b.seat_number;
    });
  const eliminatedPlayers = seating.filter(p => p.is_eliminated).sort((a, b) => (a.finish_place || 0) - (b.finish_place || 0));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-50 overflow-y-auto"
    >
      <div className="min-h-screen px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl mb-1 truncate">{tournament.name}</h2>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                tournamentStatus === 'upcoming' 
                  ? 'bg-gray-700 text-gray-300'
                  : tournamentStatus === 'started'
                  ? 'bg-green-700/30 text-green-400'
                  : 'bg-red-700/30 text-red-400'
              }`}>
                {tournamentStatus === 'upcoming' ? 'Ожидание' : tournamentStatus === 'started' ? 'В процессе' : 'Завершен'}
              </span>
              <span className="text-xs text-gray-400">
                Игроков: {tournament.registered_count || 0}/{tournament.max_players}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-all ml-3 shrink-0"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* NEW: Tournament Lifecycle Management */}
        {tournamentStatus === 'upcoming' && (tournament.registered_count || 0) > 0 && (
          <div className="mb-6 space-y-3">
            {/* Tournament Stats */}
            {tournamentStats && (
              <div className="bg-gray-800/50 rounded-xl p-4 mb-4 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-medium text-green-500">{tournamentStats.paid_count || 0}</div>
                  <div className="text-xs text-gray-400">Оплатили</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-medium text-blue-500">{tournamentStats.checked_in_count || 0}</div>
                  <div className="text-xs text-gray-400">Явились</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-medium text-yellow-500">{tournamentStats.registered_count || 0}</div>
                  <div className="text-xs text-gray-400">Всего</div>
                </div>
              </div>
            )}

            {/* Lifecycle Action Buttons */}
            <Button
              onClick={handleOpenRegistration}
              variant="outline"
              className="w-full bg-blue-700/20 border-blue-700/50 hover:bg-blue-700/30 text-blue-400 hover:text-blue-300"
            >
              Открыть регистрацию
            </Button>

            <Button
              onClick={handleStartCheckIn}
              variant="outline"
              className="w-full bg-purple-700/20 border-purple-700/50 hover:bg-purple-700/30 text-purple-400 hover:text-purple-300"
            >
              Начать прием игроков
            </Button>

            <Button
              onClick={handleOpenCheckInView}
              variant="outline"
              className="w-full bg-indigo-700/20 border-indigo-700/50 hover:bg-indigo-700/30 text-indigo-400 hover:text-indigo-300"
            >
              Открыть панель приема
            </Button>

            <Button
              disabled={loading}
              onClick={handleStartTournament}
              className="w-full bg-gradient-to-br from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 border-0 py-6"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Начать турнир
            </Button>
          </div>
        )}

        {tournamentStatus === 'upcoming' && (tournament.registered_count || 0) === 0 && (
          <div className="bg-gray-800/30 rounded-2xl p-6 mb-6 text-center">
            <p className="text-gray-400">Нет зарегистрированных игроков</p>
          </div>
        )}

        {/* Tournament Control Buttons */}
        {tournamentStatus === 'started' && (
          <div className="mb-4 space-y-3">
            {/* NEW: Late Registration Button */}
            <Button
              onClick={handleOpenLateRegistration}
              variant="outline"
              className="w-full bg-cyan-700/20 border-cyan-700/50 hover:bg-cyan-700/30 text-cyan-400 hover:text-cyan-300"
            >
              <PlusCircleIcon className="w-4 h-4 mr-2" />
              Поздняя регистрация
            </Button>

            {activePlayers.length > 0 && (
              <Button
                onClick={handleRebalanceTables}
                variant="outline"
                className="w-full bg-blue-700/20 border-blue-700/50 hover:bg-blue-700/30 text-blue-400 hover:text-blue-300"
              >
                <ShuffleIcon className="w-4 h-4 mr-2" />
                Ребалансировать столы
              </Button>
            )}
            {activePlayers.length <= 1 && (
              <Button
                onClick={handleFinishTournament}
                className="w-full bg-gradient-to-br from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 border-0"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Завершить турнир
              </Button>
            )}
            <Button
              onClick={() => setShowCancelConfirm(true)}
              variant="outline"
              className="w-full bg-orange-700/20 border-orange-700/50 hover:bg-orange-700/30 text-orange-400 hover:text-orange-300"
            >
              <XIcon className="w-4 h-4 mr-2" />
              Отменить начало турнира
            </Button>
          </div>
        )}

        {/* Active Players Section */}
        {tournamentStatus === 'started' && activePlayers.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrophyIcon className="w-5 h-5 text-red-500" />
              <h3 className="text-lg">Активные игроки ({activePlayers.length})</h3>
            </div>

            {/* Table Groups */}
            {Object.entries(tableGroups).map(([tableNum, players]) => {
              const activeTablePlayers = players.filter(p => !p.is_eliminated);
              if (activeTablePlayers.length === 0) return null;

              return (
                <div key={tableNum} className="mb-6">
                  <div className="text-sm text-gray-400 mb-3">Стол {tableNum}</div>
                  
                  {/* Table Visual - 10 seats in 2 rows */}
                  <div className="bg-gradient-to-br from-green-900/30 to-green-950/20 rounded-3xl p-6 mb-4 border-2 border-green-700/30 relative">
                    <div className="absolute inset-0 rounded-3xl border-4 border-green-600/20"></div>
                    <div className="space-y-3 relative z-10">
                      {/* Top row - 5 seats */}
                      <div className="grid grid-cols-5 gap-3">
                        {[1, 2, 3, 4, 5].map(seatNum => {
                          const player = players.find(p => p.seat_number === seatNum && !p.is_eliminated);
                          return (
                            <div
                              key={seatNum}
                              className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-center ${
                                player 
                                  ? 'bg-gradient-to-br from-red-700/40 to-red-900/40 border-2 border-red-600/50'
                                  : 'bg-gray-800/20 border border-gray-700/30'
                              }`}
                            >
                              <div className="text-xs text-gray-400 mb-1">{seatNum}</div>
                              {player && (
                                <div className="text-xs truncate w-full px-1">{player.first_name}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Bottom row - 5 seats */}
                      <div className="grid grid-cols-5 gap-3">
                        {[6, 7, 8, 9, 10].map(seatNum => {
                          const player = players.find(p => p.seat_number === seatNum && !p.is_eliminated);
                          return (
                            <div
                              key={seatNum}
                              className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-center ${
                                player 
                                  ? 'bg-gradient-to-br from-red-700/40 to-red-900/40 border-2 border-red-600/50'
                                  : 'bg-gray-800/20 border border-gray-700/30'
                              }`}
                            >
                              <div className="text-xs text-gray-400 mb-1">{seatNum}</div>
                              {player && (
                                <div className="text-xs truncate w-full px-1">{player.first_name}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Player List for this table */}
                  <div className="space-y-2">
                    {activeTablePlayers.map(player => (
                      <div
                        key={player.user_id}
                        className="bg-[#1a1a1a] rounded-xl p-3 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm mb-0.5 truncate">{player.first_name} {player.last_name || ''}</div>
                          <div className="text-xs text-gray-400">Стол {player.table_number}, Место {player.seat_number}</div>
                          {player.bonus_points && player.bonus_points > 0 && (
                            <div className="text-xs text-yellow-400 mt-0.5">Бонус: +{player.bonus_points}</div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            onClick={() => setBonusPointsDialog({ playerId: player.user_id, playerName: `${player.first_name} ${player.last_name || ''}` })}
                            variant="outline"
                            className="bg-yellow-700/20 border-yellow-700/50 hover:bg-yellow-700/30 text-yellow-400 hover:text-yellow-300 text-xs px-3"
                          >
                            <PlusCircleIcon className="w-3.5 h-3.5 mr-1" />
                            Доп.очки
                          </Button>
                          <Button
                            onClick={() => handleEliminatePlayer(player.user_id)}
                            variant="outline"
                            className="bg-red-700/20 border-red-700/50 hover:bg-red-700/30 text-red-400 hover:text-red-300 text-xs px-3"
                          >
                            <UserXIcon className="w-3.5 h-3.5 mr-1" />
                            Выбыл
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Eliminated Players Section */}
        {eliminatedPlayers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg mb-4">Выбывшие игроки ({eliminatedPlayers.length})</h3>
            <div className="space-y-2">
              {eliminatedPlayers.map(player => {
                const totalPoints = (player.points_earned || 0) + (player.bonus_points || 0);
                return (
                  <div
                    key={player.user_id}
                    className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-3 border border-gray-700/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-sm">#{player.finish_place}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm truncate">{player.first_name} {player.last_name || ''}</div>
                          <div className="text-xs text-gray-400">
                            Стол {player.table_number}, Место {player.seat_number}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm text-yellow-400">
                          {player.bonus_points && player.bonus_points > 0 ? (
                            <div>
                              <div>+{totalPoints} очков</div>
                              <div className="text-xs text-gray-400">
                                ({player.points_earned} + {player.bonus_points} бонус)
                              </div>
                            </div>
                          ) : (
                            <div>+{player.points_earned} очков</div>
                          )}
                        </div>
                        {tournamentStatus === 'started' && (
                          <button
                            onClick={() => handleRestorePlayer(player.user_id)}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors mt-1"
                          >
                            Восстановить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tournament Finished */}
        {tournamentStatus === 'finished' && (
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/20 rounded-2xl p-6 border border-yellow-700/30 text-center">
            <TrophyIcon className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-xl mb-2">Турнир завершен!</h3>
            <p className="text-gray-400 text-sm">Результаты сохранены</p>
          </div>
        )}

        {/* No Players Registered Yet */}
        {tournamentStatus === 'upcoming' && registeredPlayers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrophyIcon className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">Игроки еще не зарегистрировались</p>
          </div>
        )}
      </div>

      {/* Bonus Points Dialog */}
      {bonusPointsDialog && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full border border-gray-800"
          >
            <h3 className="text-lg mb-2">Начислить бонусные очки</h3>
            <p className="text-sm text-gray-400 mb-4">{bonusPointsDialog.playerName}</p>
            
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">Количество очков</label>
              <input
                type="number"
                min="1"
                value={bonusPointsAmount}
                onChange={(e) => setBonusPointsAmount(e.target.value)}
                placeholder="Введите количество"
                className="w-full bg-[#252525] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-red-700"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setBonusPointsDialog(null);
                  setBonusPointsAmount('');
                }}
                variant="outline"
                className="flex-1 bg-gray-700/20 border-gray-700/50 hover:bg-gray-700/30"
              >
                Отмена
              </Button>
              <Button
                onClick={handleAddBonusPoints}
                className="flex-1 bg-gradient-to-br from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 border-0"
              >
                Начислить
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Tournament Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full border border-orange-800/50"
          >
            <h3 className="text-lg mb-2">Отменить начало турнира?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Все данные о рассадке и выбывших игроках будут удалены. Турнир вернется в статус ожидания и его можно будет начать заново.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelConfirm(false)}
                variant="outline"
                className="flex-1 bg-gray-700/20 border-gray-700/50 hover:bg-gray-700/30"
              >
                Отмена
              </Button>
              <Button
                onClick={handleCancelTournament}
                className="flex-1 bg-gradient-to-br from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 border-0"
              >
                Подтвердить
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* NEW: Check-in View */}
      {isCheckInViewOpen && (
        <AdminCheckInView
          game={tournament}
          onClose={() => {
            setIsCheckInViewOpen(false);
            loadTournamentData();
          }}
        />
      )}

      {/* NEW: Late Registration View */}
      {isLateRegistrationViewOpen && (
        <AdminLateRegistrationView
          game={tournament}
          onClose={() => {
            setIsLateRegistrationViewOpen(false);
            loadTournamentData();
          }}
        />
      )}
    </motion.div>
  );
}

