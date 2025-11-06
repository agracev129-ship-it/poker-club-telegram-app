import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { gamesAPI, Game, usersAPI } from '../lib/api';
import { getInitials } from '../lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

// Icons
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DollarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

interface AdminCheckInViewProps {
  game: Game;
  onClose: () => void;
}

export function AdminCheckInView({ game, onClose }: AdminCheckInViewProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'registered' | 'paid' | 'no_show'>('all');
  const [stats, setStats] = useState<any>(null);
  
  // Dialogs
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isOnsiteDialogOpen, setIsOnsiteDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  
  // Payment form
  const [paymentAmount, setPaymentAmount] = useState(game.buy_in?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  // Onsite registration form
  const [onsiteSearchQuery, setOnsiteSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [onsiteAmount, setOnsiteAmount] = useState(game.buy_in?.toString() || '');
  const [onsiteMethod, setOnsiteMethod] = useState<'cash' | 'card' | 'transfer'>('cash');

  useEffect(() => {
    loadData();
  }, [game.id]);

  useEffect(() => {
    filterPlayers();
  }, [players, searchQuery, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем всех игроков всех статусов для админ-панели
      const [registered, paid, noShow] = await Promise.all([
        gamesAPI.getPlayersByStatus(game.id, 'registered').catch(() => []),
        gamesAPI.getPlayersByStatus(game.id, 'paid').catch(() => []),
        gamesAPI.getPlayersByStatus(game.id, 'no_show').catch(() => []),
      ]);
      
      // Объединяем всех игроков
      const allPlayers = [...registered, ...paid, ...noShow];
      
      console.log('Loaded players:', {
        registered: registered.length,
        paid: paid.length,
        noShow: noShow.length,
        total: allPlayers.length
      });
      
      setPlayers(allPlayers);
      
      // Загружаем статистику
      const gameStats = await gamesAPI.getTournamentStats(game.id);
      setStats(gameStats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const filterPlayers = () => {
    let filtered = [...players];
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.first_name?.toLowerCase().includes(query)) ||
        (p.last_name?.toLowerCase().includes(query)) ||
        (p.username?.toLowerCase().includes(query))
      );
    }
    
    setFilteredPlayers(filtered);
  };

  const handleConfirmPayment = async (player: any) => {
    setSelectedPlayer(player);
    // Устанавливаем сумму из buy_in, если она есть, иначе пустая строка
    const buyInAmount = game.buy_in && game.buy_in > 0 ? game.buy_in.toString() : '';
    setPaymentAmount(buyInAmount);
    setPaymentMethod('cash');
    setPaymentNotes('');
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    // Проверяем выбранного игрока
    if (!selectedPlayer) {
      toast.error('Игрок не выбран');
      return;
    }
    
    // Получаем user_id (может быть user_id или id)
    const userId = selectedPlayer.user_id || selectedPlayer.id;
    if (!userId) {
      console.error('Selected player data:', selectedPlayer);
      toast.error('Не удалось определить ID игрока');
      return;
    }
    
    // Проверяем сумму
    const amountStr = paymentAmount?.trim() || '';
    if (!amountStr) {
      toast.error('Укажите сумму оплаты');
      return;
    }
    
    // Преобразуем сумму, учитывая возможные запятые/точки
    const amountValue = parseFloat(amountStr.replace(',', '.'));
    
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Сумма должна быть больше 0');
      return;
    }
    
    // Проверяем способ оплаты
    if (!paymentMethod) {
      toast.error('Выберите способ оплаты');
      return;
    }
    
    try {
      console.log('Confirming payment:', {
        gameId: game.id,
        userId: userId,
        amount: amountValue,
        paymentMethod,
        notes: paymentNotes,
        playerData: selectedPlayer
      });
      
      // Показываем индикатор загрузки
      const loadingToast = toast.loading('Подтверждение оплаты...');
      
      const result = await gamesAPI.confirmPayment(
        game.id,
        userId,
        amountValue,
        paymentMethod,
        paymentNotes || undefined
      );
      
      console.log('Payment confirmed successfully:', result);
      
      // Закрываем индикатор загрузки
      toast.dismiss(loadingToast);
      
      // Закрываем диалог и очищаем форму
      setIsPaymentDialogOpen(false);
      setSelectedPlayer(null);
      setPaymentAmount('');
      setPaymentNotes('');
      
      // Показываем успешное сообщение
      toast.success(`Оплата подтверждена для ${selectedPlayer.first_name || 'игрока'}`);
      
      // Обновляем данные
      await loadData();
      
      // Если игрок был в фильтре "Ожидают", автоматически переключаемся на "Оплатили"
      if (filterStatus === 'registered') {
        setFilterStatus('paid');
      }
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      console.error('Error details:', {
        message: error.message,
        error: error.error,
        stack: error.stack,
        response: error.response
      });
      
      // Показываем детальную ошибку
      let errorMessage = 'Ошибка подтверждения оплаты';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleSearchUsers = async () => {
    if (!onsiteSearchQuery || onsiteSearchQuery.length < 2) {
      toast.error('Введите минимум 2 символа');
      return;
    }
    
    try {
      const results = await usersAPI.search(onsiteSearchQuery);
      setSearchResults(results);
    } catch (error: any) {
      toast.error('Ошибка поиска');
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setOnsiteAmount(game.buy_in?.toString() || '');
  };

  const handleOnsiteRegistration = async () => {
    if (!selectedUser || !onsiteAmount || parseFloat(onsiteAmount) <= 0) {
      toast.error('Выберите пользователя и укажите сумму');
      return;
    }
    
    try {
      await gamesAPI.onsiteRegistration(
        game.id,
        selectedUser.id,
        parseFloat(onsiteAmount),
        onsiteMethod
      );
      toast.success(`${selectedUser.first_name} зарегистрирован и оплатил`);
      setIsOnsiteDialogOpen(false);
      setSelectedUser(null);
      setOnsiteSearchQuery('');
      setSearchResults([]);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка регистрации');
    }
  };

  const handleMarkNoShow = async (player: any) => {
    // Проверяем данные игрока
    if (!player) {
      toast.error('Игрок не выбран');
      return;
    }
    
    // Получаем user_id (может быть user_id или id)
    const userId = player.user_id || player.id;
    if (!userId) {
      console.error('Player data:', player);
      toast.error('Не удалось определить ID игрока');
      return;
    }
    
    // Подтверждение действия
    const confirmed = window.confirm(`Исключить ${player.first_name || 'игрока'}?`);
    if (!confirmed) {
      return;
    }
    
    try {
      console.log('Marking no-show:', { 
        gameId: game.id, 
        userId: userId,
        playerName: player.first_name,
        playerData: player
      });
      
      // Показываем индикатор загрузки
      const loadingToast = toast.loading('Исключение игрока...');
      
      const result = await gamesAPI.markNoShow(game.id, userId);
      
      console.log('Marked no-show successfully:', result);
      
      // Закрываем индикатор загрузки
      toast.dismiss(loadingToast);
      
      // Показываем успешное сообщение
      toast.success(`${player.first_name || 'Игрок'} исключен`);
      
      // Обновляем данные
      await loadData();
      
      // Если игрок был в другом фильтре, автоматически переключаемся на "Исключены"
      if (filterStatus !== 'no_show') {
        setFilterStatus('no_show');
      }
    } catch (error: any) {
      console.error('Mark no-show error:', error);
      console.error('Error details:', {
        message: error.message,
        error: error.error,
        stack: error.stack
      });
      
      const errorMessage = error.message || error.error || 'Ошибка при исключении игрока';
      toast.error(errorMessage);
    }
  };

  const handleRestorePlayer = async (player: any) => {
    if (!player) {
      toast.error('Игрок не выбран');
      return;
    }
    
    // Получаем user_id (может быть user_id или id)
    const userId = player.user_id || player.id;
    if (!userId) {
      console.error('Player data:', player);
      toast.error('Не удалось определить ID игрока');
      return;
    }
    
    try {
      console.log('Restoring player:', { 
        gameId: game.id, 
        userId: userId,
        playerData: player
      });
      const result = await gamesAPI.restorePlayer(game.id, userId);
      console.log('Player restored:', result);
      toast.success(`${player.first_name || 'Игрок'} восстановлен`);
      await loadData();
    } catch (error: any) {
      console.error('Restore player error:', error);
      const errorMessage = error.message || error.error || 'Ошибка при восстановлении игрока';
      toast.error(errorMessage);
    }
  };

  const handleExcludeAllNoShow = async () => {
    const unpaidCount = players.filter(p => p.status === 'registered').length;
    if (unpaidCount === 0) {
      toast.error('Нет неоплативших игроков');
      return;
    }
    
    if (!confirm(`Исключить всех неоплативших игроков (${unpaidCount})?`)) {
      return;
    }
    
    try {
      const result = await gamesAPI.excludeNoShow(game.id);
      toast.success(`Исключено игроков: ${result.count}`);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">Ожидает оплаты</span>;
      case 'paid':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">Оплатил</span>;
      case 'playing':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">Играет</span>;
      case 'no_show':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500">Исключен</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-500">{status}</span>;
    }
  };

  return (
    <>
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
              <h2 className="text-xl font-medium">Панель приема игроков</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <XIcon />
              </button>
            </div>
            
            <div className="text-sm text-gray-400 mb-4">
              {game.name} • {new Date(game.date).toLocaleDateString('ru-RU')}
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                  <div className="text-xl font-medium text-yellow-500">{stats.registered_count || 0}</div>
                  <div className="text-xs text-gray-400">Ожидают</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-2 text-center">
                  <div className="text-xl font-medium text-green-500">{stats.paid_count || 0}</div>
                  <div className="text-xs text-gray-400">Оплатили</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2 text-center">
                  <div className="text-xl font-medium text-red-500">{stats.no_show_count || 0}</div>
                  <div className="text-xs text-gray-400">Исключены</div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative mb-3">
              <Input
                placeholder="Поиск по имени..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { value: 'all', label: 'Все' },
                { value: 'registered', label: 'Ожидают' },
                { value: 'paid', label: 'Оплатили' },
                { value: 'no_show', label: 'Исключены' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value as any)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                    filterStatus === filter.value
                      ? 'bg-red-700 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 pb-24">
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setIsOnsiteDialogOpen(true)}
              className="bg-gradient-to-br from-red-700 to-red-900 rounded-xl p-4 flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-800 transition-all"
            >
              <UserPlusIcon />
              <span>Добавить игрока</span>
            </button>
            
            <button
              onClick={handleExcludeAllNoShow}
              className="bg-gray-800 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-gray-700 transition-all"
            >
              <XIcon />
              <span>Исключить неоплативших</span>
            </button>
          </div>

          {/* Players list */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Загрузка...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {searchQuery ? 'Ничего не найдено' : 'Нет игроков'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlayers.map((player) => (
                <div
                  key={player.user_id || player.id || `player-${player.first_name}-${player.last_name}`}
                  className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="shrink-0">
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.first_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                          <span className="text-lg">
                            {getInitials(player.first_name, player.last_name)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {player.first_name} {player.last_name || ''}
                        </span>
                        {getStatusBadge(player.status)}
                      </div>
                      {player.payment_amount && (
                        <div className="text-xs text-green-500 mt-1">
                          Оплачено: {player.payment_amount}₽ ({player.payment_method})
                        </div>
                      )}
                      {player.table_number && player.seat_number && (
                        <div className="text-xs text-blue-400 mt-1">
                          Стол {player.table_number}, Место {player.seat_number}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {player.status === 'registered' && (
                        <>
                          <button
                            onClick={() => handleConfirmPayment(player)}
                            className="bg-green-500 hover:bg-green-600 rounded-lg p-2 transition-colors"
                            title="Подтвердить оплату"
                          >
                            <DollarIcon />
                          </button>
                          <button
                            onClick={() => handleMarkNoShow(player)}
                            className="bg-red-500 hover:bg-red-600 rounded-lg p-2 transition-colors"
                            title="Исключить"
                          >
                            <XIcon />
                          </button>
                        </>
                      )}
                      
                      {player.status === 'paid' && (
                        <div className="bg-green-500/20 rounded-lg p-2 flex items-center justify-center">
                          <CheckIcon />
                        </div>
                      )}
                      
                      {player.status === 'no_show' && (
                        <button
                          onClick={() => handleRestorePlayer(player)}
                          className="bg-gray-600 hover:bg-gray-500 rounded-lg p-2 transition-colors"
                          title="Восстановить"
                        >
                          <RefreshIcon />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Подтвердить оплату</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedPlayer?.first_name} {selectedPlayer?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="amount">Сумма оплаты</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Разрешаем пустую строку или валидное число
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setPaymentAmount(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePaymentSubmit();
                  }
                }}
                placeholder={game.buy_in && game.buy_in > 0 ? game.buy_in.toString() : "5000"}
                className="bg-gray-800 border-gray-700"
                autoFocus
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
            
            <div className="flex gap-2">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handlePaymentSubmit();
                }}
                type="button"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!paymentAmount || parseFloat(paymentAmount?.replace(',', '.') || '0') <= 0}
              >
                Подтвердить
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  setIsPaymentDialogOpen(false);
                  setSelectedPlayer(null);
                  setPaymentAmount('');
                  setPaymentNotes('');
                }}
                type="button"
                variant="outline"
                className="bg-transparent border-gray-700 hover:bg-gray-800"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Onsite Registration Dialog */}
      <Dialog open={isOnsiteDialogOpen} onOpenChange={setIsOnsiteDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Регистрация на месте</DialogTitle>
            <DialogDescription className="text-gray-400">
              Добавить игрока, пришедшего без записи
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Search user */}
            {!selectedUser && (
              <>
                <div>
                  <Label htmlFor="userSearch">Поиск игрока</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="userSearch"
                      value={onsiteSearchQuery}
                      onChange={(e) => setOnsiteSearchQuery(e.target.value)}
                      placeholder="Введите имя..."
                      className="bg-gray-800 border-gray-700"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                    />
                    <Button onClick={handleSearchUsers} className="bg-red-600 hover:bg-red-700">
                      Найти
                    </Button>
                  </div>
                </div>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full bg-gray-800 rounded-lg p-3 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left"
                      >
                        {user.photo_url ? (
                          <img
                            src={user.photo_url}
                            alt={user.first_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                            <span className="text-sm">
                              {getInitials(user.first_name, user.last_name)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-gray-400">ID: {user.id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Selected user payment */}
            {selectedUser && (
              <>
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      {selectedUser.photo_url ? (
                        <img
                          src={selectedUser.photo_url}
                          alt={selectedUser.first_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                          <span className="text-sm">
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
                </div>

                <div>
                  <Label htmlFor="onsiteAmount">Сумма оплаты</Label>
                  <Input
                    id="onsiteAmount"
                    type="number"
                    value={onsiteAmount}
                    onChange={(e) => setOnsiteAmount(e.target.value)}
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
                        onClick={() => setOnsiteMethod(method.value as any)}
                        className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                          onsiteMethod === method.value
                            ? 'bg-red-700 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleOnsiteRegistration}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Зарегистрировать
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
