// Mock game data for demonstration
export interface RegisteredPlayer {
  id: number;
  name: string;
  rating: number;
  isFriend: boolean;
}

export interface Game {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  players: string;
  buyIn?: string;
  prize?: string;
  description: string;
  hasFriendRegistered: boolean;
  registeredPlayers: RegisteredPlayer[];
}

export const games: Game[] = [
  {
    id: 1,
    name: 'TEXAS HOLDEM CLASSIC',
    players: '45 / 60',
    time: '18:00',
    date: '24.10',
    location: 'Покер Клуб "Ривер", ул. Тверская, 15',
    description: 'Классический покер Texas Hold\'em с бай-ином 5000₽. Стартовый стек 10,000 фишек. Уровни по 20 минут.',
    hasFriendRegistered: true,
    registeredPlayers: [
      { id: 1, name: 'Александр Иванов', rating: 2450, isFriend: true },
      { id: 2, name: 'Мария Петрова', rating: 2280, isFriend: false },
      { id: 3, name: 'Дмитрий Сидоров', rating: 2150, isFriend: false },
      { id: 4, name: 'Елена Козлова', rating: 2320, isFriend: false },
      { id: 5, name: 'Сергей Морозов', rating: 2190, isFriend: false },
      { id: 6, name: 'Анна Новикова', rating: 2410, isFriend: false },
      { id: 7, name: 'Игорь Волков', rating: 2070, isFriend: false },
      { id: 8, name: 'Ольга Соколова', rating: 2260, isFriend: false },
    ],
  },
  {
    id: 2,
    name: 'OMAHA CHAMPIONSHIP',
    players: '32 / 50',
    time: '20:00',
    date: '24.10',
    location: 'Покер Клуб "Ривер", ул. Тверская, 15',
    description: 'Pot-Limit Omaha чемпионат. Бай-ин 7500₽. Глубокие стеки и длинные уровни по 30 минут.',
    hasFriendRegistered: false,
    registeredPlayers: [
      { id: 1, name: 'Максим Лебедев', rating: 2580, isFriend: false },
      { id: 2, name: 'Виктория Орлова', rating: 2390, isFriend: false },
      { id: 3, name: 'Андрей Павлов', rating: 2220, isFriend: false },
      { id: 4, name: 'Наталья Федорова', rating: 2470, isFriend: false },
      { id: 5, name: 'Владимир Захаров', rating: 2310, isFriend: false },
    ],
  },
  {
    id: 3,
    name: 'DEEP STACK TURBO',
    players: '67 / 80',
    time: '19:30',
    date: '25.10',
    location: 'Покер Клуб "Ривер", ул. Тверская, 15',
    description: 'Турбо-турнир с глубокими стеками. Бай-ин 3000₽. Стартовый стек 15,000 фишек. Уровни по 15 минут.',
    hasFriendRegistered: true,
    registeredPlayers: [
      { id: 1, name: 'Евгений Смирнов', rating: 2340, isFriend: false },
      { id: 2, name: 'Татьяна Белова', rating: 2180, isFriend: false },
      { id: 3, name: 'Николай Кузнецов', rating: 2510, isFriend: true },
      { id: 4, name: 'Ирина Попова', rating: 2090, isFriend: false },
      { id: 5, name: 'Алексей Васильев', rating: 2420, isFriend: false },
      { id: 6, name: 'Светлана Романова', rating: 2270, isFriend: false },
    ],
  },
  {
    id: 4,
    name: 'BOUNTY TOURNAMENT',
    players: '28 / 40',
    time: '21:00',
    date: '25.10',
    location: 'Покер Клуб "Ривер", ул. Тверская, 15',
    description: 'Баунти-турнир с прогрессивными наградами. Бай-ин 6000₽. Получайте 1000₽ за каждого выбитого игрока.',
    hasFriendRegistered: false,
    registeredPlayers: [
      { id: 1, name: 'Роман Егоров', rating: 2200, isFriend: false },
      { id: 2, name: 'Юлия Тимофеева', rating: 2360, isFriend: false },
      { id: 3, name: 'Павел Григорьев', rating: 2130, isFriend: false },
      { id: 4, name: 'Марина Сергеева', rating: 2290, isFriend: false },
    ],
  },
];


