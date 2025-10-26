import { useEffect, useState } from 'react';
import { useUser } from '../hooks/useUser';
import { useGames, useGameRegistration } from '../hooks/useGames';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Clock, Users, Star, TrendingUp, Trophy, MoreVertical, X, ChevronRight } from 'lucide-react';
import { formatDate, formatTime, getInitials } from '../lib/utils';
import { Game } from '../lib/api';
import { vibrate } from '../lib/telegram';

export function HomeTab() {
  const { user } = useUser();
  const { games, loading } = useGames({ status: 'upcoming' });
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const { isRegistered, toggleRegistration } = useGameRegistration(selectedGame?.id || 0);

  useEffect(() => {
    if (games.length === 0) return;
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextGameDate = new Date(`${games[0].date}T${games[0].time}`);
      const diff = nextGameDate.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft({ hours, minutes });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [games]);

  const handleGameClick = (game: Game) => {
    vibrate('light');
    setSelectedGame(game);
    setIsDialogOpen(true);
  };

  const handleToggleRegistration = async () => {
    try {
      vibrate('medium');
      await toggleRegistration();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error toggling registration:', error);
      alert('Ошибка при регистрации. Попробуйте еще раз.');
    }
  };

  const firstGame = games[0];
  const secondGame = games[1];

  return (
    <div className="min-h-screen bg-black pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {user?.photo_url ? (
              <img 
                src={user.photo_url}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-red-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border-2 border-red-700">
                <span className="text-lg">{getInitials(user?.first_name || 'U', user?.last_name)}</span>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-400">Привет,</div>
              <div className="text-lg">{user?.first_name || 'Игрок'}</div>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>
        <h2 className="text-2xl mb-1">Готовы к игре?</h2>
        {!loading && games.length > 0 && (
          <p className="text-sm text-gray-400">До следующей игры {timeLeft.hours}ч {timeLeft.minutes}м</p>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4 space-y-3">
        {/* Tournament Cards */}
        {!loading && games.length >= 2 && (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleGameClick(firstGame)}
              className="bg-gradient-to-br from-red-700 to-red-900 rounded-3xl p-4 relative overflow-hidden text-left"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-1 mb-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-white/90 border-2 border-red-800 -ml-2 first:ml-0"></div>
                  ))}
                </div>
                <div className="mt-8">
                  <div className="text-sm text-white/80 mb-1">{firstGame.name.split(' ').slice(0, 2).join(' ')}</div>
                  <div className="text-xl">{formatTime(firstGame.time)}</div>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </button>

            <button 
              onClick={() => handleGameClick(secondGame)}
              className="bg-[#2d2d2d] rounded-3xl p-4 relative overflow-hidden text-left"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-1 mb-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-gray-500 border-2 border-gray-700 -ml-2 first:ml-0"></div>
                  ))}
                </div>
                <div className="mt-8">
                  <div className="text-sm text-gray-400 mb-1">{secondGame.name.split(' ')[0]}</div>
                  <div className="text-xl">{formatTime(secondGame.time)}</div>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-3xl p-5 relative overflow-hidden border border-red-900/30">
          <div className="relative z-10">
            <div className="text-sm text-gray-400 mb-3">Ваша активность</div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl mb-1">{user?.games_played || 0}</div>
                <div className="text-xs text-gray-400">Игр сыграно</div>
              </div>
              <div className="flex gap-1 items-end h-16">
                {[40, 60, 45, 70, 55, 80, 65].map((height, i) => (
                  <div 
                    key={i} 
                    className="w-2 bg-red-600 rounded-full"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-400">Побед: </span>
                <span>{user?.games_won || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Призы: </span>
                <span>{user?.total_winnings || 0}₽</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 aspect-square flex flex-col items-center justify-center">
            <div className="w-10 h-10 bg-red-700/20 rounded-full flex items-center justify-center mb-2">
              <Star className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-xs text-center text-gray-300">Рейтинг</div>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-2xl p-4 aspect-square flex flex-col items-center justify-center">
            <div className="w-10 h-10 bg-red-700/20 rounded-full flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-xs text-center text-gray-300">Игроки</div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-4 aspect-square flex flex-col items-center justify-center">
            <div className="w-10 h-10 bg-red-700/20 rounded-full flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-xs text-center text-gray-300">История</div>
          </div>
        </div>

        {/* Club Info */}
        <div className="bg-[#1a1a1a] rounded-3xl p-5 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg mb-2">О клубе</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Премиальный покер-клуб для настоящих ценителей игры
            </p>
            <button className="mt-3 text-sm text-red-600 flex items-center gap-1">
              Подробнее
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Game Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">{selectedGame?.name}</DialogTitle>
          </DialogHeader>
          {selectedGame && (
            <div className="mt-4 space-y-6">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{formatDate(selectedGame.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{formatTime(selectedGame.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{selectedGame.registered_count} / {selectedGame.max_players}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-2xl p-4 border border-red-900/30">
                <h4 className="mb-2 text-gray-200">Формат игры</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{selectedGame.description}</p>
              </div>

              <button
                className={`w-full transition-all rounded-xl py-3.5 shadow-lg flex items-center justify-center gap-2 ${
                  isRegistered
                    ? 'bg-gray-600 hover:bg-gray-700 shadow-gray-500/20'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/20'
                }`}
                onClick={handleToggleRegistration}
              >
                {isRegistered && <X className="w-5 h-5" />}
                {isRegistered ? 'Отменить запись' : 'Зарегистрироваться'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

