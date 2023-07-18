import { expect } from 'chai';
import { GameShip, getShipPoints, pointsAround } from './battleship-game';

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const arr = Array.from(result);
  });
});

it('should return points of a ship', () => {
  const ships: GameShip[] = [
    {
      position: { x: 2, y: 1 },
      direction: false,
      type: 'large',
      length: 3,
      hits: 3,
    },
    {
      position: { x: 0, y: 0 },
      direction: true,
      type: 'large',
      length: 3,
      hits: 3,
    },
    {
      position: { x: 1, y: 4 },
      direction: true,
      type: 'medium',
      length: 2,
      hits: 2,
    },
  ];
  const result = getShipPoints(ships[0]);
  expect(result).to.be.deep.eq([
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 2, y: 3 },
  ]);
});
