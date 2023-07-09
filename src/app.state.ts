
export interface AppState {
  users: User[];
  rooms: Room[];
}
export type UserId = number;

interface Room {
  player1: number;
  player2?: number;
  game?: Game;
}

interface Game {

}

interface User {
  name: string;
  id: number;
}