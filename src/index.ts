import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { WebSocketServer, createWebSocketStream, WebSocket } from 'ws';
import { InputMessage } from './messages/messages';
import { GameEngine } from './game-engine';
import { UserId } from './app.state';
import { Info } from './models';

export const httpServer = http.createServer(function (req, res) {
  const __dirname = path.resolve(path.dirname(''));
  const file_path =
    __dirname + (req.url === '/' ? '/front/index.html' : '/front' + req.url);
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

const messages: {
  type: 'in' | 'out';
  data: any;
  userId?: UserId;
}[] = [];

try {
  const WEBSOCKET_PORT = Number(process.env.WEBSOCKET_PORT) || 3000;
  const wsServer = new WebSocketServer({ port: WEBSOCKET_PORT });
  const gameEngine = new GameEngine();
  wsServer.on('connection', (ws) => {
    console.log('Connection received ');

    const wsStream = createWebSocketStream(ws, {
      encoding: 'utf8',
      decodeStrings: false,
    });

    let info: Info | undefined;
    wsStream.on('data', (data: string) => {
      const dataObj: InputMessage = deserializeMessage(data);
      if (dataObj.type === 'reg') {
        info = gameEngine.regUser(dataObj, (data, userId) => {
          sendMessage(data, ws, userId);
          messages.push({
            type: 'out',
            data: data,
            userId: userId,
          });
        });
      } else {
        info?.callback?.(dataObj);
      }
    });
    wsStream.on('error', (err) => {
      console.error(err);
    });
    wsStream.on('end', () => {
      console.log(`User ${info?.userId} has left`);
      if (info?.userId) {
        info.callback({
          type: 'user_disconnected',
          userId: info.userId,
          id: 0,
        });
      }
    });
  });
  wsServer.on('error', (err) => {
    console.error(err);
    console.log(`Websocket server closed`);
  });

  console.log(`Start websocket server on the ${WEBSOCKET_PORT} port`);
} catch (e) {
  console.error(e);
  console.log(`Server websocket err `, e);
}

function sendMessage<T extends { data: any; type: string }>(
  msg: T,
  ws: WebSocket,
  userId?: number,
) {
  console.log(`Sending message userId: ${userId}`, msg);
  ws.send(serializeMessage(msg));
}

function serializeMessage<T extends { data: any; type: string }>(obj: T) {
  const copy: any = {
    ...obj,
  };
  const data = obj.data;
  const jsonString = data ? JSON.stringify(data) : '';
  copy.data = jsonString;
  return JSON.stringify(copy);
}

function deserializeMessage<T>(input: string): T {
  const obj = JSON.parse(input);
  if (obj.data) obj.data = JSON.parse(obj.data);
  return obj;
}
