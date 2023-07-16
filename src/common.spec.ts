import { expect } from 'chai';
import { GameId, GameResult, User } from './app.state';
import { convertGameResultToWinnersTable } from './common';
describe('Convert game results to winner table', () => {
  it('should return wins of users', () => {
    const users: User[] = [
      {
        name: 'Peter',
        id: 0,
        password: '12345',
      },
      {
        name: 'John',
        id: 1,
        password: '123456',
      },
    ];
    const gameResults: Record<GameId, GameResult> = {
      0: {
        gameId: 0,
        winnerId: 0,
        looserId: 1,
      },
      1: {
        gameId: 1,
        winnerId: 0,
        looserId: 1,
      },
      2: {
        gameId: 2,
        winnerId: 1,
        looserId: 0,
      },
    };
    const result = convertGameResultToWinnersTable(users, gameResults);
    expect(result).to.be.deep.eq([
      {
        name: 'Peter',
        wins: 2,
      },
      {
        name: 'John',
        wins: 1,
      },
    ]);
  });
});

