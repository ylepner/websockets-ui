import { httpServer } from "./src";

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port`);
httpServer.listen(HTTP_PORT);
