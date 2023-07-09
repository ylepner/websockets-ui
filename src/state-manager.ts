import { AppState } from "./app.state";
import { commandHandlers } from "./command.handlers";
import { AppCommand } from "./commands";
import { eventHandlers } from "./event.handlers";
import { AppEvent } from "./events";

export class StateManager {
  appState: AppState = {
    rooms: [],
    users: []
  };

  private subscribers: Array<(event: AppEvent, state: AppState) => void> = [];

  executeCommand(command: AppCommand) {
    const event = commandHandlers.find(x => x.name === command.type)?.handler(command, this.appState);
    if (!event) {
      console.error('Cannot find command handler for command', command);
      return;
    }
    const nextState = eventHandlers.find(x => x.eventType === event.type)?.handler(event as any, this.appState);
    if (!nextState) {
      console.error('Event handler is not found for command, event', command, event);
      return;
    }

    console.log('Prev state: ', this.appState);
    console.log(`Executed command: ${command.type}, event: ${event.type}`)
    console.log('Next state: ', nextState);


    this.appState = nextState;

    this.subscribers.forEach(sub => sub(event, this.appState));
  }

  subscribe(fn: (event: AppEvent, state: AppState) => void) {
    this.subscribers.push(fn);
  }
}