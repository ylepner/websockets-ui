/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';
import { GameEngine, UserNotifyFunction } from './game-engine';
import { CreateGameResponse, EventResponse, UpdateRoomEvent } from './messages/messages';
import { UserId } from './app.state';
import { connect } from 'http2';
import { resourceUsage } from 'process';

const messages: any[] = [
  {
    type: 'in',
    data: {
      type: 'reg',
      data: { name: '1111111111111111', password: '11111111111111' },
      id: 0,
    },
  },
  {
    type: 'out',
    data: {
      type: 'reg',
      data: {
        name: '1111111111111111',
        index: 0,
        error: false,
        errorText: '',
      },
      id: 0,
    },
    userId: 0,
  },
  {
    type: 'in',
    data: {
      type: 'reg',
      data: { name: '2222222222222', password: '2222222222222222' },
      id: 0,
    },
  },
  {
    type: 'out',
    data: { type: 'update_room', id: 0, data: [] },
    userId: 0,
  },
  {
    type: 'out',
    data: {
      type: 'reg',
      data: {
        name: '2222222222222',
        index: 1,
        error: false,
        errorText: '',
      },
      id: 0,
    },
    userId: 1,
  },
  { type: 'in', data: { type: 'create_room', data: '', id: 0 } },
  {
    type: 'out',
    data: {
      type: 'update_room',
      id: 0,
      data: [{ roomId: 0, roomUsers: [{ index: 1, name: '2222222222222' }] }],
    },
    userId: 0,
  },
  {
    type: 'out',
    data: {
      type: 'update_room',
      id: 0,
      data: [{ roomId: 0, roomUsers: [{ index: 1, name: '2222222222222' }] }],
    },
    userId: 1,
  },
  { type: 'in', data: { type: 'create_room', data: '', id: 0 } },
  {
    type: 'out',
    data: {
      type: 'update_room',
      id: 0,
      data: [
        { roomId: 0, roomUsers: [{ index: 1, name: '2222222222222' }] },
        {
          roomId: 1,
          roomUsers: [{ index: 0, name: '1111111111111111' }],
        },
      ],
    },
    userId: 0,
  },
  {
    type: 'out',
    data: {
      type: 'update_room',
      id: 0,
      data: [
        { roomId: 0, roomUsers: [{ index: 1, name: '2222222222222' }] },
        {
          roomId: 1,
          roomUsers: [{ index: 0, name: '1111111111111111' }],
        },
      ],
    },
    userId: 1,
  },
];

function usersRegistered1CreatedRoom(gameEngine: GameEngine) {
  const messagesLog: Array<{ event: EventResponse; userId: UserId }> = [];
  const userNotify: UserNotifyFunction = (event, userId) => {
    messagesLog.push({
      event,
      userId,
    });
  };
  const connection1 = gameEngine.regUser(
    {
      type: 'reg',
      data: {
        name: 'TestUser1',
        password: '1234567',
      },
      id: 0,
    },
    userNotify,
  );
  connection1.callback({
    type: 'create_room',
    data: '',
    id: 0,
  });
  const connection2 = gameEngine.regUser(
    {
      type: 'reg',
      data: {
        name: 'TestUser2',
        password: '1234567',
      },
      id: 0,
    },
    userNotify,
  );
  return {
    connection1,
    connection2,
    messagesLog,
  };
}

function player2JoinedPlayer1(gameEngine: GameEngine) {
  const info = usersRegistered1CreatedRoom(gameEngine);
  info.connection2.callback({
    type: 'add_user_to_room',
    data: {
      indexRoom: (
        info.messagesLog
          .filter((x) => x.userId === info.connection2.userId)
          .at(-1)!.event as UpdateRoomEvent
      ).data[0].roomId,
    },
    id: 0,
  });
  return info;
}

