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
