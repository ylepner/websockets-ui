import { validate } from 'uuid';
import { AppState, Game } from './app.state';
import { FindByType, getEnemy } from './common';
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
    if (state.rooms.find((el) => el.player1 === event.ownerId)) {
      throw new ValidationError('User can create only one room');
    }
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
    // if user is already in db
    const user = state.users.find((el) => el.name === event.name);
    if (user) {
      if (user.password != event.password) {
        throw new ValidationError('Password is incorrect');
      }
    }
    return {
      ...state,
      users: [
        ...state.users,
        {
          id: event.id,
          name: event.name,
          password: event.password,
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
    if (room.player1 === event.userId) {
      throw new ValidationError(`User can't be added to his own room`);
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
  const game: Game = {
    ...state.games[event.gameId],
    players: {
      ...state.games[event.gameId].players,
      [event.userId]: {
        ships: ships,
      },
    },
  };
  const player1 = Number(Object.keys(game.players)[0]);
  const player2 = Number(Object.keys(game.players)[1]);
  if (
    Object.values(game.players)
      .map((x) => x.ships)
      .every((x) => x != null)
  ) {
    game.gameState = {
      currentPlayer: player1,
      shots: {
        [player1]: [],
        [player2]: [],
      },
    };
  }

  return {
    ...state,
    games: {
      ...state.games,
      [event.gameId]: game,
    },
  };
});

const attacked = createEventHandler('attacked', (event, state) => {
  const gameId = state.games[event.gameId];
  if (!gameId.gameState) {
    return state;
  }
  if (event.playerId === gameId.gameState.currentPlayer) {
    const game: Game = {
      ...gameId,
      gameState: {
        shots: {
          ...gameId.gameState.shots,
          [event.playerId]: [
            ...gameId.gameState.shots[event.playerId],
            [event.x, event.y],
          ],
        },
        currentPlayer: getEnemy(gameId, event.playerId),
      },
    };
    return {
      ...state,
      games: {
        ...state.games,
        [event.gameId]: game,
      },
    };
  }
  return state;
});

export const eventHandlers = [
  roomCreatedHandler,
  userRegisteredHandler,
  addUserToRoomHandler,
  shipsAdded,
  attacked,
];
