import { Ship } from './messages/messages';

export type GameId = number;
export interface AppState {
  users: User[];
  rooms: Room[];
  games: Record<GameId, Game>;
  gameResults: Record<GameId, GameResult>;
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
  gameState?: {
    shots: Record<UserId, [number, number][]>;
    currentPlayer: UserId;
  };
}

export interface GameField {
  ships?: Ship[];
}

export interface User {
  name: string;
  id: number;
  password: string;
}

export interface GameResult {
  gameId: number;
  winnerId: number;
  looserId: number;
}

export interface Winner {
  name: string;
  wins: number;
}
