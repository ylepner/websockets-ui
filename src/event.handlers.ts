import { AppState } from "./app.state";
import { FindByType } from "./common";
import { AppEvent, AppEventType } from "./events";

type EventOf<T extends AppEventType> = FindByType<AppEvent, T>;

export class ValidationError {
  constructor(public readonly reason: string) { }
}

function createEventHandler<T extends AppEventType>(eventType: T, handler: (event: EventOf<T>, state: AppState) => AppState) {
  return {
    eventType,
    handler,
  }
}

const roomCreatedHandler = createEventHandler('room_created', (event, state) => {
  return {
    ...state,
    rooms: [...state.rooms, {
      player1: event.ownerId,
      id: state.rooms.length,
    }]
  }
})

const userRegisteredHandler = createEventHandler('user_registered', (event, state) => {
  return {
    ...state,
    users: [...state.users, {
      id: event.id,
      name: event.name
    }]
  }
})

const addUserToRoomHandler = createEventHandler('user_added_to_room', (event, state) => {
  const rooms = [...state.rooms];
  const roomIndex = rooms.findIndex((room) => room.id === event.roomId);
  if (roomIndex < 0) {
    throw new ValidationError(`Room with id ${event.roomId} is not found`);
  }
  rooms[roomIndex] = {
    ...rooms[roomIndex],
    player2: event.userId,
    game: {},
  }
  return {
    ...state,
    rooms: rooms
  }
})

export const eventHandlers = [roomCreatedHandler, userRegisteredHandler, addUserToRoomHandler];