import { DateTime, Duration } from 'luxon';
import { loadBuses } from '../utils/redFile.js';
const timeZone = 'UTC';

export const getNextDeparture = (firstDepartureTime, frequencyMinutes) => {
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
        .set({ hours, minutes, second: 0, millisecond: 0 })
        .plus({ days: 1 })
        .setZone(timeZone);
    }
  }

  return departure;
};

export const sendUpdatedData = async () => {
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

export const sortedBases = (data) => data.sort(
  (a, b) =>
    new Date(`${a.nextDeparture.date}T${a.nextDeparture.time}`) -
    new Date(`${b.nextDeparture.date}T${b.nextDeparture.time}`)
);
