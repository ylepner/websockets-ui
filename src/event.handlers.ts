import { validate } from 'uuid';
import { AppState, Game } from './app.state';
import { FindByType, attackShip, getEnemy } from './common';
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
  const game = state.games[event.gameId];

  if (!game.gameState) {
    return state;
  }
  if (event.playerId === game.gameState.currentPlayer) {
    const otherPlayer = getEnemy(game, event.playerId);
    const attackResult = attackShip(
      game.players[otherPlayer].ships!,
      game.gameState.shots[event.playerId],
      [event.x, event.y],
    );
    if (attackResult.type === 'invalid_move') {
      throw new ValidationError('invalid move');
    }

    const nextState: Game = {
      ...game,
      gameState: {
        shots: {
          ...game.gameState.shots,
          [event.playerId]: [
            ...game.gameState.shots[event.playerId],
            [event.x, event.y],
          ],
        },
        currentPlayer: getEnemy(game, event.playerId),
      },
    };

    if (attackResult.type === 'hit' || attackResult.type === 'kill') {
      nextState.gameState!.currentPlayer = event.playerId;
    }

    if (attackResult.type === 'game_over') {
      const winner = state.games[event.gameId].gameState?.currentPlayer!;
      const looser = getEnemy(game, winner);
      const result: AppState = {
        ...state,
        gameResults: {
          ...state.gameResults,
          [event.gameId]: {
            gameId: event.gameId,
            winnerId: winner,
            looserId: looser,
          },
        },
      };
      delete result.games[event.gameId];
      return result;
    }
    return {
      ...state,
      games: {
        ...state.games,
        [event.gameId]: nextState,
      },
    };
  }
  return state;
});

const userDisconnected = createEventHandler(
  'user_disconnected',
  (event, state) => {
    const game = Object.values(state.games).find(
      (el) => el.players[event.userId],
    );
    if (game) {
      const winner = getEnemy(game, event.userId);
      const looser = event.userId;
      const result: AppState = {
        ...state,
        gameResults: {
          ...state.gameResults,
          [game.id]: {
            gameId: game.id,
            winnerId: winner,
            looserId: looser,
          },
        },
      };
      delete result.games[game.id];
      return result;
    }
    return state;
  },
);

export const eventHandlers = [
  roomCreatedHandler,
  userRegisteredHandler,
  addUserToRoomHandler,
  shipsAdded,
  attacked,
  userDisconnected,
];
