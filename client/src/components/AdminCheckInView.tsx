import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { gamesAPI, Game } from '../lib/api';
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

// Иконки
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'registered' | 'checked_in' | 'paid' | 'no_show'>('all');
  const [stats, setStats] = useState<any>(null);
  
  // Диалоги
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isOnsiteDialogOpen, setIsOnsiteDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  
  // Форма оплаты
  const [paymentAmount, setPaymentAmount] = useState(game.buy_in?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  // Форма регистрации на месте
  const [onsiteUserId, setOnsiteUserId] = useState('');
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
      
      // Загружаем всех игроков
      const allPlayers = await gamesAPI.getRegisteredUsers(game.id);
      setPlayers(allPlayers);
      
      // Загружаем статистику
      const gameStats = await gamesAPI.getTournamentStats(game.id);
      setStats(gameStats);
    } catch (error) {
      console.error('Error loading check-in data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const filterPlayers = () => {
    let filtered = [...players];
    
    // Фильтр по статусу
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.first_name?.toLowerCase().includes(query)) ||
        (p.last_name?.toLowerCase().includes(query)) ||
        (p.user_name?.toLowerCase().includes(query)) ||
        (p.telegram_id?.toString().includes(query))
      );
    }
    
    setFilteredPlayers(filtered);
  };

  const handleCheckIn = async (player: any) => {
    try {
      await gamesAPI.checkInPlayer(game.id, player.user_id);
      toast.success(`${player.first_name} отмечен как явившийся`);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при отметке явки');
    }
  };

  const handleMarkNoShow = async (player: any) => {
    if (!confirm(`Отметить ${player.first_name} как не явившегося?`)) {
      return;
    }
    
    try {
      await gamesAPI.markNoShow(game.id, player.user_id);
      toast.success(`${player.first_name} отмечен как не явившийся`);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка');
    }
  };

  const handleRestorePlayer = async (player: any) => {
    try {
      await gamesAPI.restorePlayer(game.id, player.user_id);
      toast.success(`${player.first_name} восстановлен`);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка');
    }
  };

  const openPaymentDialog = (player: any) => {
    setSelectedPlayer(player);
    setPaymentAmount(game.buy_in?.toString() || '');
    setPaymentMethod('cash');
    setPaymentNotes('');
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlayer || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Укажите корректную сумму');
      return;
    }
    
    try {
      await gamesAPI.confirmPayment(
        game.id,
        selectedPlayer.user_id,
        parseFloat(paymentAmount),
        paymentMethod,
        paymentNotes
      );
      toast.success(`Оплата подтверждена для ${selectedPlayer.first_name}`);
      setIsPaymentDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка подтверждения оплаты');
    }
  };

  const handleOnsiteRegistration = async () => {
    if (!onsiteUserId || !onsiteAmount || parseFloat(onsiteAmount) <= 0) {
      toast.error('Заполните все поля');
      return;
    }
    
    try {
      await gamesAPI.onsiteRegistration(
        game.id,
        parseInt(onsiteUserId),
        parseFloat(onsiteAmount),
        onsiteMethod
      );
      toast.success('Игрок зарегистрирован на месте');
      setIsOnsiteDialogOpen(false);
      setOnsiteUserId('');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка регистрации');
    }
  };

  const handleExcludeAllNoShow = async () => {
    if (!confirm('Исключить всех неявившихся игроков?')) {
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
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">Ожидает</span>;
      case 'checked_in':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">Явился</span>;
      case 'paid':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">Оплатил</span>;
      case 'no_show':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500">Не явился</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-500">{status}</span>;
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="fixed inset-0 bg-black z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-medium">Прием игроков</h2>
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
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                <div className="text-xl font-medium">{stats.registered_count || 0}</div>
                <div className="text-xs text-gray-400">Всего</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                <div className="text-xl font-medium text-blue-500">{stats.checked_in_count || 0}</div>
                <div className="text-xs text-gray-400">Явились</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-2 text-center">
                <div className="text-xl font-medium text-green-500">{stats.paid_count || 0}</div>
                <div className="text-xs text-gray-400">Оплатили</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2 text-center">
                <div className="text-xl font-medium text-red-500">{stats.no_show_count || 0}</div>
                <div className="text-xs text-gray-400">Не явились</div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <SearchIcon />
            <Input
              placeholder="Поиск по имени или ID..."
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
              { value: 'checked_in', label: 'Явились' },
              { value: 'paid', label: 'Оплатили' },
              { value: 'no_show', label: 'Не явились' },
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
            <span>Исключить неявившихся</span>
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
                key={player.user_id}
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
                    <div className="text-xs text-gray-400">
                      ID: {player.telegram_id}
                    </div>
                    {player.payment_amount && (
                      <div className="text-xs text-green-500 mt-1">
                        Оплачено: {player.payment_amount}₽ ({player.payment_method})
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {player.status === 'registered' && (
                      <>
                        <button
                          onClick={() => handleCheckIn(player)}
                          className="bg-blue-500 hover:bg-blue-600 rounded-lg p-2 transition-colors"
                          title="Отметить явку"
                        >
                          <CheckIcon />
                        </button>
                        <button
                          onClick={() => handleMarkNoShow(player)}
                          className="bg-red-500 hover:bg-red-600 rounded-lg p-2 transition-colors"
                          title="Не явился"
                        >
                          <XIcon />
                        </button>
                      </>
                    )}
                    
                    {player.status === 'checked_in' && (
                      <button
                        onClick={() => openPaymentDialog(player)}
                        className="bg-green-500 hover:bg-green-600 rounded-lg p-2 transition-colors"
                        title="Подтвердить оплату"
                      >
                        <DollarIcon />
                      </button>
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
            
            <div className="flex gap-2">
              <Button
                onClick={handleConfirmPayment}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Подтвердить
              </Button>
              <Button
                onClick={() => setIsPaymentDialogOpen(false)}
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
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Регистрация на месте</DialogTitle>
            <DialogDescription className="text-gray-400">
              Добавить игрока, пришедшего без предварительной записи
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="userId">ID пользователя</Label>
              <Input
                id="userId"
                type="number"
                value={onsiteUserId}
                onChange={(e) => setOnsiteUserId(e.target.value)}
                placeholder="123456789"
                className="bg-gray-800 border-gray-700"
              />
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
              <Button
                onClick={() => setIsOnsiteDialogOpen(false)}
                variant="outline"
                className="bg-transparent border-gray-700 hover:bg-gray-800"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

