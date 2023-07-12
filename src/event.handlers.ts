import { AppState } from './app.state';
import { FindByType } from './common';
import { AppEvent, AppEventType } from './events';

type EventOf<T extends AppEventType> = FindByType<AppEvent, T>;

export class ValidationError {
  constructor(public readonly reason: string) { }
}

function createEventHandler<T extends AppEventType>(
  eventType: T,
  handler: (event: EventOf<T>, state: AppState) => AppState,
) {
  return {
    eventType,
    handler,
  };
}
let roomCounter = 0;
const roomCreatedHandler = createEventHandler(
  'room_created',
  (event, state) => {
    return {
      ...state,
      rooms: [
        ...state.rooms,
        {
          player1: event.ownerId,
          id: roomCounter++,
        },
      ],
    };
  },
);

const userRegisteredHandler = createEventHandler(
  'user_registered',
  (event, state) => {
    return {
      ...state,
      users: [
        ...state.users,
        {
          id: event.id,
          name: event.name,
        },
      ],
    };
  },
);

const addUserToRoomHandler = createEventHandler(
  'user_added_to_room',
  (event, state) => {
    const rooms = [...state.rooms];
    const room = rooms.find((room) => room.id === event.roomId);
    if (!room) {
      throw new ValidationError(`Room with id ${event.roomId} is not found`);
    }
    const roomId = room.id;
    return {
      ...state,
      games: {
        ...state.games,
        [roomId]: {
          id: roomId,
          ownerId: room.player1,
          players: {
            [room.player1]: {},
            [event.userId]: {},
          },
        },
      },
      rooms: rooms.filter((el) => el !== room),
    };
  },
);

const shipsAdded = createEventHandler('ships_added', (event, state) => {
  const ships = event.ships;
  return {
    ...state,
    games: {
      ...state.games,
      [event.gameId]: {
        ...state.games[event.gameId],
        players: {
          ...state.games[event.gameId].players,
          [event.userId]: {
            ships: ships,
          },
        },
      },
    },
  };
});

export const eventHandlers = [
  roomCreatedHandler,
  userRegisteredHandler,
  addUserToRoomHandler,
  shipsAdded,
];
