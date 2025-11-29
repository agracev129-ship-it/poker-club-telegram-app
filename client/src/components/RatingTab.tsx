import { useState, useEffect } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useUser } from '../hooks/useUser';
import { getInitials } from '../lib/utils';
import { getIOSPaddingTop } from '../lib/platform';
import { useRatingSeasons } from './RatingSeasonsContext';
import { ratingSeasonsAPI, UserStats } from '../lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

// Icon components as inline SVGs
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

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);

const MedalIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/>
    <path d="M11 12 5.12 2.2"/>
    <path d="m13 12 5.88-9.8"/>
    <path d="M8 7h8"/>
    <circle cx="12" cy="17" r="5"/>
    <path d="M12 18v-2h-.5"/>
  </svg>
);

export function RatingTab() {
  const { user } = useUser();
  const { leaderboard: globalLeaderboard, loading: globalLoading } = useLeaderboard(50);
  const { seasons, loading: seasonsLoading } = useRatingSeasons();
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [seasonLeaderboard, setSeasonLeaderboard] = useState<UserStats[]>([]);
  const [seasonLoading, setSeasonLoading] = useState(false);

  // Get active season for default selection
  const activeSeason = seasons.find(s => s.isActive);

  // Auto-select active season on first load
  useEffect(() => {
    if (!seasonsLoading && seasons.length > 0 && selectedSeasonId === null && activeSeason) {
      console.log('🎯 Auto-selecting active season:', activeSeason.name, activeSeason.id);
      setSelectedSeasonId(activeSeason.id);
    }
  }, [seasons, seasonsLoading, selectedSeasonId, activeSeason]);

  // Determine which leaderboard to use
  const isSeasonView = selectedSeasonId !== null;
  const leaderboard = isSeasonView ? seasonLeaderboard : globalLeaderboard;
  const loading = isSeasonView ? seasonLoading : globalLoading;

  // Load season leaderboard when season is selected
  useEffect(() => {
    const loadSeasonLeaderboard = async () => {
      if (selectedSeasonId === null) {
        setSeasonLeaderboard([]);
        return;
      }

      console.log('📊 Loading leaderboard for season:', selectedSeasonId);
      try {
        setSeasonLoading(true);
        const data = await ratingSeasonsAPI.getLeaderboard(selectedSeasonId, 50);
        console.log('✅ Season leaderboard loaded:', data.length, 'players');
        setSeasonLeaderboard(data);
      } catch (error) {
        console.error('❌ Error loading season leaderboard:', error);
        setSeasonLeaderboard([]);
      } finally {
        setSeasonLoading(false);
      }
    };

    loadSeasonLeaderboard();
  }, [selectedSeasonId]);

  // Находим позицию текущего пользователя в рейтинге
  const userRank = user ? leaderboard.findIndex(p => p.id === user.id) + 1 : 0;
  const displayRank = userRank > 0 ? userRank : (isSeasonView ? null : (user?.current_rank || null));
  
  // Get user points for display
  const userPoints = isSeasonView
    ? (leaderboard.find(p => p.id === user?.id)?.total_points || 0)
    : (user?.total_points || 0);

  // Top 3 players
  const topPlayers = leaderboard.slice(0, 3);
  const topTenthPlayer = leaderboard[9];

  return (
    <div className={`min-h-screen bg-black pb-24 ${getIOSPaddingTop()}`}>
      {/* Compact Header */}
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-2xl mb-1">Рейтинг</h2>
        <p className="text-sm text-gray-400">Топ игроков клуба</p>
      </div>

      {/* Season Selector */}
      <div className="px-4 mb-4">
        <Select
          value={selectedSeasonId?.toString() || 'all'}
          onValueChange={(value) => setSelectedSeasonId(value === 'all' ? null : parseInt(value))}
        >
          <SelectTrigger className="w-full bg-[#1a1a1a] border-gray-800 rounded-2xl h-12 text-white hover:bg-[#252525] transition-colors">
            <SelectValue>
              {selectedSeasonId === null 
                ? 'Общий рейтинг' 
                : seasons.find(s => s.id === selectedSeasonId)?.name || 'Выберите сезон'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
            <SelectItem value="all" className="focus:bg-red-700/20 focus:text-white cursor-pointer">
              Общий рейтинг
            </SelectItem>
            {seasons.length > 0 && (
              <>
                {seasons.map((season) => (
                  <SelectItem 
                    key={season.id} 
                    value={season.id.toString()}
                    className="focus:bg-red-700/20 focus:text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>{season.name}</span>
                      {season.isActive && (
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

      {/* Your Position Card */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-2xl p-4 border border-red-900/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">Ваша позиция</div>
              <div className="text-2xl">#{displayRank || '—'}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">Рейтинг</div>
              <div className="text-xl text-yellow-500">{userPoints}</div>
            </div>
            <div className="w-12 h-12 bg-red-700/20 rounded-full flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
          {displayRank && displayRank > 10 && topTenthPlayer && (
            <div className="text-xs text-gray-400 mt-3">
              До топ-10: <span className="text-white">{(topTenthPlayer.total_points || 0) - userPoints} очков</span>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 */}
      {!loading && topPlayers.length >= 3 && (
        <div className="px-4 mb-4">
          <div className="text-sm text-gray-400 mb-2">Топ-3</div>
          <div className="grid grid-cols-3 gap-2">
            {/* 2nd Place */}
            <div className="flex flex-col items-center pt-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mb-2 text-sm font-medium">
                2
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-2.5 w-full text-center border border-gray-800">
                <div className="text-xs mb-1 truncate">{topPlayers[1]?.first_name || 'Игрок'}</div>
                <div className="text-xs text-gray-500">{topPlayers[1]?.total_points || 0}</div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-2">
                <TrophyIcon className="w-7 h-7 text-white" />
              </div>
              <div className="bg-gradient-to-br from-red-700 to-red-900 rounded-xl p-2.5 w-full text-center">
                <div className="text-xs mb-1 truncate">{topPlayers[0]?.first_name || 'Игрок'}</div>
                <div className="text-xs">{topPlayers[0]?.total_points || 0}</div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center pt-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-2 text-sm font-medium">
                3
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-2.5 w-full text-center border border-gray-800">
                <div className="text-xs mb-1 truncate">{topPlayers[2]?.first_name || 'Игрок'}</div>
                <div className="text-xs text-gray-500">{topPlayers[2]?.total_points || 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="px-4">
        <div className="text-sm text-gray-400 mb-2">Общий рейтинг</div>
        
        {loading ? (
          <div className="text-center text-gray-400 py-8">Загрузка...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Нет данных</div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((player, index) => {
              const rank = index + 1;
              
              return (
                <div
                  key={player.id}
                  className="bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-3 border border-gray-800"
                >
                  {/* Rank Badge */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      rank === 1
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                        : rank === 2
                        ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                        : rank === 3
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                        : 'bg-gray-800'
                    }`}
                  >
                    {rank}
                  </div>

                  {/* Avatar */}
                  <div className="shrink-0">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.first_name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                        <span className="text-sm">{getInitials(player.first_name || 'U', player.last_name)}</span>
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm truncate">
                        {player.first_name || player.username || 'Игрок'} {player.last_name || ''}
                      </span>
                      {rank <= 3 && player.games_won && player.games_won > 0 && (
                        <TrendingUpIcon className="w-3 h-3 text-green-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player.games_played || 0} игр • {player.games_won || 0} побед
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <div className="text-sm text-yellow-500">{player.total_points || 0}</div>
                    <div className="text-xs text-gray-500">pts</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
