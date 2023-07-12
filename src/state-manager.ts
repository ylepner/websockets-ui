import { AppState, Game, GameId, UserId } from "./app.state";
import { ValidationError, eventHandlers } from "./event.handlers";
import { AppEvent } from "./events";
export interface StateUpdate {
  event: AppEvent;
  state: AppState;
  oldState: AppState;
}
export class StateManager {
  appState: AppState = {
    rooms: [],
    users: [],
    games: {}
  };

  private subscribers: Array<(event: AppEvent, state: AppState, oldState: AppState) => void> = [];

  publishEvent(event: AppEvent) {

    let nextState: AppState | undefined;
    try {
      console.log('Prev state: ', this.appState);
      nextState = eventHandlers.find(x => x.eventType === event.type)?.handler(event as any, this.appState);
    } catch (e) {
      if (e instanceof ValidationError) {
        console.error(`Cannot execute event ${event.type} because ${e.reason}`)
        console.error(e.reason);
      }
      return;
    }

    if (!nextState) {
      console.error('Event handler is not found for event', event);
      return;
    }

    console.log(`Executed event: ${event.type}`)
    console.log('Next state: ', nextState);
    const oldState = this.appState;
    this.appState = nextState;

    this.subscribers.forEach(sub => sub(event, this.appState, oldState));
  }

  subscribe(fn: (event: AppEvent, state: AppState, oldState: AppState) => void) {
    this.subscribers.push(fn);
    return () => this.subscribers = this.subscribers.filter(x => x !== fn);
  }
}
function watchGame(gameId: GameId, gameChanged: (game: Game) => void) {
  return (event: AppEvent, state: AppState, oldState: AppState) => {
    if (state.games[gameId] !== state.games[gameId]) {
      gameChanged(state.games[gameId])
    }
  }
}
/* 
function watchPlayerGame(playerId: UserId) {
  return (event: AppEvent, state: AppState, oldState: AppState) => {
    const game = Object.values(state.games).find(x => x.player1 === playerId && x.player2 === playerId);
    if (game) {
      return watchGame(game.id, (game) => {

      })
    }
  }
}

const sm = new StateManager();


const unsub = sm.subscribe(watchGame(42, (game) => {
  if (!game) {
    unsub();
  }
  if (game.player1Ships && game.player2Ships) {
    unsub();
  }
}))

 */