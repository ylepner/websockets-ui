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

export function convertGameResultToWinnersTable(
  users: User[],
  gameResults: Record<GameId, GameResult>,
): Winner[] {
  const resultArr = Object.values(gameResults);
  const userWins: Record<number, number> = {};
  for (const result of resultArr) {
    if (userWins[result.winnerId]) {
      userWins[result.winnerId] += 1;
    } else {
      userWins[result.winnerId] = 1;
    }
  }
  const result = Object.entries(userWins).map((el) => {
    const winnerName = users.find((user) => user.id === Number(el[0]))?.name!;
    const wins = userWins[Number(el[0])];
    return {
      name: winnerName,
      wins: wins,
    };
  });
  return result;
}
