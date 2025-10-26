import { useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { getInitials } from '../lib/utils';
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

// Tournament A ratings
const tournamentARatings = [
  { id: 1, name: 'Devans', points: 2850, games: 45, wins: 28, rank: 1, trend: 'up' },
  { id: 2, name: 'PokerPro', points: 2720, games: 42, wins: 25, rank: 2, trend: 'up' },
  { id: 3, name: 'AllInKing', points: 2650, games: 38, wins: 22, rank: 3, trend: 'down' },
  { id: 4, name: 'ChipLeader', points: 2580, games: 40, wins: 21, rank: 4, trend: 'same' },
  { id: 5, name: 'BluffMaster', points: 2510, games: 35, wins: 19, rank: 5, trend: 'up' },
  { id: 6, name: 'RiverRat', points: 2445, games: 36, wins: 18, rank: 6, trend: 'up' },
  { id: 7, name: 'FlopKing', points: 2380, games: 33, wins: 17, rank: 7, trend: 'down' },
  { id: 8, name: 'TurnAce', points: 2320, games: 34, wins: 16, rank: 8, trend: 'same' },
];

// Tournament B ratings
const tournamentBRatings = [
  { id: 1, name: 'CardShark', points: 3120, games: 52, wins: 35, rank: 1, trend: 'up' },
  { id: 2, name: 'AceHunter', points: 2990, games: 48, wins: 32, rank: 2, trend: 'up' },
  { id: 3, name: 'PokerFace', points: 2880, games: 44, wins: 29, rank: 3, trend: 'same' },
  { id: 4, name: 'Devans', points: 2750, games: 41, wins: 26, rank: 4, trend: 'up' },
  { id: 5, name: 'RoyalFlush', points: 2680, games: 39, wins: 24, rank: 5, trend: 'down' },
  { id: 6, name: 'StackMaster', points: 2590, games: 37, wins: 22, rank: 6, trend: 'up' },
  { id: 7, name: 'CallKing', points: 2510, games: 35, wins: 20, rank: 7, trend: 'same' },
  { id: 8, name: 'BetBoss', points: 2445, games: 33, wins: 19, rank: 8, trend: 'up' },
];

type TournamentType = 'tournamentA' | 'tournamentB';

export function RatingTab() {
  const [selectedTournament, setSelectedTournament] = useState<TournamentType>('tournamentA');

  const topPlayers = selectedTournament === 'tournamentA' ? tournamentARatings : tournamentBRatings;
  const currentPlayer = topPlayers.find(p => p.name === 'Devans');
  const userRank = currentPlayer?.rank || 15;
  const userPoints = currentPlayer?.points || 2180;

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Compact Header */}
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-2xl mb-1">Рейтинг</h2>
        <p className="text-sm text-gray-400">Топ игроков клуба</p>
      </div>

      {/* Tournament Selector */}
      <div className="px-4 mb-4">
        <Select
          onValueChange={(value) => setSelectedTournament(value as TournamentType)}
          value={selectedTournament}
        >
          <SelectTrigger className="w-full bg-[#1a1a1a] border-gray-800 rounded-2xl h-12 text-white hover:bg-[#252525] transition-colors">
            <SelectValue>
              {selectedTournament === 'tournamentA' ? 'Турнир А' : 'Турнир Б'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
            <SelectItem value="tournamentA" className="focus:bg-red-700/20 focus:text-white cursor-pointer">
              Турнир А
            </SelectItem>
            <SelectItem value="tournamentB" className="focus:bg-red-700/20 focus:text-white cursor-pointer">
              Турнир Б
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Your Position Card */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-2xl p-4 border border-red-900/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">Ваша позиция</div>
              <div className="text-2xl">#{userRank}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">Рейтинг</div>
              <div className="text-xl text-yellow-500">{userPoints}</div>
            </div>
            <div className="w-12 h-12 bg-red-700/20 rounded-full flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
          {userRank > 10 && topPlayers[9] && (
            <div className="text-xs text-gray-400 mt-3">
              До топ-10: <span className="text-white">{topPlayers[9].points - userPoints} очков</span>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 */}
      <div className="px-4 mb-4">
        <div className="text-sm text-gray-400 mb-2">Топ-3</div>
        <div className="grid grid-cols-3 gap-2">
          {/* 2nd Place */}
          <div className="flex flex-col items-center pt-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mb-2 text-sm">
              2
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-2.5 w-full text-center border border-gray-800">
              <div className="text-xs mb-1 truncate">{topPlayers[1].name}</div>
              <div className="text-xs text-gray-500">{topPlayers[1].points}</div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-2">
              <TrophyIcon className="w-7 h-7 text-white" />
            </div>
            <div className="bg-gradient-to-br from-red-700 to-red-900 rounded-xl p-2.5 w-full text-center">
              <div className="text-xs mb-1 truncate">{topPlayers[0].name}</div>
              <div className="text-xs">{topPlayers[0].points}</div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center pt-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-2 text-sm">
              3
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-2.5 w-full text-center border border-gray-800">
              <div className="text-xs mb-1 truncate">{topPlayers[2].name}</div>
              <div className="text-xs text-gray-500">{topPlayers[2].points}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="px-4">
        <div className="text-sm text-gray-400 mb-2">Общий рейтинг</div>
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
                {player.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm truncate">{player.name}</span>
                  {player.trend === 'up' && (
                    <TrendingUpIcon className="w-3 h-3 text-green-500 shrink-0" />
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {player.games} игр • {player.wins} побед
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm text-yellow-500">{player.points}</div>
                <div className="text-xs text-gray-500">pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
