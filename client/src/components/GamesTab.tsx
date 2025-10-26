import { useState } from 'react';
import { useGames, useGameRegistration } from '../hooks/useGames';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useGameRegistration as useLocalGameRegistration } from './GameRegistrationContext';
import { formatDate, formatTime } from '../lib/utils';
import { Game } from '../lib/api';
import { vibrate } from '../lib/telegram';

// Icon components as inline SVGs
const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
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

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export function GamesTab() {
  const { games, loading } = useGames({ status: 'upcoming' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const { isRegistered: isAPIRegistered, toggleRegistration } = useGameRegistration(selectedGame?.id || 0);
  const { isRegistered: checkIsRegistered } = useLocalGameRegistration();

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

  const isRegistered = selectedGame ? (isAPIRegistered || checkIsRegistered(selectedGame.id)) : false;

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Compact Header */}
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-2xl mb-1">Игры</h2>
        <p className="text-sm text-gray-400">Расписание предстоящих игр</p>
      </div>

      {/* Games List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Загрузка...</div>
        ) : games.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Нет предстоящих игр</div>
        ) : (
          games.map((game) => {
            const isGameRegistered = checkIsRegistered(game.id);
            
            return (
              <div
                key={game.id}
                className={`rounded-2xl p-4 border transition-all relative ${
                  isGameRegistered
                    ? 'bg-gradient-to-br from-red-700/30 to-red-900/30 border-red-700/50'
                    : 'bg-[#1a1a1a] border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base mb-1">{game.name}</h3>
                    <div className={`flex items-center gap-3 text-xs ${
                      isGameRegistered ? 'text-gray-300' : 'text-gray-400'
                    }`}>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5" />
                        <span>{game.registered_count} / {game.max_players}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>{formatTime(game.time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{formatDate(game.date)}</span>
                      </div>
                    </div>
                  </div>
                  <button className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isGameRegistered ? 'bg-red-700/20' : 'bg-white/5'
                  }`}>
                    <ChevronDownIcon className="w-4 h-4 rotate-[-90deg]" />
                  </button>
                </div>
                <button
                  className={`w-full transition-all rounded-xl py-2.5 text-sm text-center tracking-wide flex items-center justify-center gap-2 ${
                    isGameRegistered
                      ? 'bg-white hover:bg-gray-200 text-black'
                      : 'bg-gradient-to-b from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white'
                  }`}
                  onClick={() => handleJoinClick(game)}
                >
                  {isGameRegistered && <CheckIcon className="w-4 h-4" />}
                  {isGameRegistered ? 'Вы зарегистрированы' : 'Присоединиться'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">
              {selectedGame?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedGame && (
            <div className="mt-4 space-y-6">
              {/* Game Info */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{formatDate(selectedGame.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{formatTime(selectedGame.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{selectedGame.registered_count} / {selectedGame.max_players}</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-2xl p-4 border border-red-900/30">
                <h4 className="mb-2 text-gray-200">Формат игры</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {selectedGame.description}
                </p>
              </div>

              {/* Register Button */}
              <button
                className={`w-full transition-all rounded-xl py-3.5 shadow-lg flex items-center justify-center gap-2 ${
                  isRegistered
                    ? 'bg-gray-600 hover:bg-gray-700 shadow-gray-500/20'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/20'
                }`}
                onClick={handleToggleRegistration}
              >
                {isRegistered && <XIcon className="w-5 h-5" />}
                {isRegistered ? 'Отменить запись' : 'Зарегистрироваться'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
