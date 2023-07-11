import { Ship } from "./messages";

export type GameId = number
export interface AppState {
  users: User[];
  rooms: Room[];
  games: Record<GameId, Game>;
}
export type UserId = number;

interface Room {
  player1: UserId;
  id: number;
}

interface Game {
  id: GameId;
  player1: UserId;
  player2: UserId;
  player1Ships?: Ship[];
  player2Ships?: Ship[];
}

export interface User {
  name: string;
  id: number;
}