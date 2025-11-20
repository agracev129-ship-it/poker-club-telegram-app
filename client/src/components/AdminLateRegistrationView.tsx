import { useState } from 'react';
import { motion } from 'motion/react';
import { gamesAPI, Game, usersAPI } from '../lib/api';
import { getInitials } from '../lib/utils';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

// Icons
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

interface AdminLateRegistrationViewProps {
  game: Game;
  onClose: () => void;
}

export function AdminLateRegistrationView({ game, onClose }: AdminLateRegistrationViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Payment data
  const [paymentAmount, setPaymentAmount] = useState(game.buy_in?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isFirstGame, setIsFirstGame] = useState(false);

  const handleSearchUsers = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      toast.error('Введите минимум 2 символа');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Searching users with query:', trimmedQuery);
      const results = await usersAPI.search(trimmedQuery);
      console.log('Search results:', results);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('Пользователи не найдены');
      } else {
        toast.success(`Найдено пользователей: ${results.length}`);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Ошибка поиска');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: any) => {
    setSelectedUser(user);
    setPaymentAmount(game.buy_in?.toString() || '');
    
    // Проверяем, является ли это первой игрой для игрока
    try {
      if (user.id) {
        const userStats = await usersAPI.getStats(user.id);
        const gamesPlayed = userStats?.games_played || 0;
        setIsFirstGame(gamesPlayed === 0);
        console.log('Player stats (late registration):', { userId: user.id, gamesPlayed, isFirstGame: gamesPlayed === 0 });
      } else {
        setIsFirstGame(false);
      }
    } catch (error) {
      console.error('Error checking player stats (late registration):', error);
      setIsFirstGame(false);
    }
  };

  const handleConfirmRegistration = async () => {
    if (!selectedUser || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Заполните все поля');
      return;
    }
    
    try {
      setLoading(true);
      await gamesAPI.lateRegistration(
        game.id,
        selectedUser.id,
        parseFloat(paymentAmount),
        paymentMethod,
        0, // tableNumber - будет назначено автоматически
        0, // seatNumber - будет назначено автоматически
        undefined, // initialStack
        paymentNotes
      );
      
      toast.success(`${selectedUser.first_name} успешно добавлен в турнир!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="fixed inset-0 bg-black z-50 overflow-y-auto pt-16"
    >
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-medium">Поздняя регистрация</h2>
              <p className="text-sm text-gray-400 mt-1">
                {game.name} • {new Date(game.date).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <XIcon />
            </button>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-sm text-blue-400">
              💡 Место за столом будет назначено автоматически
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        {!selectedUser ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Поиск игрока</Label>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Введите имя или username..."
                    className="bg-gray-800 border-gray-700 pl-10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading) {
                        handleSearchUsers();
                      }
                    }}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <SearchIcon />
                  </div>
                </div>
                <Button
                  onClick={handleSearchUsers}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Поиск...' : 'Найти'}
                </Button>
              </div>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Результаты поиска</Label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full bg-gray-800 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left border border-gray-700 hover:border-red-700"
                    >
                      {user.photo_url ? (
                        <img
                          src={user.photo_url}
                          alt={user.first_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                          <span className="text-lg">
                            {getInitials(user.first_name, user.last_name)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-gray-400">@{user.username || `id${user.id}`}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected user */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 justify-between mb-4 pb-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  {selectedUser.photo_url ? (
                    <img
                      src={selectedUser.photo_url}
                      alt={selectedUser.first_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                      <span className="text-lg">
                        {getInitials(selectedUser.first_name, selectedUser.last_name)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </div>
                    <div className="text-xs text-gray-400">ID: {selectedUser.id}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <XIcon />
                </button>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-green-400">
                  ✓ Место будет назначено автоматически
                </p>
              </div>
            </div>

            {/* Индикатор первой игры */}
            {isFirstGame && (
              <div className="p-4 bg-gradient-to-br from-yellow-900/30 to-yellow-950/20 rounded-xl border border-yellow-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-yellow-400 mb-1">Первая игра!</div>
                    <div className="text-xs text-gray-400">
                      Это первая игра для этого игрока. Не забудьте выдать бонус за первую игру.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Сумма оплаты</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="5000"
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div>
                <Label>Способ оплаты</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { value: 'cash', label: 'Наличные' },
                    { value: 'card', label: 'Карта' },
                    { value: 'transfer', label: 'Перевод' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value as any)}
                      className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                        paymentMethod === method.value
                          ? 'bg-red-700 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Заметки (опционально)</Label>
                <Input
                  id="notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Комментарий..."
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <Button
              onClick={handleConfirmRegistration}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Добавление...' : 'Подтвердить регистрацию'}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
