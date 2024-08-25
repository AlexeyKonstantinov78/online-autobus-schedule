import express from 'express';
import path from 'node:path';
import { sendUpdatedData, sortedBases } from './services/nextDeparture.js';
import { initWebSocket } from './websocket/websocket.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.resolve('public')));

app.get('/next-departure', async (req, res) => {
  try {
    const updatedBuses = await sendUpdatedData();
    const sortBus = sortedBases(updatedBuses);

    res.json(sortBus);
  } catch (error) {
    console.log(error);
    res.send(error.message);
  }
});

const server = app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});

initWebSocket(server);
