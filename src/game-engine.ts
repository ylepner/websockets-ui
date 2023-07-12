import { AppState, Game, GameId, UserId } from './app.state';
import {
  CreateGameResponse,
  EventResponse,
  InputMessage,
  RegisterRequest,
  RegisterResponse,
  UpdateRoomEvent,
} from './messages/messages';
import { StateManager } from './state-manager';
export type UserNotifyFunction = (data: EventResponse, userId: UserId) => void;
export class GameEngine {
  private readonly stateManager = new StateManager();
  private userCounter = 0;

  constructor() { }

  regUser(
    request: RegisterRequest,
    userNotifyFunction: UserNotifyFunction,
  ): {
    userId: number;
    callback: (event: InputMessage) => void;
  } {
    const userId = this.userCounter++;
    this.stateManager.publishEvent({
      type: 'user_registered',
      id: userId,
      name: request.data.name,
    });

    const registerResponse: RegisterResponse = {
      type: 'reg',
      data: {
        name: request.data.name,
        index: userId,
        error: false,
        errorText: '',
      },
      id: 0,
    };

    const notifyFn = (data: EventResponse) => {
      userNotifyFunction(data, userId);
    };

    notifyFn(registerResponse);
    notifyFn(listRooms(this.stateManager.appState, userId));
    let gameId: number | undefined;
    this.stateManager.subscribe((event, state) => {
      if (event.type === 'room_created') {
        const updatedRoomList = listRooms(state, userId);
        notifyFn(updatedRoomList);
      }
    });
    waitForUserJoinedGame(this.stateManager, userId, (game) => {
      notifyFn(listRooms(this.stateManager.appState, userId));
      gameId = game.id;
      const createGame: CreateGameResponse = {
        type: 'create_game',
        data: {
          idGame: game.id,
          idPlayer: Object.keys(game.players)
            .map(Number)
            .filter((player) => player !== userId)[0],
        },
        id: 0,
      };
      notifyFn(createGame);
      watchStartedGame(this.stateManager, gameId, (game) => {
        const otherPlayerId = Object.keys(game.players)
          .map(Number)
          .filter((player) => player !== userId)[0];
        notifyFn({
          type: 'start_game',
          data: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ships: game.players[otherPlayerId].ships!,
            currentIndexPlayer: otherPlayerId,
          },
          id: 0,
        });
      });
    });
    return {
      callback: (dataObj) => {
        if (dataObj.type === 'create_room') {
          this.stateManager.publishEvent({
            type: 'room_created',
            ownerId: userId,
          });
          return;
        }
        if (dataObj.type === 'add_user_to_room') {
          this.stateManager.publishEvent({
            type: 'user_added_to_room',
            roomId: dataObj.data.indexRoom,
            userId: userId,
          });
          return;
        }
        if (dataObj.type === 'add_ships') {
          if (gameId == null) {
            console.error(`Game with ${userId} does not exist`);
            return;
          }
          this.stateManager.publishEvent({
            type: 'ships_added',
            gameId: gameId,
            userId: userId,
            ships: dataObj.data.ships,
          });
        }
      },
      userId: userId,
    };
  }
}

function listRooms(state: AppState, userId: number): UpdateRoomEvent {
  return {
    type: 'update_room',
    id: 0,
    data: state.rooms.map((val, i) => {
      const player1 = state.users.find((x) => x.id === val.player1)!;
      return {
        roomId: val.id,
        roomUsers: [player1].map((p) => ({
          index: p!.id,
          name: p!.name,
        })),
      };
    }),
  };
}

function waitForUserJoinedGame(
  stateManager: StateManager,
  userId: UserId,
  callback: (game: Game) => void,
) {
  const unsub = stateManager.subscribe((event, state, oldState) => {
    if (state.games === oldState.games) {
      return;
    }
    const game = Object.values(state.games).find((el) => el.players[userId]);
    if (!game) {
      return;
    }
    unsub();
    callback(game);
  });
  return unsub;
}

function watchStartedGame(
  stateManager: StateManager,
  gameId: GameId,
  callback: (game: Game) => void,
) {
  return stateManager.subscribe((event, state, oldState) => {
    if (state.games === oldState.games) {
      return;
    }
    if (state.games[gameId] == oldState.games[gameId]) {
      return;
    }
    const game = state.games[gameId];
    if (
      Object.values(game.players)
        .map((x) => x.ships)
        .every((x) => x != null)
    ) {
      callback(game);
    }
  });
}
