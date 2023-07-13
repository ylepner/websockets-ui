import { User, UserId } from './app.state';
import { Ship } from './messages/messages';

export interface RoomCreated {
  type: 'room_created';
  ownerId: UserId;
}

export interface UserRegistered {
  type: 'user_registered';
  name: string;
  id: UserId;
}

export interface UserAddedToRoom {
  type: 'user_added_to_room';
  roomId: number;
  userId: UserId;
}

export interface RoomUpdated {
  type: 'room_updated';
}

export interface GameCreated {
  type: 'game_created';
  roomId: number;
  users: User[];
}

export interface ShipsAdded {
  type: 'ships_added';
  gameId: number;
  userId: UserId;
  ships: Ship[];
}

export interface Attacked {
  type: 'attacked';
  gameId: number;
  playerId: number;
  x: number;
  y: number;
}

export type AppEvent =
  | RoomCreated
  | UserRegistered
  | UserAddedToRoom
  | RoomUpdated
  | ShipsAdded
  | Attacked;
export type AppEventType = AppEvent['type'];
