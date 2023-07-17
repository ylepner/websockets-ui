import { InputMessage } from './messages/messages';

export interface Info {
  callback: (data: InputMessage) => void | undefined;
  userId: number;
}

export interface UserRegMessage {
  userId: number;
  callback: (event: InputMessage) => void;
}
