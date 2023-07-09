import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { WebSocketServer, createWebSocketStream } from 'ws';


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
  const wsserver = new WebSocketServer({ port: WEBSOCKET_PORT });
  wsserver.on('connection', (ws) => {
    const wsStream = createWebSocketStream(ws, {
      encoding: 'utf8',
      decodeStrings: false,
    });
    wsStream.on('data', (data) => {
      console.log(data);
    });
    wsStream.on('error', (err) => {
      console.error(err)
    });
  });
  wsserver.on('error', (err) => {
    console.error(err)
    console.log(`Websocket server closed`)
  });
  console.log(`Start websocket server on the ${WEBSOCKET_PORT} port!`);
} catch (e) {
  console.error(e)
  console.log(`Server websocket err `, e);
}
