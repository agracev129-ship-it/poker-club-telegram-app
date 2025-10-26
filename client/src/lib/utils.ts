import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирует дату в читаемый формат
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

/**
 * Форматирует время в читаемый формат
 */
export function formatTime(time: string): string {
  if (time.length === 5) return time; // уже в формате HH:MM
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

/**
 * Форматирует число с разделителями тысяч
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Форматирует сумму денег
 */
export function formatMoney(amount: number): string {
  return `${formatNumber(amount)}₽`;
}

/**
 * Получает цвет достижения
 */
export function getAchievementColor(color: string): string {
  const colors: Record<string, string> = {
    yellow: 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30',
    blue: 'text-blue-500 bg-blue-500/20 border-blue-500/30',
    purple: 'text-purple-500 bg-purple-500/20 border-purple-500/30',
    green: 'text-green-500 bg-green-500/20 border-green-500/30',
    red: 'text-red-500 bg-red-500/20 border-red-500/30',
    gray: 'text-gray-500 bg-gray-500/20 border-gray-500/30',
    gold: 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30',
  };
  return colors[color] || colors.gray;
}

/**
 * Форматирует относительное время (например, "2д назад")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  
  if (minutes < 60) return `${minutes}м`;
  if (hours < 24) return `${hours}ч`;
  if (days < 7) return `${days}д`;
  return `${weeks}н`;
}

/**
 * Получает полное имя пользователя
 */
export function getFullName(firstName: string, lastName?: string): string {
  return lastName ? `${firstName} ${lastName}` : firstName;
}

/**
 * Получает инициалы пользователя
 */
export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}`;
}

