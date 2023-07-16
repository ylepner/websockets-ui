import { Ship } from './messages/messages';

interface Position {
  x: number;
  y: number;
}

interface GameShip {
  position: Position;
  direction: boolean;
  type: string;
  length: number;
  hits: number;
}

export type GameStatus =
  | { type: 'miss' }
  | { type: 'hit' }
  | { type: 'kill'; data: Position[] }
  | { type: 'game_over' }
  | { type: 'invalid_move' };

export class BattleshipGame {
  private ships: GameShip[];
  private remainingShips: number;
  private hits: Set<string>;
  boardSize: number;

  constructor(ships: Ship[], boardSize: number) {
    this.ships = ships.map((s) => ({
      ...s,
      hits: 0,
      direction: !s.direction,
    }));
    this.remainingShips = ships.length;
    this.hits = new Set<string>();
    this.boardSize = boardSize;
  }

  private checkShipCollision(position: Position): boolean {
    for (const ship of this.ships) {
      const { x, y } = ship.position;
      const { length, direction } = ship;

      if (direction) {
        for (let i = 0; i < length; i++) {
          if (x + i === position.x && y === position.y) {
            return true;
          }
        }
      } else {
        for (let i = 0; i < length; i++) {
          if (x === position.x && y + i === position.y) {
            return true;
          }
        }
      }
    }

    return false;
  }
  private updateShipStatus(ship: GameShip, position: Position): GameStatus {
    const { x, y } = ship.position;
    const { length, direction, hits } = ship;

    if (direction) {
      for (let i = 0; i < length; i++) {
        if (x + i === position.x && y === position.y) {
          ship.hits++;

          if (ship.hits === length) {
            this.remainingShips--;
            const sunkPoints: Position[] = [];
            const around = Array.from(
              pointsAround(ship, this.boardSize),
            ).filter((x) => !this.hits.has(`${x.x},${x.y}`));
            return { type: 'kill', data: around };
          }

          return { type: 'hit' };
        }
      }
    } else {
      for (let i = 0; i < length; i++) {
        if (x === position.x && y + i === position.y) {
          ship.hits++;

          if (ship.hits === length) {
            this.remainingShips--;
            const around = Array.from(
              pointsAround(ship, this.boardSize),
            ).filter((x) => !this.hits.has(`${x.x},${x.y}`));
            return { type: 'kill', data: around };
          }

          return { type: 'hit' };
        }
      }
    }

    return { type: 'miss' };
  }

  public playTurn(position: Position): GameStatus {
    const positionKey = `${position.x},${position.y}`;

    if (this.hits.has(positionKey)) {
      return { type: 'invalid_move' };
    }

    if (this.checkShipCollision(position)) {
      for (const ship of this.ships) {
        const status = this.updateShipStatus(ship, position);
        if (this.remainingShips === 0) {
          console.log('GAME_OVER')
          return { type: 'game_over' };
        }
        if (status.type === 'hit' || status.type === 'kill') {
          this.hits.add(positionKey);
          return status;
        }
      }
    } else {
      this.hits.add(positionKey);
    }

    return { type: 'miss' };
  }

  public getRandomEmptyPosition(): Position | null {
    const emptyPositions: Position[] = [];

    for (let x = 0; x < this.boardSize; x++) {
      for (let y = 0; y < this.boardSize; y++) {
        const position: Position = { x, y };

        if (!this.checkShipCollision(position) && !this.hits.has(`${x},${y}`)) {
          emptyPositions.push(position);
        }
      }
    }

    if (emptyPositions.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * emptyPositions.length);
    return emptyPositions[randomIndex];
  }
}

export function* pointsAround(ship: GameShip, boardSize: number) {
  function toVector(p: { x: number; y: number }): [number, number] {
    return [p.x, p.y];
  }
  const k = ship.direction ? 0 : 1;
  for (const offset of [-1, 0, 1]) {
    const otherCoord = toVector(ship.position)[(k + 1) % 2] + offset;
    if (otherCoord < 0 || otherCoord > boardSize) {
      continue;
    }
    for (let i = -1; i < ship.length + 1; i++) {
      const coord = toVector(ship.position)[k] + i;
      if (coord < 0 || coord > boardSize) {
        continue;
      }
      if (offset === 0) {
        if (i !== -1 && i !== ship.length) {
          continue;
        }
      }
      const res = [0, 0];
      res[k] = coord;
      (res[(k + 1) % 2] = toVector(ship.position)[(k + 1) % 2] + offset),
        yield {
          x: res[0],
          y: res[1],
        };
    }
  }
}
