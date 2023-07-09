import { UserId } from "./app.state";

export interface RoomCreated {
  type: 'room_created';
  ownerId: UserId;
}

export interface UserRegistered {
  type: 'user_registered';
  name: string;
  id: UserId;
}

export type AppEvent = RoomCreated | UserRegistered;
export type AppEventType = AppEvent['type'];