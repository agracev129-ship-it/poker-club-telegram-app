import { useState } from 'react';
import { useRatingSeasons, RatingSeason } from './RatingSeasonsContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner';

// Icon components
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

const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14"/>
    <path d="M12 5v14"/>
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

const EditIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    <path d="m15 5 4 4"/>
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

// Format date for display
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
};

// Calculate days between dates
const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get season status
const getSeasonStatus = (startDate: string, endDate: string): 'upcoming' | 'active' | 'finished' => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 'upcoming';
  if (now > end) return 'finished';
  return 'active';
};

export function AdminRatingTab() {
  const { seasons, addSeason, updateSeason, deleteSeason, setActiveSeason } = useRatingSeasons();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<RatingSeason | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<RatingSeason | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });

  // Sort seasons by start date (newest first)
  const sortedSeasons = [...seasons].sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  const openCreateDialog = () => {
    setFormData({ name: '', startDate: '', endDate: '' });
    setEditingSeason(null);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (season: RatingSeason) => {
    setFormData({
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
    });
    setEditingSeason(season);
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error('Заполните все поля');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('Дата окончания должна быть позже даты начала');
      return;
    }

    if (editingSeason) {
      updateSeason(editingSeason.id, formData);
      toast.success('Сезон обновлен');
    } else {
      addSeason({ ...formData, isActive: false });
      toast.success('Сезон создан');
    }

    setIsCreateDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteSeason(deleteConfirm.id);
      toast.success('Сезон удален');
      setDeleteConfirm(null);
    }
  };

  const handleSetActive = (season: RatingSeason) => {
    setActiveSeason(season.id);
    toast.success(`Активный сезон: ${season.name}`);
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header with Admin Badge */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <TrophyIcon className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl">Управление рейтингом</h2>
          <div className="px-2 py-0.5 bg-red-700/20 border border-red-700/50 rounded-full flex items-center gap-1">
            <ShieldCheckIcon className="w-3 h-3 text-red-400" />
            <span className="text-xs text-red-400">Admin</span>
          </div>
        </div>
        <p className="text-sm text-gray-400">Создание и управление сезонами рейтинга</p>
      </div>

      {/* Create Button */}
      <div className="px-4 mb-6">
        <Button
          onClick={openCreateDialog}
          className="w-full bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 border-0 py-6"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Создать сезон
        </Button>
      </div>

      {/* Seasons List */}
      <div className="px-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <CalendarIcon className="w-5 h-5 text-red-500" />
          <h3 className="text-sm">Все сезоны ({sortedSeasons.length})</h3>
        </div>

        {sortedSeasons.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrophyIcon className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">Нет созданных сезонов</p>
            <p className="text-gray-600 text-xs mt-1">Создайте первый сезон рейтинга</p>
          </div>
        ) : (
          sortedSeasons.map((season) => {
            const status = getSeasonStatus(season.startDate, season.endDate);
            const totalDays = getDaysBetween(season.startDate, season.endDate);
            
            return (
              <div
                key={season.id}
                className={`rounded-2xl p-4 border transition-all ${
                  season.isActive && status !== 'finished' && status !== 'upcoming'
                    ? 'bg-gradient-to-br from-red-700/30 to-red-900/30 border-red-700/50'
                    : 'bg-[#1a1a1a] border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base">{season.name}</h3>
                      {status === 'finished' ? (
                        <div className="px-2 py-0.5 bg-gray-700/20 border border-gray-700/50 rounded-full">
                          <span className="text-xs text-gray-400">Завершён</span>
                        </div>
                      ) : status === 'upcoming' ? (
                        <div className="px-2 py-0.5 bg-blue-700/20 border border-blue-700/50 rounded-full">
                          <span className="text-xs text-blue-400">Ожидание</span>
                        </div>
                      ) : season.isActive ? (
                        <div className="px-2 py-0.5 bg-green-700/20 border border-green-700/50 rounded-full">
                          <span className="text-xs text-green-400">Активный</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-1">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{formatDate(season.startDate)}</span>
                      </div>
                      <span>—</span>
                      <span>{formatDate(season.endDate)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Продолжительность: {totalDays} {totalDays === 1 ? 'день' : totalDays < 5 ? 'дня' : 'дней'}
                    </div>
                  </div>
                </div>

              <div className="space-y-2">
                {!season.isActive && (
                  <Button
                    onClick={() => handleSetActive(season)}
                    variant="outline"
                    size="sm"
                    className="w-full bg-green-700/20 border-green-700/50 hover:bg-green-700/30 text-green-400 hover:text-green-300"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                    Активировать
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => openEditDialog(season)}
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-blue-700/20 border-blue-700/50 hover:bg-blue-700/30 text-blue-400 hover:text-blue-300"
                  >
                    <EditIcon className="w-4 h-4 mr-1.5" />
                    Изменить
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirm(season)}
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-red-700/20 border-red-700/50 hover:bg-red-700/30 text-red-400 hover:text-red-300"
                  >
                    <TrashIcon className="w-4 h-4 mr-1.5" />
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSeason ? 'Изменить сезон' : 'Создать сезон'}</DialogTitle>
            <DialogDescription>
              {editingSeason ? 'Изменить параметры существующего сезона рейтинга' : 'Создать новый сезон для отслеживания рейтинга игроков'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название сезона</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Весенний сезон 2024"
                className="bg-[#252525] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Дата начала</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-[#252525] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Дата окончания</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="bg-[#252525] border-gray-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 border-0"
            >
              {editingSeason ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сезон?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Вы уверены, что хотите удалить сезон "{deleteConfirm?.name}"? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 border-0"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

