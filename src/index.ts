import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { WebSocketServer, createWebSocketStream } from 'ws';
import { InputMessage, RegisterResponse } from './messages';


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

try {
  const WEBSOCKET_PORT = Number(process.env.WEBSOCKET_PORT) || 3000;
  const wsServer = new WebSocketServer({ port: WEBSOCKET_PORT });
  wsServer.on('connection', (ws) => {
    const wsStream = createWebSocketStream(ws, {
      encoding: 'utf8',
      decodeStrings: false,
    });
    wsStream.on('data', (data: string) => {
      console.log(data);
      const dataObj: InputMessage = JSON.parse(data);
      console.log(dataObj)
      if (dataObj.type === 'reg') {
        const registerResponse: RegisterResponse = {
          type: 'reg',
          data: {
            name: dataObj.data.name,
            index: 1,
            error: false,
            errorText: ''
          },
          id: 0
        }
        ws.send(serializeMessage(registerResponse))
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
  console.log(`Start websocket server on the ${WEBSOCKET_PORT} port!`);
} catch (e) {
  console.error(e)
  console.log(`Server websocket err `, e);
}

function serializeMessage(obj: { data: any }) {
  const copy: any = {
    ...obj,
  }
  const data = obj.data;
  const jsonString = data ? JSON.stringify(data) : '';
  copy.data = jsonString;
  return JSON.stringify(copy);
}