import { AppState, UserId } from './app.state';
import { AppCommand, AppCommandName } from './commands';
import { FindByType } from './common';
import * as events from './events';


type CommandOf<T extends AppCommandName> = FindByType<AppCommand, T>;

class ValidationError {
  constructor(public readonly reason: string) { }
}

function createCommandHandler<T extends AppCommandName>(name: T, handler: (command: CommandOf<T>, state: AppState) => events.AppEvent): {
  name: AppCommandName,
  handler: (command: any, state: AppState) => events.AppEvent
} {
  return {
    name,
    handler,
  };
}

const createRoomHandler = createCommandHandler('create_room', (command, state) => {
  if (state.rooms.find(x => x.player1 === command.userId && x.player2 === command.userId)) {
    throw new ValidationError('player already joined room or game');
  }
  return {
    type: 'room_created',
    ownerId: command.userId
  }
});

const registerUserCommand = createCommandHandler('reg_user', (command, state) => {
  return {
    type: 'user_registered',
    id: command.userId,
    name: command.name
  }
})

export const commandHandlers = [createRoomHandler, registerUserCommand];