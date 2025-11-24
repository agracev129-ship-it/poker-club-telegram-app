import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { gamesAPI, ratingSeasonsAPI, RatingSeason } from '../lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14"/>
    <path d="M12 5v14"/>
  </svg>
);

const MinusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14"/>
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

interface PointDistribution {
  place: number;
  points: number;
}

interface CreateTournamentViewProps {
  onClose: () => void;
  onSave: (tournament: any) => void;
}

export function CreateTournamentView({ onClose, onSave }: CreateTournamentViewProps) {
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(9);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Покер Клуб "Ривер", ул. Тверская, 15');
  const [autoBalance, setAutoBalance] = useState(true);
  const [useDefaultDistribution, setUseDefaultDistribution] = useState(true);
  const [seasons, setSeasons] = useState<RatingSeason[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [pointDistribution, setPointDistribution] = useState<PointDistribution[]>([
    { place: 1, points: 100 },
    { place: 2, points: 75 },
    { place: 3, points: 50 },
    { place: 4, points: 40 },
    { place: 5, points: 30 },
    { place: 6, points: 20 },
    { place: 7, points: 15 },
    { place: 8, points: 10 },
    { place: 9, points: 5 },
  ]);

  // Load seasons on mount
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const allSeasons = await ratingSeasonsAPI.getAll();
        setSeasons(allSeasons);
        
        // Auto-select active season if available
        const activeSeason = allSeasons.find(s => s.is_active);
        if (activeSeason) {
          setSelectedSeasonId(activeSeason.id);
        }
      } catch (error) {
        console.error('Error loading seasons:', error);
      }
    };
    
    loadSeasons();
  }, []);

  // Update point distribution when maxPlayers changes
  const updateMaxPlayers = (newMax: number) => {
    setMaxPlayers(newMax);
    
    // Adjust point distribution to match new maxPlayers
    if (newMax > pointDistribution.length) {
      // Add more places
      const newPlaces = [];
      for (let i = pointDistribution.length + 1; i <= newMax; i++) {
        newPlaces.push({ place: i, points: Math.max(5, 100 - (i - 1) * 10) });
      }
      setPointDistribution([...pointDistribution, ...newPlaces]);
    } else if (newMax < pointDistribution.length) {
      // Remove extra places
      setPointDistribution(pointDistribution.slice(0, newMax));
    }
  };

  const addPlace = () => {
    const nextPlace = pointDistribution.length + 1;
    setPointDistribution([...pointDistribution, { place: nextPlace, points: 25 }]);
  };

  const removePlace = (place: number) => {
    if (pointDistribution.length > 1) {
      setPointDistribution(pointDistribution.filter(p => p.place !== place));
      // Reindex places
      const reindexed = pointDistribution
        .filter(p => p.place !== place)
        .map((p, index) => ({ ...p, place: index + 1 }));
      setPointDistribution(reindexed);
    }
  };

  const updatePoints = (place: number, points: number) => {
    setPointDistribution(
      pointDistribution.map(p => (p.place === place ? { ...p, points } : p))
    );
  };

  const handleSave = async () => {
    if (!name || !date || !time) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      // Создаем турнир через API
      const gameData = {
        name: name.toUpperCase(),
        description: description || `Турнир на ${maxPlayers} игроков. ${location}`,
        game_type: 'tournament',
        date,
        time,
        max_players: maxPlayers,
        buy_in: 0, // Можно добавить поле в форму
        status: 'upcoming',
        points_distribution_mode: useDefaultDistribution ? 'default' : 'manual',
        season_id: selectedSeasonId, // Привязываем к выбранному сезону
      };

      const createdGame = await gamesAPI.create(gameData);
      
      // Сохраняем point distribution в localStorage для этого турнира
      const tournamentSettings = JSON.parse(localStorage.getItem('tournamentSettings') || '{}');
      tournamentSettings[createdGame.id] = {
        pointDistribution,
        autoBalance,
        location,
        useDefaultDistribution,
      };
      localStorage.setItem('tournamentSettings', JSON.stringify(tournamentSettings));

      alert('Турнир успешно создан!');
      onClose();
      
      // Уведомляем родительский компонент для обновления списка
      if (onSave) {
        onSave(createdGame);
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Ошибка при создании турнира: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-50 overflow-y-auto pt-16"
    >
      <div className="min-h-screen px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">Создать турнир</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#252525] transition-all"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Tournament Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-gray-400">
              Название турнира *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="TEXAS HOLDEM CLASSIC"
              className="bg-[#1a1a1a] border-gray-800"
            />
          </div>

          {/* Max Players */}
          <div className="space-y-2">
            <Label htmlFor="maxPlayers" className="text-sm text-gray-400">
              Максимальное количество игроков *
            </Label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateMaxPlayers(Math.max(2, maxPlayers - 1))}
                className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-red-700/20 transition-all border border-gray-800"
              >
                <MinusIcon className="w-5 h-5" />
              </button>
              <Input
                id="maxPlayers"
                type="number"
                value={maxPlayers}
                onChange={(e) => updateMaxPlayers(Math.max(2, parseInt(e.target.value) || 2))}
                className="bg-[#1a1a1a] border-gray-800 text-center"
              />
              <button
                onClick={() => updateMaxPlayers(maxPlayers + 1)}
                className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-red-700/20 transition-all border border-gray-800"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm text-gray-400">
                Дата проведения *
              </Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-[#1a1a1a] border-gray-800"
                />
                <CalendarIcon className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm text-gray-400">
                Время начала *
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-[#1a1a1a] border-gray-800"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm text-gray-400">
              Место проведения
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Покер Клуб &quot;Ривер&quot;, ул. Тверская, 15"
              className="bg-[#1a1a1a] border-gray-800"
            />
          </div>

          {/* Season Selection */}
          <div className="space-y-2">
            <Label htmlFor="season" className="text-sm text-gray-400">
              Сезон рейтинга
            </Label>
            <Select
              value={selectedSeasonId?.toString() || ''}
              onValueChange={(value) => setSelectedSeasonId(value ? parseInt(value) : null)}
            >
              <SelectTrigger className="w-full bg-[#1a1a1a] border-gray-800 rounded-xl h-12 text-white hover:bg-[#252525] transition-colors">
                <SelectValue placeholder="Выберите сезон">
                  {selectedSeasonId 
                    ? seasons.find(s => s.id === selectedSeasonId)?.name 
                    : 'Выберите сезон'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                {seasons.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-gray-400">
                    Сезонов нет. Создайте сезон в админ-панели.
                  </div>
                ) : (
                  <>
                    <SelectItem 
                      value="" 
                      className="focus:bg-red-700/20 focus:text-white cursor-pointer"
                    >
                      Без сезона
                    </SelectItem>
                    {seasons.map((season) => (
                      <SelectItem 
                        key={season.id} 
                        value={season.id.toString()}
                        className="focus:bg-red-700/20 focus:text-white cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span>{season.name}</span>
                          {season.is_active && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                              Активный
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-gray-400">
              Описание
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Добавьте описание турнира, правила, информацию о бай-ине и структуре..."
              rows={4}
              className="bg-[#1a1a1a] border-gray-800 resize-none"
            />
          </div>

          {/* Points Distribution Mode */}
          <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-gray-800">
            <div>
              <Label className="text-sm">Распределение по ум.</Label>
              <p className="text-xs text-gray-400 mt-1">
                {useDefaultDistribution 
                  ? 'Автоматический расчет: 75 очков от каждого игрока, распределение по процентам'
                  : 'Ручное назначение очков для каждого места'}
              </p>
            </div>
            <Switch
              checked={useDefaultDistribution}
              onCheckedChange={setUseDefaultDistribution}
            />
          </div>

          {/* Point Distribution - только для ручного режима */}
          {!useDefaultDistribution && (
          <div className="space-y-3">
            <Label className="text-sm text-gray-400">
              Распределение баллов по местам (всего мест: {maxPlayers})
            </Label>

            <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 space-y-3">
              {pointDistribution.map((dist) => (
                <div key={dist.place} className="flex items-center gap-3">
                  <div className="w-12 h-10 rounded-lg bg-[#252525] flex items-center justify-center text-sm">
                    {dist.place}
                  </div>
                  <Input
                    type="number"
                    value={dist.points}
                    onChange={(e) => updatePoints(dist.place, parseInt(e.target.value) || 0)}
                    className="bg-[#252525] border-gray-800 flex-1"
                    placeholder="Баллы"
                  />
                  {pointDistribution.length > 1 && (
                    <button
                      onClick={() => removePlace(dist.place)}
                      className="w-10 h-10 rounded-full bg-red-700/20 flex items-center justify-center hover:bg-red-700/30 transition-all"
                    >
                      <MinusIcon className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Auto Balance Toggle */}
            <div className="flex items-center justify-between bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
              <div>
                <div className="text-sm mb-1">Автобалансировка баллов</div>
                <div className="text-xs text-gray-500">
                  Автоматически распределять баллы при неполном заполнении
                </div>
              </div>
              <Switch checked={autoBalance} onCheckedChange={setAutoBalance} />
            </div>
          </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 pb-8">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-transparent border-gray-800 hover:bg-[#1a1a1a] text-white hover:text-white"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 border-0"
            >
              Создать турнир
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

