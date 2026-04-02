const { readDb, writeDb, nextId } = require("../db/store");
const HttpError = require("../utils/httpError");

async function createRecord(input, createdBy) {
  const db = await readDb();

  const record = {
    id: nextId(db.records),
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.records.push(record);
  await writeDb(db);
  return record;
}

function applyFilters(records, query) {
  return records.filter((record) => {
    if (query.type && record.type !== query.type) return false;
    if (query.category && record.category.toLowerCase() !== query.category.toLowerCase()) return false;
    if (query.fromDate && new Date(record.date) < new Date(query.fromDate)) return false;
    if (query.toDate && new Date(record.date) > new Date(query.toDate)) return false;
    return true;
  });
}

async function listRecords(query) {
  const db = await readDb();
  const filtered = applyFilters(db.records, query);

  const page = query.page || 1;
  const limit = query.limit || 10;
  const start = (page - 1) * limit;
  const data = filtered
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(start, start + limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit) || 1,
    },
  };
}

async function getRecordById(recordId) {
  const db = await readDb();
  const record = db.records.find((r) => r.id === recordId);
  if (!record) throw new HttpError(404, "Record not found");
  return record;
}

async function updateRecord(recordId, updates) {
  const db = await readDb();
  const index = db.records.findIndex((r) => r.id === recordId);
  if (index === -1) throw new HttpError(404, "Record not found");

  db.records[index] = {
    ...db.records[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await writeDb(db);
  return db.records[index];
}

async function deleteRecord(recordId) {
  const db = await readDb();
  const index = db.records.findIndex((r) => r.id === recordId);
  if (index === -1) throw new HttpError(404, "Record not found");

  const [deleted] = db.records.splice(index, 1);
  await writeDb(db);
  return deleted;
}

module.exports = {
  createRecord,
  listRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};
