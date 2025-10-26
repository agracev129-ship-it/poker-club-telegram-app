import { useLeaderboard } from '../hooks/useLeaderboard';
import { useUser } from '../hooks/useUser';
import { Trophy, TrendingUp } from 'lucide-react';
import { getInitials } from '../lib/utils';

export function RatingTab() {
  const { user } = useUser();
  const { leaderboard, loading } = useLeaderboard(50);

  const topPlayers = leaderboard.slice(0, 8);

  return (
    <div className="min-h-screen bg-black pb-8">
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-2xl mb-1">Рейтинг</h2>
        <p className="text-sm text-gray-400">Топ игроков клуба</p>
      </div>

      {/* User Position */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-2xl p-4 border border-red-900/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">Ваша позиция</div>
              <div className="text-2xl">#{user?.current_rank || '—'}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">Рейтинг</div>
              <div className="text-xl text-yellow-500">{user?.total_points || 0}</div>
            </div>
            <div className="w-12 h-12 bg-red-700/20 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 */}
      <div className="px-4 mb-4">
        <div className="text-sm text-gray-400 mb-2">Топ-3</div>
        <div className="grid grid-cols-3 gap-2">
          {/* 2nd Place */}
          {topPlayers[1] && (
            <div className="flex flex-col items-center pt-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mb-2 text-sm">
                2
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-2.5 w-full text-center border border-gray-800">
                <div className="text-xs mb-1 truncate">{topPlayers[1].username || topPlayers[1].first_name}</div>
                <div className="text-xs text-gray-500">{topPlayers[1].total_points}</div>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topPlayers[0] && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-2">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div className="bg-gradient-to-br from-red-700 to-red-900 rounded-xl p-2.5 w-full text-center">
                <div className="text-xs mb-1 truncate">{topPlayers[0].username || topPlayers[0].first_name}</div>
                <div className="text-xs">{topPlayers[0].total_points}</div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topPlayers[2] && (
            <div className="flex flex-col items-center pt-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-2 text-sm">
                3
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-2.5 w-full text-center border border-gray-800">
                <div className="text-xs mb-1 truncate">{topPlayers[2].username || topPlayers[2].first_name}</div>
                <div className="text-xs text-gray-500">{topPlayers[2].total_points}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="px-4">
        <div className="text-sm text-gray-400 mb-2">Общий рейтинг</div>
        {loading ? (
          <div className="text-center text-gray-400 py-8">Загрузка...</div>
        ) : (
          <div className="space-y-2">
            {topPlayers.map((player, index) => (
              <div
                key={player.id}
                className="bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-3 border border-gray-800"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    index === 0
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                      : index === 1
                      ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                      : index === 2
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                      : 'bg-gray-800'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm truncate">{player.username || player.first_name}</span>
                    <TrendingUp className="w-3 h-3 text-green-500 shrink-0" />
                  </div>
                  <div className="text-xs text-gray-500">
                    {player.games_played} игр • {player.games_won} побед
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm text-yellow-500">{player.total_points}</div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

