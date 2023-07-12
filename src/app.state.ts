import { Ship } from './messages';

export type GameId = number;
export interface AppState {
  users: User[];
  rooms: Room[];
  games: Record<GameId, Game>;
  // startedGames: Record<GameId, Game>;
}
export type UserId = number;

interface Room {
  player1: UserId;
  id: number;
}

export interface Game {
  id: GameId;
  ownerId: UserId;
  players: Record<UserId, GameField>;
  // player1: UserId;
  // player2: UserId;
  // player1Ships?: Ship[];
  // player2Ships?: Ship[];
}

export interface GameField {
  ships?: Ship[];
}

export interface User {
  name: string;
  id: number;
}
