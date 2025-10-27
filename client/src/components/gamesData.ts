// Mock game data for demonstration
export interface Game {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  players: string;
  buyIn: string;
  prize: string;
  description: string;
}

export const games: Game[] = [
  {
    id: 1,
    name: 'Турнир Холдем',
    date: '26.10',
    time: '19:00',
    location: 'г. Москва, ул. Примерная, д. 1',
    players: '24/30',
    buyIn: '5,000₽',
    prize: '120,000₽',
    description: 'Классический турнир Texas Hold\'em с гарантированным призовым фондом. Регистрация за 30 минут до начала. Структура: 20 минут на уровень, стартовый стек 10,000 фишек.',
  },
  {
    id: 2,
    name: 'Омаха PLO',
    date: '27.10',
    time: '20:00',
    location: 'г. Москва, ул. Примерная, д. 1',
    players: '18/20',
    buyIn: '3,000₽',
    prize: '54,000₽',
    description: 'Pot Limit Omaha турнир для опытных игроков. Быстрая структура: 15 минут на уровень. Минимум 3 места в призах.',
  },
  {
    id: 3,
    name: 'Быстрый турнир',
    date: '28.10',
    time: '18:00',
    location: 'г. Москва, ул. Примерная, д. 1',
    players: '16/20',
    buyIn: '2,000₽',
    prize: '32,000₽',
    description: 'Турбо турнир для тех, кто ценит свое время. Структура: 10 минут на уровень. Быстрая игра, большие эмоции!',
  },
  {
    id: 4,
    name: 'Турнир Холдем',
    date: '29.10',
    time: '19:00',
    location: 'г. Москва, ул. Примерная, д. 1',
    players: '28/30',
    buyIn: '5,000₽',
    prize: '140,000₽',
    description: 'Еженедельный турнир с увеличенным призовым фондом. Deep stack формат: стартовый стек 15,000 фишек. 25 минут на уровень.',
  },
  {
    id: 5,
    name: 'Воскресный мейджор',
    date: '30.10',
    time: '17:00',
    location: 'г. Москва, ул. Примерная, д. 1',
    players: '35/40',
    buyIn: '10,000₽',
    prize: '400,000₽',
    description: 'Главное событие недели! Престижный турнир с самым большим призовым фондом. Deep stack, медленная структура для максимальной игры. Гарантия 25 места в призах.',
  },
];


