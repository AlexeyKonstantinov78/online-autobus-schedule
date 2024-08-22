import express from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import { DateTime } from 'luxon';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const timeZone = 'UTC';

const port = 3000;
const app = express();

const loadBuses = async () => {
  const data = await readFile(path.join(__dirname, 'buses.json'), 'utf8');
  return await JSON.parse(data);
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
    .set({ hours: 23, minutes: 59, seconds: 0 })
    .setZone(timeZone);

  if (departure > endOfDay) {
    departure = departure
      .startOf('day')
      .plus({ days: 1 })
      .set({ hours, minutes });
  }

  while (now > departure) {
    departure = departure.plus({ minutes: frequencyMinutes });

    if (departure > endOfDay) {
      departure = departure
        .startOf('day')
        .plus({ days: 1 })
        .set({ hours, minutes });
    }
  }

  return departure;
};

const sendUpdatedData = async () => {
  const buses = await loadBuses();

  const updateBuses = buses.map((bus) => {
    const nextDeparture = getNextDeparture(
      bus.firstDepartureTime,
      bus.frequencyMinutes
    );

    return {
      ...bus,
      nextDeparture: {
        date: nextDeparture.toFormat('yyyy-MM-dd'),
        time: nextDeparture.toFormat('HH:mm:ss'),
      },
    };
  });

  return updateBuses;
};

app.get('/hello', (req, res) => {
  res.send('Hello world!');
});

app.get('/next-departure', async (req, res) => {
  try {
    const updatedBuses = await sendUpdatedData();

    updatedBuses.sort(
      (a, b) =>
        new Date(`${b.nextDeparture.date}T${b.nextDeparture.time}`) -
        new Date(`${a.nextDeparture.date}T${a.nextDeparture.time}`)
    );

    res.json(updatedBuses);
  } catch (error) {
    console.log(error);
    res.send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
