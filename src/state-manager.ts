import { AppState } from "./app.state";
import { ValidationError, eventHandlers } from "./event.handlers";
import { AppEvent } from "./events";

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
  }
}