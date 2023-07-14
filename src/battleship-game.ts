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
            for (let j = 0; j < length; j++) {
              const point = { x: x + j, y };
              this.hits.add(`${point.x},${point.y}`);
              sunkPoints.push(point);
              if (y > 0) {
                const leftPoint = { x: x + j, y: y - 1 };
                if (!this.checkShipCollision(leftPoint) && !this.hits.has(`${leftPoint.x},${leftPoint.y}`)) {
                  this.hits.add(`${leftPoint.x},${leftPoint.y}`);
                  sunkPoints.push(leftPoint);
                }
              }
              if (y < this.boardSize - 1) {
                const rightPoint = { x: x + j, y: y + 1 };
                if (!this.checkShipCollision(rightPoint) && !this.hits.has(`${rightPoint.x},${rightPoint.y}`)) {
                  this.hits.add(`${rightPoint.x},${rightPoint.y}`);
                  sunkPoints.push(rightPoint);
                }
              }
            }
            return { type: 'kill', data: sunkPoints };
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
            const sunkPoints: Position[] = [];
            for (let j = 0; j < length; j++) {
              const point = { x, y: y + j };
              this.hits.add(`${point.x},${point.y}`);
              sunkPoints.push(point);
              if (x > 0) {
                const topPoint = { x: x - 1, y: y + j };
                if (!this.checkShipCollision(topPoint) && !this.hits.has(`${topPoint.x},${topPoint.y}`)) {
                  this.hits.add(`${topPoint.x},${topPoint.y}`);
                  sunkPoints.push(topPoint);
                }
              }
              if (x < this.boardSize - 1) {
                const bottomPoint = { x: x + 1, y: y + j };
                if (!this.checkShipCollision(bottomPoint) && !this.hits.has(`${bottomPoint.x},${bottomPoint.y}`)) {
                  this.hits.add(`${bottomPoint.x},${bottomPoint.y}`);
                  sunkPoints.push(bottomPoint);
                }
              }
            }
            return { type: 'kill', data: sunkPoints };
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
        if (status.type === 'hit' || status.type === 'kill') {
          this.hits.add(positionKey);
          return status;
        }
      }
    } else {
      this.hits.add(positionKey);
    }

    return this.remainingShips === 0 ? { type: 'game_over' } : { type: 'miss' };
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