function bothPlayersAddedShips(gameEngine: GameEngine) {
  const result = player2JoinedPlayer1(gameEngine);
  result.connection1.callback({
    type: 'add_ships',
    data: {
      gameId: 0,
      ships: [
        {
          position: { x: 6, y: 5 },
          direction: true,
          type: 'huge',
          length: 4,
        },
        {
          position: { x: 2, y: 0 },
          direction: true,
          type: 'large',
          length: 3,
        },
        {
          position: { x: 6, y: 0 },
          direction: true,
          type: 'large',
          length: 3,
        },
        {
          position: { x: 1, y: 6 },
          direction: false,
          type: 'medium',
          length: 2,
        },
        {
          position: { x: 2, y: 8 },
          direction: true,
          type: 'medium',
          length: 2,
        },
        {
          position: { x: 8, y: 8 },
          direction: false,
          type: 'medium',
          length: 2,
        },
        {
          position: { x: 2, y: 4 },
          direction: true,
          type: 'small',
          length: 1,
        },
        {
          position: { x: 0, y: 2 },
          direction: false,
          type: 'small',
          length: 1,
        },
        {
          position: { x: 4, y: 5 },
          direction: false,
          type: 'small',
          length: 1,
        },
        {
          position: { x: 8, y: 0 },
          direction: true,
          type: 'small',
          length: 1,
        },
      ],
      indexPlayer: 0,
    },
    id: 0,
  });
  result.connection2.callback({
    type: 'add_ships',
    data: {
      gameId: 0,
      ships: [
        {
          position: { x: 2, y: 7 },
          direction: false,
          type: 'huge',
          length: 4,
        },
        {
          position: { x: 7, y: 3 },
          direction: true,
          type: 'large',
          length: 3,
        },
        {
          position: { x: 0, y: 0 },
          direction: true,
          type: 'large',
          length: 3,
        },
        {
          position: { x: 1, y: 4 },
          direction: true,
          type: 'medium',
          length: 2,
        },
        {
          position: { x: 9, y: 2 },
          direction: true,
          type: 'medium',
          length: 2,
        },
        {
          position: { x: 3, y: 4 },
          direction: false,
          type: 'medium',
          length: 2,
        },
        {
          position: { x: 0, y: 8 },
          direction: true,
          type: 'small',
          length: 1,
        },
        {
          position: { x: 9, y: 0 },
          direction: true,
          type: 'small',
          length: 1,
        },
        {
          position: { x: 6, y: 0 },
          direction: true,
          type: 'small',
          length: 1,
        },
        {
          position: { x: 6, y: 9 },
          direction: true,
          type: 'small',
          length: 1,
        },
      ],
      indexPlayer: 1,
    },
    id: 0,
  });
  return result;
}
describe('Game engine', () => {
  it('2nd should get list of rooms after joining', () => {
    const gameEngine = new GameEngine();
    const info = usersRegistered1CreatedRoom(gameEngine);
    const lastEvent = info.messagesLog.at(-1);
    expect(lastEvent?.userId).to.be.eq(1);
    expect(lastEvent!.event.type).to.be.eq('update_room');
  });

  it('2 players should get message create_game after 2nd joined room', () => {
    const gameEngine = new GameEngine();
    const result = player2JoinedPlayer1(gameEngine);
    const user1Msg = result.messagesLog.filter(
      (x) => x.userId === result.connection1.userId,
    );
    const user2Msg = result.messagesLog.filter(
      (x) => x.userId === result.connection2.userId,
    );
    expect(user1Msg.at(-1)!.event.type).to.be.eq('create_game');
    expect(user2Msg.at(-1)!.event.type).to.be.eq('create_game');
    const gameId = result.messagesLog[0].event.id;
    expect(user2Msg.at(-1)!.event.id && user2Msg.at(-1)!.event.id).to.be.eq(
      gameId,
    );
    const event2 = user1Msg.at(-1)!.event as CreateGameResponse;
    const event1 = user2Msg.at(-1)!.event as CreateGameResponse;
    const player2Id = event1.data.idPlayer;
    const player1Id = event2.data.idPlayer;
    expect(player2Id).to.be.eq(result.connection1.userId);
    expect(player1Id).to.be.eq(result.connection2.userId);
  });

  it('should send start game if 2 players added ships', () => {
    const gameEngine = new GameEngine();
    const result = bothPlayersAddedShips(gameEngine);
    const lastMessage1 = result.messagesLog.at(-1)?.event.type;
    const lastMessage2 = result.messagesLog.at(-2)?.event.type;
    expect(lastMessage1).to.be.eq('start_game');
    expect(lastMessage2).to.be.eq('start_game');
    const user1Msg = result.messagesLog.filter(
      (x) => x.userId === result.connection1.userId,
    );
    const user2Msg = result.messagesLog.filter(
      (x) => x.userId === result.connection2.userId,
    );
    expect(user1Msg.at(-1)!.event.type).to.be.eq('start_game');
    expect(user2Msg.at(-1)!.event.type).to.be.eq('start_game');
  });
});
