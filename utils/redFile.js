import { readFile } from 'node:fs/promises';
import path from 'node:path';

const dbPath = path.resolve(path.join('db', 'buses.json'));

export const loadBuses = async () => {
  try {
    const data = await readFile(dbPath, 'utf8');
    return await JSON.parse(data);
  } catch (error) {
    console.log("error: ", error);
  }
}; 