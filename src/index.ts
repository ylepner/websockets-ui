import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { WebSocketServer, createWebSocketStream, WebSocket } from 'ws';
import { InputMessage, RegisterResponse, UpdateRoomEvent } from './messages';
import { StateManager } from './state-manager';
import { AppState } from './app.state';


export const httpServer = http.createServer(function (req, res) {
  const __dirname = path.resolve(path.dirname(''));
  const file_path = __dirname + (req.url === '/' ? '/front/index.html' : '/front' + req.url);
  fs.readFile(file_path, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});

let userCount = 0;

try {
  const WEBSOCKET_PORT = Number(process.env.WEBSOCKET_PORT) || 3000;
  const wsServer = new WebSocketServer({ port: WEBSOCKET_PORT });
  const stateManager = new StateManager();
  wsServer.on('connection', (ws) => {
    const userId = userCount++;
    let userName: string | undefined;
    stateManager.subscribe((event, state) => {
      console.log('App state updated', event, state)
      if (event.type === 'room_created' || event.type === 'user_registered') {
        const updatedRoomList = listRooms(state);
        sendMessage(updatedRoomList, ws);
        ws.send(serializeMessage(updatedRoomList))
      }
      if (event.type === 'user_added_to_room') {
        const updatedRoomList = listRooms(state);
        sendMessage(updatedRoomList, ws);
        ws.send(serializeMessage(updatedRoomList))
        // if user is added to room the room should be deleted
        console.log(`users in room:${JSON.stringify(state.users)}`)
      }
    })
    console.log('Connection received ', userId)
    const wsStream = createWebSocketStream(ws, {
      encoding: 'utf8',
      decodeStrings: false,
    });
    wsStream.on('data', (data: string) => {
      console.log(data);
      const dataObj: InputMessage = deserializeMessage(data);
      console.log(dataObj)
      if (dataObj.type === 'reg') {
        stateManager.publishEvent({
          type: 'user_registered',
          id: userId,
          name: dataObj.data.name,
        })
        const registerResponse: RegisterResponse = {
          type: 'reg',
          data: {
            name: dataObj.data.name,
            index: userCount,
            error: false,
            errorText: ''
          },
          id: 0
        }
        userName = dataObj.data.name;
        ws.send(serializeMessage(registerResponse))
      }
      if (dataObj.type === 'create_room') {
        stateManager.publishEvent({
          type: 'room_created',
          ownerId: userId
        })
      }
      if (dataObj.type === 'add_user_to_room') {
        stateManager.publishEvent({
          type: 'user_added_to_room',
          roomId: dataObj.data.indexRoom,
          userId: userId
        })
      }
    });
    wsStream.on('error', (err) => {
      console.error(err)
    });
  });
  wsServer.on('error', (err) => {
    console.error(err)
    console.log(`Websocket server closed`)
  });
  console.log(`Start websocket server on the ${WEBSOCKET_PORT} port`);
} catch (e) {
  console.error(e)
  console.log(`Server websocket err `, e);
}

function sendMessage<T extends { data: any, type: string }>(msg: T, ws: WebSocket) {
  console.log('Sending message', msg);
  ws.send(serializeMessage(msg));
}

function serializeMessage<T extends { data: any, type: string }>(obj: T) {
  const copy: any = {
    ...obj,
  }
  const data = obj.data;
  const jsonString = data ? JSON.stringify(data) : '';
  copy.data = jsonString;
  return JSON.stringify(copy);
}

function deserializeMessage<T>(input: string): T {
  let obj = JSON.parse(input);
  if (obj.data)
    obj.data = JSON.parse(obj.data);
  return obj;
}

function listRooms(state: AppState): UpdateRoomEvent {
  return {
    type: 'update_room',
    id: 0,
    data: state.rooms.map((val, i) => {
      const player1 = state.users.find(x => x.id === val.player1)!;
      const player2 = state.users.find(x => x.id === val.player2);
      return {
        roomId: val.id,
        roomUsers: [player1, player2]
          .filter(p => !!p)
          .map(p => ({
            index: p!.id,
            name: p!.name
          }))
      }
    })
  }
}

