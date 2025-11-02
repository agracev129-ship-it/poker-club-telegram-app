import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { gamesAPI, Game } from '../lib/api';
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
  const [step, setStep] = useState<'search' | 'seating' | 'payment'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Seating data
  const [seating, setSeating] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  
  // Payment data
  const [paymentAmount, setPaymentAmount] = useState(game.buy_in?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [initialStack, setInitialStack] = useState('10000');

  useEffect(() => {
    loadSeating();
    checkLateRegistrationStatus();
  }, [game.id]);

  const checkLateRegistrationStatus = async () => {
    try {
      const status = await gamesAPI.getLateRegistrationStatus(game.id);
      if (!status.available) {
        toast.error('Поздняя регистрация недоступна для этого турнира');
      }
    } catch (error) {
      console.error('Error checking late registration status:', error);
    }
  };

  const loadSeating = async () => {
    try {
      const seatingData = await gamesAPI.getSeating(game.id);
      setSeating(seatingData);
    } catch (error) {
      console.error('Error loading seating:', error);
    }
  };

  const handleSearchUser = async () => {
    if (!searchQuery) {
      toast.error('Введите ID пользователя');
      return;
    }
    
    setLoading(true);
    try {
      // Ищем пользователя через API (нужно добавить этот endpoint или использовать существующий)
      // Пока используем временное решение
      setFoundUser({
        id: parseInt(searchQuery),
        first_name: 'Пользователь',
        last_name: searchQuery,
        photo_url: null,
      });
      setStep('seating');
      toast.success('Пользователь найден');
    } catch (error: any) {
      toast.error(error.message || 'Пользователь не найден');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSeat = (tableNumber: number, seatNumber: number) => {
    setSelectedTable(tableNumber);
    setSelectedSeat(seatNumber);
  };

  const handleContinueToPayment = () => {
    if (!selectedTable || !selectedSeat) {
      toast.error('Выберите место за столом');
      return;
    }
    setStep('payment');
  };

  const handleConfirmRegistration = async () => {
    if (!foundUser || !selectedTable || !selectedSeat || !paymentAmount) {
      toast.error('Заполните все поля');
      return;
    }
    
    try {
      await gamesAPI.lateRegistration(
        game.id,
        foundUser.id,
        parseFloat(paymentAmount),
        paymentMethod,
        selectedTable,
        selectedSeat,
        parseInt(initialStack),
        paymentNotes
      );
      
      toast.success(`${foundUser.first_name} успешно добавлен в турнир!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при регистрации');
    }
  };

  const getOccupiedSeats = (tableNumber: number) => {
    return seating
      .filter(s => s.table_number === tableNumber)
      .map(s => s.seat_number);
  };

  const getTablesCount = () => {
    const tables = new Set(seating.map(s => s.table_number));
    return Math.max(...Array.from(tables), 0);
  };

  const renderSearchStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="search">ID пользователя Telegram</Label>
        <div className="relative mt-2">
          <Input
            id="search"
            type="number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="123456789"
            className="bg-gray-800 border-gray-700 pl-10"
            onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Введите Telegram ID игрока, который хочет присоединиться к турниру
        </p>
      </div>

      <Button
        onClick={handleSearchUser}
        disabled={loading || !searchQuery}
        className="w-full bg-red-600 hover:bg-red-700"
      >
        {loading ? 'Поиск...' : 'Найти игрока'}
      </Button>
    </div>
  );

  const renderSeatingStep = () => (
    <div className="space-y-6">
      {/* User info */}
      {foundUser && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            {foundUser.photo_url ? (
              <img
                src={foundUser.photo_url}
                alt={foundUser.first_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                <span className="text-lg">
                  {getInitials(foundUser.first_name, foundUser.last_name)}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium">
                {foundUser.first_name} {foundUser.last_name}
              </div>
              <div className="text-xs text-gray-400">ID: {foundUser.id}</div>
            </div>
          </div>
        </div>
      )}

      {/* Seating selection */}
      <div>
        <Label>Выберите место за столом</Label>
        <p className="text-xs text-gray-500 mb-3">
          Зеленым отмечены свободные места
        </p>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Array.from({ length: getTablesCount() }, (_, i) => i + 1).map((tableNum) => {
            const occupiedSeats = getOccupiedSeats(tableNum);
            const totalSeats = 9; // По умолчанию 9 мест за столом
            
            return (
              <div key={tableNum} className="bg-gray-800/30 rounded-lg p-3">
                <div className="text-sm font-medium mb-2">Стол {tableNum}</div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: totalSeats }, (_, i) => i + 1).map((seatNum) => {
                    const isOccupied = occupiedSeats.includes(seatNum);
                    const isSelected = selectedTable === tableNum && selectedSeat === seatNum;
                    
                    return (
                      <button
                        key={seatNum}
                        disabled={isOccupied}
                        onClick={() => handleSelectSeat(tableNum, seatNum)}
                        className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : isOccupied
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600/20 text-green-500 hover:bg-green-600/30'
                        }`}
                      >
                        {seatNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => setStep('search')}
          variant="outline"
          className="flex-1 bg-transparent border-gray-700 hover:bg-gray-800"
        >
          Назад
        </Button>
        <Button
          onClick={handleContinueToPayment}
          disabled={!selectedTable || !selectedSeat}
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          Продолжить
        </Button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      {/* Summary */}
      {foundUser && selectedTable && selectedSeat && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
            {foundUser.photo_url ? (
              <img
                src={foundUser.photo_url}
                alt={foundUser.first_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                <span className="text-lg">
                  {getInitials(foundUser.first_name, foundUser.last_name)}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium">
                {foundUser.first_name} {foundUser.last_name}
              </div>
              <div className="text-xs text-gray-400">ID: {foundUser.id}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400">Стол</div>
              <div className="font-medium">{selectedTable}</div>
            </div>
            <div>
              <div className="text-gray-400">Место</div>
              <div className="font-medium">{selectedSeat}</div>
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
          <Label htmlFor="stack">Начальный стек</Label>
          <Input
            id="stack"
            type="number"
            value={initialStack}
            onChange={(e) => setInitialStack(e.target.value)}
            placeholder="10000"
            className="bg-gray-800 border-gray-700"
          />
          <p className="text-xs text-gray-500 mt-1">
            Обычно меньше стандартного из-за опоздания
          </p>
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

      <div className="flex gap-2">
        <Button
          onClick={() => setStep('seating')}
          variant="outline"
          className="flex-1 bg-transparent border-gray-700 hover:bg-gray-800"
        >
          Назад
        </Button>
        <Button
          onClick={handleConfirmRegistration}
          disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Подтвердить регистрацию
        </Button>
      </div>
    </div>
  );

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
            <div>
              <h2 className="text-xl font-medium">Поздняя регистрация</h2>
              <p className="text-sm text-gray-400 mt-1">{game.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <XIcon />
            </button>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2">
            {['Поиск', 'Место', 'Оплата'].map((label, index) => {
              const stepIndex = ['search', 'seating', 'payment'].indexOf(step);
              const isActive = index === stepIndex;
              const isCompleted = index < stepIndex;
              
              return (
                <div key={label} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="ml-2 text-sm">
                    <div className={isActive ? 'text-white' : 'text-gray-400'}>
                      {label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        {step === 'search' && renderSearchStep()}
        {step === 'seating' && renderSeatingStep()}
        {step === 'payment' && renderPaymentStep()}
      </div>
    </motion.div>
  );
}

