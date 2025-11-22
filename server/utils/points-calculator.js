/**
 * Утилиты для расчета очков в турнире
 */

// Процентное распределение очков от банка для мест с 1 по 15
// Данные из скриншота пользователя
const DEFAULT_DISTRIBUTION_PERCENTAGES = {
  1: 24,      // 24%
  2: 17,      // 17%
  3: 11,      // 11%
  4: 8.5,     // 8.5%
  5: 7.5,     // 7.5%
  6: 6.6,     // 6.6%
  7: 5.5,     // 5.5%
  8: 5,       // 5%
  9: 4.5,     // 4.5%
  10: 3,      // 3%
  11: 2,      // 2%
  12: 1.5,    // 1.5%
  13: 1.5,    // 1.5%
  14: 1.5,    // 1.5%
  15: 1,      // 1%
};

// Очки за место для каждого игрока
const POINTS_PER_PLAYER = 75;

// Фиксированные очки для мест после 15-го
const POINTS_FOR_PLACE_AFTER_15 = 5;

/**
 * Рассчитывает очки для игрока по системе "по умолчанию"
 * 
 * @param {number} place - Место игрока (1, 2, 3, ...)
 * @param {number} totalPlayers - Общее количество игроков, участвовавших в турнире
 * @returns {number} - Количество очков для данного места
 */
export function calculateDefaultPoints(place, totalPlayers) {
  if (place < 1) {
    throw new Error('Place must be >= 1');
  }
  
  if (totalPlayers < 1) {
    throw new Error('totalPlayers must be >= 1');
  }
  
  // Места после 15-го получают фиксированно 5 очков
  if (place > 15) {
    return POINTS_FOR_PLACE_AFTER_15;
  }
  
  // Рассчитываем общий банк очков
  const totalPrizePool = totalPlayers * POINTS_PER_PLAYER;
  
  // Получаем процент для данного места
  const percentage = DEFAULT_DISTRIBUTION_PERCENTAGES[place];
  
  if (percentage === undefined) {
    // Для мест, не указанных в таблице (не должно быть, но на всякий случай)
    return POINTS_FOR_PLACE_AFTER_15;
  }
  
  // Рассчитываем очки
  const points = Math.round((totalPrizePool * percentage) / 100);
  
  return points;
}

/**
 * Рассчитывает очки для всех игроков по системе "по умолчанию"
 * 
 * @param {Array} players - Массив игроков с полем finish_place
 * @returns {Array} - Массив игроков с добавленным полем calculated_points
 */
export function calculateAllDefaultPoints(players) {
  const totalPlayers = players.length;
  
  return players.map(player => ({
    ...player,
    calculated_points: calculateDefaultPoints(player.finish_place, totalPlayers)
  }));
}

/**
 * Проверяет, должна ли использоваться система "по умолчанию"
 * 
 * @param {string} mode - Режим начисления очков ('manual' или 'default')
 * @returns {boolean}
 */
export function shouldUseDefaultDistribution(mode) {
  return mode === 'default';
}

