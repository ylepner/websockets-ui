import { InputMessage } from "./messages/messages";

export interface Info {
  callback: (data: InputMessage) => void | undefined;
  userId: number;
}
