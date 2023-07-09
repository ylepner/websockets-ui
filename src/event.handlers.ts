import { AppState } from "./app.state";
import { FindByType } from "./common";
import { AppEvent, AppEventType } from "./events";

type EventOf<T extends AppEventType> = FindByType<AppEvent, T>;

function createEventHandler<T extends AppEventType>(eventType: T, handler: (event: EventOf<T>, state: AppState) => AppState) {
  return {
    eventType,
    handler,
  }
}

const roomCreatedHandler = createEventHandler('room_created', (event, state) => {
  return {
    ...state,
    rooms: [...state.rooms, {
      player1: event.ownerId
    }]
  }
})

export const eventHandlers = [roomCreatedHandler];