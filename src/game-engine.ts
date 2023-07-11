import { AppState, UserId } from "./app.state";
import { CreateGameResponse, EventResponse, InputMessage, RegisterRequest, RegisterResponse, UpdateRoomEvent } from "./messages";
import { StateManager } from "./state-manager";

export class GameEngine {
  private readonly stateManager = new StateManager();
  static userCounter = 0;

  constructor() {

  }

  regUser(request: RegisterRequest, userNotifyFunction: (data: EventResponse) => void): (event: InputMessage) => void {
    const userId = GameEngine.userCounter++;
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
        errorText: ''
      },
      id: 0
    }
    userNotifyFunction(registerResponse);

    let gameId: number | undefined;
    this.stateManager.subscribe((event, state) => {
      if (event.type === 'room_created' || event.type === 'user_registered') {
        const updatedRoomList = listRooms(state, userId);
        userNotifyFunction(updatedRoomList);
      }
      if (event.type === 'user_added_to_room') {
        const updatedRoomList = listRooms(state, userId);
        const game = Object.values(state.games)[0];
        const players = Object.keys(game.players).map(Number)
        if (players.includes(userId)) {
          const createGame: CreateGameResponse = {
            type: 'create_game',
            data: {
              idGame: game.id,
              idPlayer: players.filter((player) => player !== userId)[0]
            },
            id: 0
          }
          userNotifyFunction(createGame)
          gameId = game.id;
        }
        userNotifyFunction(updatedRoomList);
      }
    })

    return (dataObj) => {
      if (dataObj.type === 'create_room') {
        this.stateManager.publishEvent({
          type: 'room_created',
          ownerId: userId
        })
      }
      if (dataObj.type === 'add_user_to_room') {
        this.stateManager.publishEvent({
          type: 'user_added_to_room',
          roomId: dataObj.data.indexRoom,
          userId: userId
        })
      }
      if (dataObj.type === 'add_ships') {
        if (gameId == null) {
          console.error(`Game with ${userId} does not exist`);
          return
        }
        this.stateManager.publishEvent({
          type: 'ships_added',
          gameId: gameId,
          userId: userId,
          ships: dataObj.data.ships,
        });
      }
    }
  }

}

function listRooms(state: AppState, userId: number): UpdateRoomEvent {
  return {
    type: 'update_room',
    id: 0,
    data: state.rooms.map((val, i) => {
      const player1 = state.users.find(x => x.id === val.player1)!;
      return {
        roomId: val.id,
        roomUsers: [player1]
          .map(p => ({
            index: p!.id,
            name: p!.name
          }))
      }
    })
  }
}