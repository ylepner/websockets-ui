import { UserId } from "./app.state";

interface ExecutedBy {
  executedBy: UserId;
}
type RegisterUser = {
  type: 'reg_user';
  name: string;
}
type CreateRoom = {
  type: 'create_room';
}
type AddUserToRoom = {
  type: 'add_user_to_room';
  roomId: number;
}

export type AppCommand = (CreateRoom | AddUserToRoom | RegisterUser) & ExecutedBy;
export type AppCommandName = AppCommand['type'];

// (CreateRoom | AddUserToRoom) discriminated union
// type: 'create_room'; discriminator
