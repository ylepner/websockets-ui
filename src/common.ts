import { Game, GameId, GameResult, User, UserId, Winner } from './app.state';
import { BattleshipGame, GameStatus } from './battleship-game';
import { AttackStatus } from './messages/game-messages';
import { Ship } from './messages/messages';

export type FindByType<Union, Type> = Union extends { type: Type }
  ? Union
  : never;
export type Point = [number, number];
export function getEnemy(game: Game, me: UserId) {
  return Object.keys(game.players)
    .map(Number)
    .filter((x) => x !== me)[0];
}

export function attackShip(
  ships: Ship[],
  attackList: Point[],
  attackPosition: Point,
) {
  const game = new BattleshipGame([...ships], 10);
  attackList.forEach((attack) => {
    game.playTurn({ x: attack[0], y: attack[1] });
  });
  return game.playTurn({ x: attackPosition[0], y: attackPosition[1] });
}

export function turnResultToAttackStatus(
  attackResult: GameStatus,
): AttackStatus {
  switch (attackResult.type) {
    case 'miss':
      return 'miss';
    case 'hit':
      return 'shot';
    case 'kill':
      return 'killed';
    default:
      throw new Error('invalid state');
  }
}

export function getRandomPoint(ships: Ship[], attackList: Point[]) {
  const game = new BattleshipGame([...ships], 10);
  attackList.forEach((attack) => {
    game.playTurn({ x: attack[0], y: attack[1] });
  });
  const randomShot = game.getRandomEmptyPosition();
  if (randomShot) {
    return randomShot;
  }
  return null;
}

export function convertGameResultToWinnersTable(users: User[],
  gameResults: Record<GameId, GameResult>,
): Winner[] {
  const results = gameResults;
  const resultArr = Object.values(results);
  const wins = resultArr.filter((el) => el.winnerId);
  const res = resultArr.map((el) => {
    const winnerName = users.find((user) => user.id === el.winnerId)?.name!;
    return {
      name: winnerName,
      wins: wins.length,
    };
  });
  return res;
}
