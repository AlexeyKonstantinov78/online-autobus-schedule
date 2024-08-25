import { WebSocketServer } from 'ws';
import { sendUpdatedData, sortedBases } from '../services/nextDeparture.js';

const wss = new WebSocketServer({
  noServer: true,
});

const client = new Set();

wss.on('connection', (ws) => {
  console.log("WebSocket connection");
  client.add(ws);

  const sendUpdates = async () => {
    try {
      const updateBuses = await sendUpdatedData();
      const sortBases = sortedBases(updateBuses);

      ws.send(JSON.stringify(sortBases));
    } catch (error) {
      console.error(`Error WebSocket connection ${error}`);
    }
  };

  const intervalId = setInterval(sendUpdates, 1000);

  ws.on('close', () => {
    clearInterval(intervalId);
    client.delete(ws);
    console.log("WebSocket closed");
  });
});

export { wss };

export const initWebSocket = (server) => {
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    })
  });
};