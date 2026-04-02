const fs = require("fs/promises");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../data/db.json");

async function ensureDbFile() {
  try {
    await fs.access(DB_PATH);
  } catch {
    const initialData = { users: [], records: [] };
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
  }
}

async function readDb() {
  await ensureDbFile();
  const content = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(content);
}

async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function nextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map((item) => Number(item.id) || 0)) + 1;
}

module.exports = {
  readDb,
  writeDb,
  nextId,
};
