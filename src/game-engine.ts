import { AppState, Game, GameId, GameResult, UserId } from './app.state';
import {
  attackShip,
  convertGameResultToWinnersTable,
  getEnemy,
  getRandomPoint,
  turnResultToAttackStatus,
} from './common';
import {
  CreateGameResponse,
  EventResponse,
  InputMessage,
  RegisterRequest,
  RegisterResponse,
  UpdateRoomEvent,
} from './messages/messages';
import { UserRegMessage } from './models';
import { StateManager } from './state-manager';
export type UserNotifyFunction = (data: EventResponse, userId: UserId) => void;

export class GameEngine {
  private readonly stateManager = new StateManager();
  private userCounter = 0;

  // eslint-disable-next-line prettier/prettier, @typescript-eslint/no-empty-function
  constructor() { }

  regUser(
    request: RegisterRequest,
    userNotifyFunction: UserNotifyFunction,
  ): UserRegMessage | undefined {
    let userId: number;
    const user = this.stateManager.appState.users.find(
      (el) => el.name === request.data.name,
    );
    if (user) {
      if (user.password === request.data.password) {
        userId = user.id;
      } else {
        console.log('Wrong password');
        return undefined;
      }
    } else {
      userId = this.userCounter++;
      this.stateManager.publishEvent({
        type: 'user_registered',
        id: userId,
        name: request.data.name,
        password: request.data.password,
      });
    }

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

    if (this.stateManager.appState.gameResults) {
      const winners = convertGameResultToWinnersTable(
        this.stateManager.appState.users,
        this.stateManager.appState.gameResults,
      );
      notifyFn({
        type: 'update_winners',
        data: winners,
        id: 0,
      });
    }

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
      const unsub = watchStartedGame(this.stateManager, gameId, (game) => {
        const currentPlayer = getCurrentPlayer(this.stateManager, game);
        unsub();
        if (currentPlayer != null) {
          notifyFn({
            type: 'start_game',
            data: {
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
        watchGameEnd(this.stateManager, game.id, (gameResult) => {
          notifyFn({
            type: 'finish',
            data: {
              winPlayer: gameResult.winnerId,
            },
            id: 0,
          });
          const winners = convertGameResultToWinnersTable(
            this.stateManager.appState.users,
            this.stateManager.appState.gameResults,
          );
          notifyFn({
            type: 'update_winners',
            data: winners,
            id: 0,
          });
        });

        watchPlayersMoves(
          this.stateManager,
          game.id,
          (game, point, attacker) => {
            const otherPlayer = getEnemy(game, attacker);
            const evt = shotToEvent(game, otherPlayer, attacker, point);
            evt.forEach((el) => notifyFn(el));
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
          },
        );
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
        if (dataObj.type === 'randomAttack') {
          const ships =
            this.stateManager.appState.games[gameId].players[userId].ships!;
          const shots =
            this.stateManager.appState.games[gameId].gameState?.shots[userId];
          if (shots) {
            const shot = getRandomPoint(ships, shots)!;
            this.stateManager.publishEvent({
              type: 'attacked',
              gameId: gameId,
              playerId: userId,
              x: shot.x,
              y: shot.y,
            });
          }
        }
        if (dataObj.type === 'user_disconnected') {
          this.stateManager.publishEvent({
            type: 'user_disconnected',
            userId: userId,
          });
        }
      },
      userId: userId,
    };
  }
}

function shotToEvent(
  game: Game,
  otherPlayer: number,
  attacker: number,
  point: [number, number],
): EventResponse[] {
  const shotStatus = attackShip(
    game.players[otherPlayer].ships!,
    game.gameState!.shots[attacker],
    point,
  );
  const events: EventResponse[] = [
    {
      type: 'attack',
      data: {
        position: {
          x: point[0],
          y: point[1],
        },
        currentPlayer: attacker,
        status: turnResultToAttackStatus(shotStatus),
      },
      id: 0,
    },
  ];

  if (shotStatus.type == 'kill') {
    for (let i = 0; i < shotStatus.data.around.length; i++) {
      events.push({
        type: 'attack',
        data: {
          position: shotStatus.data.around[i],
          currentPlayer: attacker,
          status: turnResultToAttackStatus({ type: 'miss' }),
        },
        id: 0,
      });
    }
    for (let i = 0; i < shotStatus.data.shipPoints.length; i++) {
      events.push({
        type: 'attack',
        data: {
          position: shotStatus.data.shipPoints[i],
          currentPlayer: attacker,
          status: turnResultToAttackStatus({
            type: 'kill',
            data: {
              around: shotStatus.data.around,
              shipPoints: shotStatus.data.shipPoints,
            },
          }),
        },
        id: 0,
      });
    }
  }

  return events;
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
    const old = Object.values(oldState.games).find((el) => el.players[userId]);
    const game = Object.values(state.games).find((el) => el.players[userId]);
    if (!old && game) {
      callback(game);
    }
  });
  return unsub;
}

function watchStartedGame(
  stateManager: StateManager,
  gameId: GameId,
  callback: (game: Game, oldGame: Game) => void,
) {
  const unsub = stateManager.subscribe((event, state, oldState) => {
    if (state.games === oldState.games) {
      return;
    }
    if (!state.games[gameId]) {
      unsub();
      return;
    }

    if (state.games[gameId] === oldState.games[gameId]) {
      return;
    }

    const game = state.games[gameId];
    if (game.gameState) {
      callback(game, oldState.games[gameId]);
    }
  });
  return unsub;
}

function watchGameEnd(
  stateManager: StateManager,
  gameId: GameId,
  callback: (gameResult: GameResult) => void,
) {
  return stateManager.subscribe((event, state, oldState) => {
    if (!oldState.gameResults[gameId] && state.gameResults[gameId]) {
      callback(state.gameResults[gameId]);
    }
  });
}

function watchPlayersMoves(
  stateManager: StateManager,
  gameId: GameId,
  callback: (game: Game, v: [number, number], attacker: UserId) => void,
) {
  return watchStartedGame(stateManager, gameId, (game, oldGame) => {
    const shots = game.gameState?.shots;
    const shotsOldGame = oldGame.gameState?.shots;
    if (shots && shotsOldGame) {
      Object.keys(shots)
        .map(Number)
        .forEach((playerId) => {
          if (shots[playerId] > shotsOldGame[playerId]) {
            callback(oldGame, shots[playerId].at(-1)!, playerId);
          }
        });
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
