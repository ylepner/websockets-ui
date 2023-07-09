export interface RegisterRequest {
  type: 'reg';
  data: {
    name: string;
    password: string;
  },
  id: 0,
}

export interface SinglePlayRequest {
  type: 'single_play',
  data: '',
  id: 0,
}

export interface CreateRoomRequest {
  type: 'create_room',
  data: '',
  id: 0,
}

export interface AddUserToRoomRequest {
  type: 'add_user_to_room',
  data: {
    indexRoom: number,
  },
  id: 0,
}

export interface createNewRoomRequest {
  type: "create_room",
  data: "",
  id: 0,
}


export type InputMessage = RegisterRequest | SinglePlayRequest | CreateRoomRequest | AddUserToRoomRequest;

export interface RegisterResponse {
  type: "reg",
  data: {
    name: string,
    index: number,
    error: boolean,
    errorText: string,
  },
  id: 0,
}

export interface CreateGameResponse {
  type: "create_game",
  data: {
    idGame: number,
    idPlayer: number,
  },
  id: 0,
}