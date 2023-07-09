import { UserId } from "./app.state";

export interface RoomCreated {
  type: 'room_created';
  ownerId: UserId;
}

export type AppEvent = RoomCreated;
export type AppEventType = AppEvent['type'];