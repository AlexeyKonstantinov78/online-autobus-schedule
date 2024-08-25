import express from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import { DateTime, Duration } from 'luxon';
import WebSocket, { WebSocketServer } from 'ws';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const timeZone = 'UTC';

const port = 3000;
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const loadBuses = async () => {
  try {
    const data = await readFile(path.join(__dirname, 'db', 'buses.json'), 'utf8');
    return await JSON.parse(data);
  } catch (error) {
    console.log("error: ", error);
  }
};

const getNextDeparture = (firstDepartureTime, frequencyMinutes) => {
  const now = DateTime.now().setZone(timeZone);
  //const [hours, minutes] = firstDepartureTime.split(':').map(n => Number(n));
  const [hours, minutes] = firstDepartureTime.split(':').map(Number);

  let departure = DateTime.now()
    .set({ hours, minutes, seconds: 0 })
    .setZone(timeZone);

  if (now > departure) {
    departure = departure.plus({ minutes: frequencyMinutes });
  }

  const endOfDay = DateTime.now()
    .set({ hours: 23, minutes: 59, seconds: 59 })
    .setZone(timeZone);

  while (now > departure) {
    departure = departure.plus({ minutes: frequencyMinutes });

    if (departure > endOfDay) {
      departure = DateTime.now()
        .set({ hour, minute, second: 0, millisecond: 0 })
        .plus({ days: 1 })
        .setZone(timeZone);
    }
  }

  return departure;
};

const sendUpdatedData = async () => {
  const buses = await loadBuses();
  const now = DateTime.now().setZone(timeZone);

  const updateBuses = buses.map((bus) => {
    const nextDeparture = getNextDeparture(
      bus.firstDepartureTime,
      bus.frequencyMinutes
    );

    const timeRemaining = Duration.fromMillis(nextDeparture.diff(now).toMillis());

    return {
      ...bus,
      nextDeparture: {
        date: nextDeparture.toFormat('yyyy-MM-dd'),
        time: nextDeparture.toFormat('HH:mm:ss'),
        remaining: timeRemaining.toFormat('hh:mm:ss'),
      },
    };
  });

  return updateBuses;
};

const sortedBases = (data) => data.sort(
  (a, b) =>
    new Date(`${a.nextDeparture.date}T${a.nextDeparture.time}`) -
    new Date(`${b.nextDeparture.date}T${b.nextDeparture.time}`)
);

app.get('/hello', (req, res) => {
  res.send('Hello world!');
});

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


const server = app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  })
});