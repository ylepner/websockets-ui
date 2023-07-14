import { expect } from 'chai';
import { pointsAround } from './battleship-game';

describe('points around function', () => {
  it('should return points around horizontal ship', () => {
    const result = pointsAround(
      {
        direction: true,
        hits: 0,
        length: 2,
        position: {
          x: 1,
          y: 3,
        },
        type: '',
      },
      9,
    );
    const arr = Array.from(result);
    const expected = [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [0, 3],
      [3, 3],
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
    ];
    expect(arr).to.be.deep.eq(
      expected.map((v) => ({
        x: v[0],
        y: v[1],
      })),
    );
  });

  it('should handle hip on the border', () => {
    const result = pointsAround(
      {
        direction: true,
        hits: 0,
        length: 3,
        position: {
          x: 7,
          y: 0,
        },
        type: '',
      },
      9,
    );
    const arr = Array.from(result);

  })
});
