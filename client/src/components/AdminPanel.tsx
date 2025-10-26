import { useState } from 'react';
import { gamesAPI, tournamentsAPI, usersAPI } from '../lib/api';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Edit, Trash2, Users, Trophy, Gamepad2 } from 'lucide-react';

export function AdminPanel() {
  const [activeSection, setActiveSection] = useState<'games' | 'tournaments' | 'users'>('games');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Форма для создания игры
  const [gameForm, setGameForm] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    max_players: 60,
    buy_in: 5000,
  });

  const handleCreateGame = async () => {
    try {
      await gamesAPI.create({
        ...gameForm,
        game_type: 'cash',
        status: 'upcoming',
      });
      alert('Игра создана успешно!');
      setIsCreateDialogOpen(false);
      setGameForm({
        name: '',
        description: '',
        date: '',
        time: '',
        max_players: 60,
        buy_in: 5000,
      });
    } catch (error) {
      alert('Ошибка при создании игры');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Админ-панель</h1>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeSection === 'games' ? 'default' : 'outline'}
            onClick={() => setActiveSection('games')}
          >
            <Gamepad2 className="w-4 h-4 mr-2" />
            Игры
          </Button>
          <Button
            variant={activeSection === 'tournaments' ? 'default' : 'outline'}
            onClick={() => setActiveSection('tournaments')}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Турниры
          </Button>
          <Button
            variant={activeSection === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveSection('users')}
          >
            <Users className="w-4 h-4 mr-2" />
            Пользователи
          </Button>
        </div>

        {/* Games Section */}
        {activeSection === 'games' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl">Управление играми</h2>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Создать игру
              </Button>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400">
                Здесь будет список игр с возможностью редактирования и удаления
              </p>
            </div>
          </div>
        )}

        {/* Tournaments Section */}
        {activeSection === 'tournaments' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl">Управление турнирами</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Создать турнир
              </Button>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400">
                Здесь будет список турниров с возможностью редактирования
              </p>
            </div>
          </div>
        )}

        {/* Users Section */}
        {activeSection === 'users' && (
          <div>
            <h2 className="text-2xl mb-4">Управление пользователями</h2>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400">
                Здесь будет список пользователей с возможностью редактирования статистики
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Game Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Создать новую игру</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Название</label>
              <input
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                value={gameForm.name}
                onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })}
                placeholder="TEXAS HOLDEM CLASSIC"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Описание</label>
              <textarea
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                value={gameForm.description}
                onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                placeholder="Описание игры..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Дата</label>
                <input
                  type="date"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  value={gameForm.date}
                  onChange={(e) => setGameForm({ ...gameForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Время</label>
                <input
                  type="time"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  value={gameForm.time}
                  onChange={(e) => setGameForm({ ...gameForm, time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Макс. игроков</label>
                <input
                  type="number"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  value={gameForm.max_players}
                  onChange={(e) => setGameForm({ ...gameForm, max_players: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Бай-ин (₽)</label>
                <input
                  type="number"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  value={gameForm.buy_in}
                  onChange={(e) => setGameForm({ ...gameForm, buy_in: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <Button onClick={handleCreateGame} className="w-full">
              Создать игру
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

