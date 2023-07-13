import { Game, UserId } from "./app.state";

export type FindByType<Union, Type> = Union extends { type: Type } ? Union : never;

export function getEnemy(game: Game, me: UserId) {
  return Object.keys(game.players)
    .map(Number)
    .filter((x) => x !== me)[0];
}
