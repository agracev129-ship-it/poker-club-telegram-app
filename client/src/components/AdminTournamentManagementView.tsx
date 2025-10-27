import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Tournament, PlayerSeating, useTournaments } from './TournamentsContext';

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
  tournament: Tournament;
  onClose: () => void;
}

export function AdminTournamentManagementView({ tournament, onClose }: AdminTournamentManagementViewProps) {
  const { updateTournament } = useTournaments();
  const [seating, setSeating] = useState<PlayerSeating[]>(tournament.seating || []);
  const [tournamentStatus, setTournamentStatus] = useState<'upcoming' | 'started' | 'finished'>(
    tournament.tournamentStatus || 'upcoming'
  );
  const [bonusPointsDialog, setBonusPointsDialog] = useState<{ playerId: number; playerName: string } | null>(null);
  const [bonusPointsAmount, setBonusPointsAmount] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Generate seating arrangement when tournament starts
  const generateSeating = () => {
    const players = tournament.registeredPlayers || [];
    const playersPerTable = 10; // Poker table standard
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    const newSeating: PlayerSeating[] = shuffledPlayers.map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      table: Math.floor(index / playersPerTable) + 1,
      seat: (index % playersPerTable) + 1,
      isEliminated: false,
    }));

    setSeating(newSeating);
    return newSeating;
  };

  // Rebalance tables to consolidate players
  const handleRebalanceTables = () => {
    const activePlayers = seating.filter(p => !p.isEliminated);
    const playersPerTable = 10;
    
    const tablesNeeded = Math.ceil(activePlayers.length / playersPerTable);
    
    const playersByTable: Record<number, PlayerSeating[]> = {};
    activePlayers.forEach(player => {
      if (!playersByTable[player.table]) {
        playersByTable[player.table] = [];
      }
      playersByTable[player.table].push(player);
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
      const occupiedSeats = new Set(playersByTable[tableNum].map(p => p.seat));
      for (let seat = 1; seat <= playersPerTable; seat++) {
        if (!occupiedSeats.has(seat)) {
          availableSeats.push({ table: tableNum, seat });
        }
      }
    });
    
    const relocationMap = new Map<number, { table: number; seat: number }>();
    shuffledPlayersToRelocate.forEach((player, index) => {
      if (index < availableSeats.length) {
        relocationMap.set(player.playerId, availableSeats[index]);
      }
    });
    
    const updatedSeating = seating.map(player => {
      if (player.isEliminated) return player;
      
      const relocation = relocationMap.get(player.playerId);
      if (relocation) {
        return {
          ...player,
          table: relocation.table,
          seat: relocation.seat,
        };
      }
      
      return player;
    });

    setSeating(updatedSeating);
    updateTournament(tournament.id, {
      seating: updatedSeating,
    });
    
    const movedCount = relocationMap.size;
    alert(`Столы ребалансированы! Пересажено игроков: ${movedCount}`);
  };

  const handleStartTournament = () => {
    const newSeating = generateSeating();
    setTournamentStatus('started');
    updateTournament(tournament.id, {
      tournamentStatus: 'started',
      seating: newSeating,
    });
    alert('Турнир начался! Рассадка сгенерирована.');
  };

  const handleCancelTournament = () => {
    setSeating([]);
    setTournamentStatus('upcoming');
    updateTournament(tournament.id, {
      tournamentStatus: 'upcoming',
      seating: [],
    });
    setShowCancelConfirm(false);
    alert('Турнир отменен. Можно начать заново.');
  };

  const handleFinishTournament = () => {
    setTournamentStatus('finished');
    updateTournament(tournament.id, {
      tournamentStatus: 'finished',
    });
    alert('Турнир завершён! Результаты сохранены в историю.');
    setTimeout(() => onClose(), 1500);
  };

  const handleEliminatePlayer = (playerId: number) => {
    const activePlayers = seating.filter(p => !p.isEliminated);
    const newPlace = activePlayers.length;
    
    const pointDist = tournament.pointDistribution || [];
    const points = pointDist.find(p => p.place === newPlace)?.points || 0;

    const updatedSeating = seating.map(p => {
      if (p.playerId === playerId) {
        return {
          ...p,
          isEliminated: true,
          finishPlace: newPlace,
          pointsEarned: points,
        };
      }
      return p;
    });

    setSeating(updatedSeating);
    updateTournament(tournament.id, {
      seating: updatedSeating,
    });

    alert(`Игрок выбыл. Место: ${newPlace}, Очки: ${points}`);

    const remainingPlayers = updatedSeating.filter(p => !p.isEliminated);
    if (remainingPlayers.length === 1) {
      const winner = remainingPlayers[0];
      const firstPlacePoints = pointDist.find(p => p.place === 1)?.points || 0;
      const finalSeating = updatedSeating.map(p => {
        if (p.playerId === winner.playerId) {
          return {
            ...p,
            isEliminated: true,
            finishPlace: 1,
            pointsEarned: firstPlacePoints,
          };
        }
        return p;
      });

      setSeating(finalSeating);
      setTournamentStatus('finished');
      updateTournament(tournament.id, {
        tournamentStatus: 'finished',
        seating: finalSeating,
      });
      alert(`Турнир завершен! Победитель: ${winner.playerName}`);
    }
  };

  const handleRestorePlayer = (playerId: number) => {
    const updatedSeating = seating.map(p => {
      if (p.playerId === playerId) {
        return {
          ...p,
          isEliminated: false,
          finishPlace: undefined,
          pointsEarned: undefined,
        };
      }
      return p;
    });

    setSeating(updatedSeating);
    updateTournament(tournament.id, {
      seating: updatedSeating,
    });
    alert('Игрок восстановлен');
  };

  const handleAddBonusPoints = () => {
    if (!bonusPointsDialog) return;
    
    const points = parseInt(bonusPointsAmount);
    if (isNaN(points) || points <= 0) {
      alert('Введите корректное количество очков');
      return;
    }

    const updatedSeating = seating.map(p => {
      if (p.playerId === bonusPointsDialog.playerId) {
        return {
          ...p,
          bonusPoints: (p.bonusPoints || 0) + points,
        };
      }
      return p;
    });

    setSeating(updatedSeating);
    updateTournament(tournament.id, {
      seating: updatedSeating,
    });
    alert(`Начислено +${points} бонусных очков игроку ${bonusPointsDialog.playerName}`);
    setBonusPointsDialog(null);
    setBonusPointsAmount('');
  };

  // Group players by table
  const tableGroups = seating.reduce((acc, player) => {
    if (!acc[player.table]) {
      acc[player.table] = [];
    }
    acc[player.table].push(player);
    return acc;
  }, {} as Record<number, PlayerSeating[]>);

  Object.keys(tableGroups).forEach(tableNum => {
    tableGroups[Number(tableNum)].sort((a, b) => a.seat - b.seat);
  });

  const activePlayers = seating
    .filter(p => !p.isEliminated)
    .sort((a, b) => {
      if (a.table !== b.table) {
        return a.table - b.table;
      }
      return a.seat - b.seat;
    });
  const eliminatedPlayers = seating.filter(p => p.isEliminated).sort((a, b) => (a.finishPlace || 0) - (b.finishPlace || 0));

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
                Игроков: {tournament.currentPlayers}/{tournament.maxPlayers}
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

        {/* Start Tournament Button */}
        {tournamentStatus === 'upcoming' && tournament.currentPlayers > 0 && (
          <div className="mb-6">
            <Button
              onClick={handleStartTournament}
              className="w-full bg-gradient-to-br from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 border-0 py-6"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Начать турнир
            </Button>
          </div>
        )}

        {tournamentStatus === 'upcoming' && tournament.currentPlayers === 0 && (
          <div className="bg-gray-800/30 rounded-2xl p-6 mb-6 text-center">
            <p className="text-gray-400">Нет зарегистрированных игроков</p>
          </div>
        )}

        {/* Tournament Control Buttons */}
        {tournamentStatus === 'started' && (
          <div className="mb-4 space-y-3">
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
              const activeTablePlayers = players.filter(p => !p.isEliminated);
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
                          const player = players.find(p => p.seat === seatNum && !p.isEliminated);
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
                                <div className="text-xs truncate w-full px-1">{player.playerName}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Bottom row - 5 seats */}
                      <div className="grid grid-cols-5 gap-3">
                        {[6, 7, 8, 9, 10].map(seatNum => {
                          const player = players.find(p => p.seat === seatNum && !p.isEliminated);
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
                                <div className="text-xs truncate w-full px-1">{player.playerName}</div>
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
                        key={player.playerId}
                        className="bg-[#1a1a1a] rounded-xl p-3 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm mb-0.5 truncate">{player.playerName}</div>
                          <div className="text-xs text-gray-400">Стол {player.table}, Место {player.seat}</div>
                          {player.bonusPoints && player.bonusPoints > 0 && (
                            <div className="text-xs text-yellow-400 mt-0.5">Бонус: +{player.bonusPoints}</div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            onClick={() => setBonusPointsDialog({ playerId: player.playerId, playerName: player.playerName })}
                            variant="outline"
                            className="bg-yellow-700/20 border-yellow-700/50 hover:bg-yellow-700/30 text-yellow-400 hover:text-yellow-300 text-xs px-3"
                          >
                            <PlusCircleIcon className="w-3.5 h-3.5 mr-1" />
                            Доп.очки
                          </Button>
                          <Button
                            onClick={() => handleEliminatePlayer(player.playerId)}
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
                const totalPoints = (player.pointsEarned || 0) + (player.bonusPoints || 0);
                return (
                  <div
                    key={player.playerId}
                    className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-3 border border-gray-700/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-sm">#{player.finishPlace}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm truncate">{player.playerName}</div>
                          <div className="text-xs text-gray-400">
                            Стол {player.table}, Место {player.seat}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm text-yellow-400">
                          {player.bonusPoints && player.bonusPoints > 0 ? (
                            <div>
                              <div>+{totalPoints} очков</div>
                              <div className="text-xs text-gray-400">
                                ({player.pointsEarned} + {player.bonusPoints} бонус)
                              </div>
                            </div>
                          ) : (
                            <div>+{player.pointsEarned} очков</div>
                          )}
                        </div>
                        {tournamentStatus === 'started' && (
                          <button
                            onClick={() => handleRestorePlayer(player.playerId)}
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
        {tournamentStatus === 'upcoming' && !tournament.registeredPlayers?.length && (
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
    </motion.div>
  );
}

