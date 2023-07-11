import { User, UserId } from "./app.state";

export interface RoomCreated {
  type: 'room_created';
  ownerId: UserId;
}

export interface UserRegistered {
  type: 'user_registered';
  name: string;
  id: UserId;
}

export interface UserAddedToRoom {
  type: 'user_added_to_room';
  roomId: number;
  userId: UserId;
}

export interface RoomUpdated {
  type: 'room_updated';
  roomId: number;
  users: User[];
}

export type AppEvent = RoomCreated | UserRegistered | UserAddedToRoom | RoomUpdated;
export type AppEventType = AppEvent['type'];