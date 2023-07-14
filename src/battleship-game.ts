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

export type GameStatus = 'miss' | 'hit' | 'kill' | 'game_over' | 'invalid_move';

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
            return 'kill';
          }

          return 'hit';
        }
      }
    } else {
      for (let i = 0; i < length; i++) {
        if (x === position.x && y + i === position.y) {
          ship.hits++;

          if (ship.hits === length) {
            this.remainingShips--;
            return 'kill';
          }

          return 'hit';
        }
      }
    }

    return 'miss';
  }

  public playTurn(position: Position): GameStatus {
    const positionKey = `${position.x},${position.y}`;

    if (this.hits.has(positionKey)) {
      return 'invalid_move';
    }

    if (this.checkShipCollision(position)) {
      for (const ship of this.ships) {
        const status = this.updateShipStatus(ship, position);
        if (status === 'hit' || status === 'kill') {
          this.hits.add(positionKey);
          return status;
        }
      }
    } else {
      this.hits.add(positionKey);
    }

    return this.remainingShips === 0 ? 'game_over' : 'miss';
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
