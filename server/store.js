const fs = require('fs').promises;
const path = require('path');
const FILE = path.join(__dirname, 'data.json');

async function load() {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return { requests: [], fundraisings: [] };
    throw err;
  }
}

async function save(data) {
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function getRequests() {
  const data = await load();
  return data.requests || [];
}

/**
 * Query requests with optional filters, search, sort and pagination
 * opts: { page=1, limit=10, organ, urgency, q, sort }
 * sort: 'id' | '-id' | 'urgency' (Critical, High, Moderate order)
 */
async function queryRequests(opts = {}) {
  const {
    page = 1,
    limit = 10,
    organ,
    urgency,
    q,
    sort = '-id',
  } = opts;

  const data = await load();
  let items = (data.requests || []).slice();

  if (organ) {
    items = items.filter((r) => String(r.organ).toLowerCase() === String(organ).toLowerCase());
  }
  if (urgency) {
    items = items.filter((r) => String(r.urgency).toLowerCase() === String(urgency).toLowerCase());
  }
  if (q) {
    const qq = String(q).toLowerCase();
    items = items.filter((r) => {
      return (
        String(r.organ || '').toLowerCase().includes(qq) ||
        String(r.hospital || '').toLowerCase().includes(qq) ||
        String(r.location || '').toLowerCase().includes(qq) ||
        String(r.blood || '').toLowerCase().includes(qq)
      );
    });
  }

  // Sorting
  if (sort === 'id') {
    items.sort((a, b) => a.id - b.id);
  } else if (sort === '-id') {
    items.sort((a, b) => b.id - a.id);
  } else if (sort === 'urgency') {
    const rank = { critical: 3, high: 2, moderate: 1 };
    items.sort((a, b) => (rank[(b.urgency || '').toLowerCase()] || 0) - (rank[(a.urgency || '').toLowerCase()] || 0));
  }

  const total = items.length;
  const p = Number(page) || 1;
  const l = Number(limit) || 10;
  const start = (p - 1) * l;
  const paged = items.slice(start, start + l);

  return { items: paged, total, page: p, limit: l };
}

async function addRequest(item) {
  const data = await load();
  const id = data.requests.length ? data.requests[data.requests.length - 1].id + 1 : 1;
  const toAdd = { id, ...item };
  data.requests.push(toAdd);
  await save(data);
  return toAdd;
}

async function updateRequest(id, patch) {
  const data = await load();
  const idx = data.requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  data.requests[idx] = { ...data.requests[idx], ...patch };
  await save(data);
  return data.requests[idx];
}

async function deleteRequest(id) {
  const data = await load();
  const origLen = data.requests.length;
  data.requests = data.requests.filter((r) => r.id !== id);
  if (data.requests.length === origLen) return false;
  await save(data);
  return true;
}

async function getFundraisings() {
  const data = await load();
  return data.fundraisings || [];
}

async function addFundraising(item) {
  const data = await load();
  const id = data.fundraisings.length ? data.fundraisings[data.fundraisings.length - 1].id + 1 : 1;
  const toAdd = { id, ...item };
  data.fundraisings.push(toAdd);
  await save(data);
  return toAdd;
}

async function addDonation(id, amount) {
  const data = await load();
  const idx = data.fundraisings.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  data.fundraisings[idx].raised = (data.fundraisings[idx].raised || 0) + amount;
  await save(data);
  return data.fundraisings[idx];
}

module.exports = {
  load,
  save,
  getRequests,
  queryRequests,
  addRequest,
  updateRequest,
  deleteRequest,
  getFundraisings,
  addFundraising,
  addDonation,
};
