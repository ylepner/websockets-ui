/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ppid } from 'process';
import { AppState, Game, GameId, User, UserId } from './app.state';
import { getEnemy } from './common';
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
      password: request.data.password,
    });
    // проверить если юзер появился
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
          idPlayer: userId,
        },
        id: 0,
      };
      notifyFn(createGame);
      const eventForGameStartedUnsub = watchStartedGame(
        this.stateManager,
        gameId,
        (game) => {
          const currentPlayer = getCurrentPlayer(this.stateManager, game);
          if (currentPlayer != null) {
            notifyFn({
              type: 'start_game',
              data: {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ships: game.players[currentPlayer].ships!,
                currentIndexPlayer: currentPlayer,
              },
              id: 0,
            });
            notifyFn({
              type: 'turn',
              data: {
                currentPlayer: currentPlayer,
              },
              id: 0,
            });
          }
          // game started, not to need to subscribe for changes
          eventForGameStartedUnsub();

          // check the attack and send to enemy
          watchPlayersMoves(this.stateManager, game.id, (point, attacker) => {
            notifyFn({
              type: 'attack',
              data: {
                position: {
                  x: point[0],
                  y: point[1],
                },
                currentPlayer: attacker,
                status: 'miss',
              },
              id: 0,
            });
          });

          watchGameTurn(this.stateManager, game.id, () => {
            const currentPlayer = getCurrentPlayer(this.stateManager, game);
            if (currentPlayer != null) {
              notifyFn({
                type: 'turn',
                data: {
                  currentPlayer: currentPlayer,
                },
                id: 0,
              });
            }
          });
        },
      );
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
        if (gameId == null) {
          console.error(`Game with ${userId} does not exist`);
          return;
        }
        if (dataObj.type === 'add_ships') {
          this.stateManager.publishEvent({
            type: 'ships_added',
            gameId: gameId,
            userId: userId,
            ships: dataObj.data.ships,
          });
        }
        if (dataObj.type === 'attack') {
          this.stateManager.publishEvent({
            type: 'attacked',
            gameId: gameId,
            playerId: userId,
            x: dataObj.data.x,
            y: dataObj.data.y,
          });
        }
      },
      userId: userId,
    };
  }
}

function listRooms(state: AppState, userId: UserId): UpdateRoomEvent {
  return {
    type: 'update_room',
    id: 0,
    data: state.rooms.map((val) => {
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
  callback: (game: Game, oldGame: Game) => void,
) {
  return stateManager.subscribe((event, state, oldState) => {
    if (state.games === oldState.games) {
      return;
    }
    if (state.games[gameId] == oldState.games[gameId]) {
      return;
    }
    const game = state.games[gameId];
    if (game.gameState) {
      callback(game, oldState.games[gameId]);
    }
  });
}

function watchPlayersMoves(
  stateManager: StateManager,
  gameId: GameId,
  callback: (v: [number, number], attacker: UserId) => void,
) {
  return watchStartedGame(stateManager, gameId, (game, oldGame) => {
    const shots = game.gameState?.shots;
    const shotsOldGame = oldGame.gameState?.shots;
    if (shots && shotsOldGame) {
      Object.keys(shots)
        .map(Number)
        .forEach((playerId) => {
          if (shots[playerId] > shotsOldGame[playerId]) {
            callback(shots[playerId].at(-1)!, playerId);
          }
        });
    }
  });
}

// check if change turn
function watchGameTurn(
  stateManager: StateManager,
  gameId: GameId,
  callback: (playerId: UserId) => void,
) {
  return watchStartedGame(stateManager, gameId, (game, oldGame) => {
    if (oldGame.gameState?.currentPlayer !== game.gameState?.currentPlayer) {
      callback(game.gameState?.currentPlayer!);
    }
  });
}

function getCurrentPlayer(stateManager: StateManager, game: Game) {
  const currentPlayer =
    stateManager.appState.games[game.id].gameState?.currentPlayer;
  if (currentPlayer != null) {
    return currentPlayer;
  }
  return null;
}
