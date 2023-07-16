import { Winner } from '../app.state';
import {
  AttackRequest,
  AttackResponse,
  Finish,
  RandomAttackRequest,
} from './game-messages';

export interface RegisterRequest {
  type: 'reg';
  data: {
    name: string;
    password: string;
  };
  id: 0;
}

export interface SinglePlayRequest {
  type: 'single_play';
  data: '';
  id: 0;
}

export interface CreateRoomRequest {
  type: 'create_room';
  data: '';
  id: 0;
}

export interface AddUserToRoomRequest {
  type: 'add_user_to_room';
  data: {
    indexRoom: number;
  };
  id: 0;
}

export interface createNewRoomRequest {
  type: 'create_room';
  data: '';
  id: 0;
}

export interface UpdateRoomEvent {
  type: 'update_room';
  data: {
    roomId: number;
    roomUsers: {
      name: string;
      index: number;
    }[];
  }[];
  id: 0;
}

export interface AddShipsRequest {
  type: 'add_ships';
  data: {
    gameId: number;
    ships: Ship[];
    indexPlayer: number;
  };
  id: 0;
}

export interface Ship {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export type InputMessage =
  | RegisterRequest
  | SinglePlayRequest
  | CreateRoomRequest
  | AddUserToRoomRequest
  | AddShipsRequest
  | UpdateRoomEvent
  | AttackRequest
  | RandomAttackRequest
  | UserDisconnected;

export interface RegisterResponse {
  type: 'reg';
  data: {
    name: string;
    index: number;
    error: boolean;
    errorText: string;
  };
  id: 0;
}

export interface CreateGameResponse {
  type: 'create_game';
  data: {
    idGame: number;
    idPlayer: number;
  };
  id: 0;
}

export interface StartGameResponse {
  type: 'start_game';
  data: {
    ships: Ship[];
    currentIndexPlayer: number;
  };
  id: 0;
}

export interface TurnResponse {
  type: 'turn';
  data: {
    currentPlayer: number;
  };
  id: 0;
}

export interface UpdateWinners {
  type: 'update_winners';
  data: Winner[];
  id: 0;
}

export interface UserDisconnected {
  type: 'user_disconnected';
  userId: number;
  id: 0;
}

export type EventResponse =
  | RegisterResponse
  | CreateGameResponse
  | StartGameResponse
  | TurnResponse
  | UpdateRoomEvent
  | AttackResponse
  | Finish
  | UpdateWinners;
