import { useLeaderboard } from '../hooks/useLeaderboard';
import { useUser } from '../hooks/useUser';
import { getInitials } from '../lib/utils';

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
  const { leaderboard, loading } = useLeaderboard(50);

  // Находим позицию текущего пользователя в рейтинге
  const userRank = user ? leaderboard.findIndex(p => p.id === user.id) + 1 : 0;
  const displayRank = userRank > 0 ? userRank : (user?.current_rank || null);

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-2xl mb-1">Рейтинг</h2>
        <p className="text-sm text-gray-400">Топ игроков клуба</p>
      </div>

      {/* Your Position Card */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-2xl p-4 border border-red-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={user.first_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-red-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border-2 border-red-700">
                  <span className="text-lg">{getInitials(user?.first_name || 'И', user?.last_name)}</span>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-400">Ваша позиция</div>
                <div className="text-2xl">#{displayRank || '—'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Очки</div>
              <div className="text-2xl text-yellow-500">{user?.total_points || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-4">
        <div className="text-sm text-gray-400 mb-3">Общий рейтинг</div>
        
        {loading ? (
          <div className="text-center text-gray-400 py-8">Загрузка...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Нет данных</div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((player, index) => {
              const isCurrentUser = player.id === user?.id;
              const rank = index + 1;
              
              return (
                <div
                  key={player.id}
                  className={`rounded-2xl p-4 flex items-center gap-3 transition-all ${
                    isCurrentUser
                      ? 'bg-gradient-to-br from-red-700/30 to-red-900/30 border border-red-700/50'
                      : 'bg-[#1a1a1a] border border-gray-800'
                  }`}
                >
                  {/* Rank Badge */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                      rank === 1
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                        : rank === 2
                        ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                        : rank === 3
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                        : isCurrentUser
                        ? 'bg-red-700/30 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {rank === 1 ? <TrophyIcon className="w-5 h-5" /> : rank}
                  </div>

                  {/* Avatar */}
                  <div className="shrink-0">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.first_name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                        <span className="text-sm">{getInitials(player.first_name || 'U', player.last_name)}</span>
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-base truncate ${isCurrentUser ? 'text-white' : ''}`}>
                        {player.first_name || player.username || 'Игрок'} {player.last_name || ''}
                      </span>
                      {rank <= 3 && (
                        <MedalIcon className="w-4 h-4 text-yellow-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {player.games_played || 0} игр • {player.games_won || 0} побед
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <div className="text-lg text-yellow-500 font-medium">{player.total_points || 0}</div>
                    <div className="text-xs text-gray-500">очков</div>
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
