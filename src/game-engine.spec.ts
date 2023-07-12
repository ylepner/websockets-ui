import { expect } from 'chai';
import { GameEngine, UserNotifyFunction } from './game-engine';
import { EventResponse } from './messages';
import { UserId } from './app.state';

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

describe('Game engine', () => {
  it('should register 2 players', () => {
    const gameEngine = new GameEngine();
    let afterResponse: any;
    const user1Reg = gameEngine.regUser(messages[0].data, (reponse) => {
      afterResponse = reponse;
    });
    expect(afterResponse).to.be.deep.eq(messages[1].data);
    let userRegResponse: any;
    const user2Reg = gameEngine.regUser(messages[2].data, (response) => {
      userRegResponse = response;
    });

    console.log(afterResponse);
  });

  it('2nd should get list of rooms after joining', () => {
    const gameEngine = new GameEngine();
    const info = usersRegistered1CreatedRoom(gameEngine);
    const lastEvent = info.messagesLog.at(-1);
    expect(lastEvent?.userId).to.be.eq(1);
    expect(lastEvent!.event.type).to.be.eq('update_room');
  })
});
