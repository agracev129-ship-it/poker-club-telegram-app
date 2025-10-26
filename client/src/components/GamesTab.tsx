import { useState } from 'react';
import { useGames, useGameRegistration } from '../hooks/useGames';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Clock, Users, ChevronRight, X } from 'lucide-react';
import { formatDate, formatTime } from '../lib/utils';
import { Game } from '../lib/api';
import { vibrate } from '../lib/telegram';
import { useUser } from '../hooks/useUser';

export function GamesTab() {
  const { user } = useUser();
  const { games, loading } = useGames({ status: 'upcoming' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const { isRegistered, toggleRegistration } = useGameRegistration(selectedGame?.id || 0);

  const handleJoinClick = (game: Game) => {
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
      console.error('Error:', error);
      alert('Ошибка при регистрации');
    }
  };

  return (
    <div className="min-h-screen bg-black pb-8">
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-2xl mb-1">Игры</h2>
        <p className="text-sm text-gray-400">Расписание предстоящих игр</p>
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Загрузка...</div>
        ) : games.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Нет предстоящих игр</div>
        ) : (
          games.map((game) => (
            <div
              key={game.id}
              className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-all relative"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base mb-1">{game.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{game.registered_count} / {game.max_players}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(game.time)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(game.date)}</span>
                    </div>
                  </div>
                </div>
                <button className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                className="w-full bg-gradient-to-b from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 transition-all rounded-xl py-2.5 text-sm text-center tracking-wide"
                onClick={() => handleJoinClick(game)}
              >
                Присоединиться
              </button>
            </div>
          ))
        )}
      </div>

      <div className="px-4 mt-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-sm text-gray-400 mb-3">Статистика игр</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-1">{user?.games_played || 0}</div>
                <div className="text-xs text-gray-400">Сыграно</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">{games.length}</div>
                <div className="text-xs text-gray-400">Предстоит</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">{user?.games_won || 0}</div>
                <div className="text-xs text-gray-400">Побед</div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

