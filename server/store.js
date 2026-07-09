const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
const { NETWORK_HOSPITALS, isOrganMatch, generateVerificationCode } = require('./utils');

const FILE = path.join(__dirname, 'data.json');

// Initialize PG Pool if DATABASE_URL is available
let pool = null;
let usePostgres = false;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    usePostgres = true;
    console.log("PostgreSQL store initialized via DATABASE_URL");
  } catch (err) {
    console.error("Failed to initialize PostgreSQL pool, falling back to JSON file storage:", err.message);
    usePostgres = false;
  }
} else {
  console.log("DATABASE_URL not set; using local JSON file storage fallback");
}

// ----------------------------------------------------
// DATABASE HELPER FUNCTIONS
// ----------------------------------------------------

async function load() {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    const data = JSON.parse(raw);
    // Ensure all tables exist in JSON
    if (!data.requests) data.requests = [];
    if (!data.fundraisings) data.fundraisings = [];
    if (!data.users) {
      data.users = [
        // Care Hospital
        { id: 101, username: 'doctor1', password: 'password', role: 'doctor', name: 'Dr. Sai Teja', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
        { id: 102, username: 'admin1', password: 'password', role: 'admin', name: 'Admit Coord A', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
        { id: 103, username: 'supervisor1', password: 'password', role: 'supervisor', name: 'Network Sup A1', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
        { id: 107, username: 'doctor1b', password: 'password', role: 'doctor', name: 'Dr. Aarav Sharma', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
        { id: 108, username: 'admin1b', password: 'password', role: 'admin', name: 'Admit Coord A2', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
        { id: 109, username: 'supervisor1b', password: 'password', role: 'supervisor', name: 'Network Sup A2', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },

        // Apollo Hospital
        { id: 104, username: 'doctor2', password: 'password', role: 'doctor', name: 'Dr. Priya Reddy', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },
        { id: 105, username: 'admin2', password: 'password', role: 'admin', name: 'Admit Coord B', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },
        { id: 106, username: 'supervisor2', password: 'password', role: 'supervisor', name: 'Network Sup B1', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },
        { id: 110, username: 'doctor2b', password: 'password', role: 'doctor', name: 'Dr. Rakesh Sen', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },
        { id: 111, username: 'admin2b', password: 'password', role: 'admin', name: 'Admit Coord B2', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },
        { id: 112, username: 'supervisor2b', password: 'password', role: 'supervisor', name: 'Network Sup B2', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },

        // Yashoda Hospital
        { id: 113, username: 'doctor3', password: 'password', role: 'doctor', name: 'Dr. Vikram Seth', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },
        { id: 114, username: 'doctor3b', password: 'password', role: 'doctor', name: 'Dr. Nisha Goel', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },
        { id: 115, username: 'admin3', password: 'password', role: 'admin', name: 'Admit Coord C', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },
        { id: 116, username: 'admin3b', password: 'password', role: 'admin', name: 'Admit Coord C2', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },
        { id: 117, username: 'supervisor3', password: 'password', role: 'supervisor', name: 'Network Sup C1', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },
        { id: 118, username: 'supervisor3b', password: 'password', role: 'supervisor', name: 'Network Sup C2', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },

        // AIG Hospitals
        { id: 119, username: 'doctor4', password: 'password', role: 'doctor', name: 'Dr. Mahesh Babu', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },
        { id: 120, username: 'doctor4b', password: 'password', role: 'doctor', name: 'Dr. Kavya Krishnan', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },
        { id: 121, username: 'admin4', password: 'password', role: 'admin', name: 'Admit Coord D', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },
        { id: 122, username: 'admin4b', password: 'password', role: 'admin', name: 'Admit Coord D2', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },
        { id: 123, username: 'supervisor4', password: 'password', role: 'supervisor', name: 'Network Sup D1', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },
        { id: 124, username: 'supervisor4b', password: 'password', role: 'supervisor', name: 'Network Sup D2', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },

        // Fortis Hospital
        { id: 125, username: 'doctor5', password: 'password', role: 'doctor', name: 'Dr. Sameer Khan', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },
        { id: 126, username: 'doctor5b', password: 'password', role: 'doctor', name: 'Dr. Ananya Roy', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },
        { id: 127, username: 'admin5', password: 'password', role: 'admin', name: 'Admit Coord E', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },
        { id: 128, username: 'admin5b', password: 'password', role: 'admin', name: 'Admit Coord E2', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },
        { id: 129, username: 'supervisor5', password: 'password', role: 'supervisor', name: 'Network Sup E1', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },
        { id: 130, username: 'supervisor5b', password: 'password', role: 'supervisor', name: 'Network Sup E2', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },

        // Max Hospital
        { id: 131, username: 'doctor6', password: 'password', role: 'doctor', name: 'Dr. Sunita Patel', hospital: 'Max Hospital', location: 'Saket, Delhi' },
        { id: 132, username: 'doctor6b', password: 'password', role: 'doctor', name: 'Dr. Amit Trivedi', hospital: 'Max Hospital', location: 'Saket, Delhi' },
        { id: 133, username: 'admin6', password: 'password', role: 'admin', name: 'Admit Coord F', hospital: 'Max Hospital', location: 'Saket, Delhi' },
        { id: 134, username: 'admin6b', password: 'password', role: 'admin', name: 'Admit Coord F2', hospital: 'Max Hospital', location: 'Saket, Delhi' },
        { id: 135, username: 'supervisor6', password: 'password', role: 'supervisor', name: 'Network Sup F1', hospital: 'Max Hospital', location: 'Saket, Delhi' },
        { id: 136, username: 'supervisor6b', password: 'password', role: 'supervisor', name: 'Network Sup F2', hospital: 'Max Hospital', location: 'Saket, Delhi' }
      ];
    }
    if (!data.organs || data.organs.length === 0) {
      data.organs = [
        { id: 1, organ_type: 'Kidney', blood_group: 'O+', status: 'Available', hospital: 'Care Hospital', received_at: new Date().toISOString() },
        { id: 2, organ_type: 'Liver', blood_group: 'A+', status: 'Available', hospital: 'Care Hospital', received_at: new Date().toISOString() },
        { id: 3, organ_type: 'Heart', blood_group: 'B+', status: 'Available', hospital: 'Apollo Hospital', received_at: new Date().toISOString() },
        { id: 4, organ_type: 'Kidney', blood_group: 'AB+', status: 'Available', hospital: 'Apollo Hospital', received_at: new Date().toISOString() },
        { id: 5, organ_type: 'Liver', blood_group: 'O-', status: 'Available', hospital: 'Yashoda Hospital', received_at: new Date().toISOString() }
      ];
    }
    if (!data.donations) data.donations = [];
    if (!data.transplant_activities) data.transplant_activities = [];
    if (!data.transfers) data.transfers = [];
    return data;
  } catch (err) {
    if (err.code === 'ENOENT') {
      const defaultData = {
        requests: [],
        fundraisings: [],
        users: [
          // Care Hospital
          { id: 101, username: 'doctor1', password: 'password', role: 'doctor', name: 'Dr. Sai Teja', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
          { id: 102, username: 'admin1', password: 'password', role: 'admin', name: 'Admit Coord A', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
          { id: 103, username: 'supervisor1', password: 'password', role: 'supervisor', name: 'Network Sup A1', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
          { id: 107, username: 'doctor1b', password: 'password', role: 'doctor', name: 'Dr. Aarav Sharma', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
          { id: 108, username: 'admin1b', password: 'password', role: 'admin', name: 'Admit Coord A2', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
          { id: 109, username: 'supervisor1b', password: 'password', role: 'supervisor', name: 'Network Sup A2', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },

          // Apollo Hospital
          { id: 104, username: 'doctor2', password: 'password', role: 'doctor', name: 'Dr. Priya Reddy', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },
          { id: 105, username: 'admin2', password: 'password', role: 'admin', name: 'Admit Coord B', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },
          { id: 106, username: 'supervisor2', password: 'password', role: 'supervisor', name: 'Network Sup B1', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },
          { id: 110, username: 'doctor2b', password: 'password', role: 'doctor', name: 'Dr. Rakesh Sen', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },
          { id: 111, username: 'admin2b', password: 'password', role: 'admin', name: 'Admit Coord B2', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },
          { id: 112, username: 'supervisor2b', password: 'password', role: 'supervisor', name: 'Network Sup B2', hospital: 'Apollo Hospital', location: 'Banjara Hills, Hyderabad' },

          // Yashoda Hospital
          { id: 113, username: 'doctor3', password: 'password', role: 'doctor', name: 'Dr. Vikram Seth', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },
          { id: 114, username: 'doctor3b', password: 'password', role: 'doctor', name: 'Dr. Nisha Goel', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },
          { id: 115, username: 'admin3', password: 'password', role: 'admin', name: 'Admit Coord C', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },
          { id: 116, username: 'admin3b', password: 'password', role: 'admin', name: 'Admit Coord C2', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },
          { id: 117, username: 'supervisor3', password: 'password', role: 'supervisor', name: 'Network Sup C1', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },
          { id: 118, username: 'supervisor3b', password: 'password', role: 'supervisor', name: 'Network Sup C2', hospital: 'Yashoda Hospital', location: 'Secunderabad, Hyderabad' },

          // AIG Hospitals
          { id: 119, username: 'doctor4', password: 'password', role: 'doctor', name: 'Dr. Mahesh Babu', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },
          { id: 120, username: 'doctor4b', password: 'password', role: 'doctor', name: 'Dr. Kavya Krishnan', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },
          { id: 121, username: 'admin4', password: 'password', role: 'admin', name: 'Admit Coord D', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },
          { id: 122, username: 'admin4b', password: 'password', role: 'admin', name: 'Admit Coord D2', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },
          { id: 123, username: 'supervisor4', password: 'password', role: 'supervisor', name: 'Network Sup D1', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },
          { id: 124, username: 'supervisor4b', password: 'password', role: 'supervisor', name: 'Network Sup D2', hospital: 'AIG Hospitals', location: 'Gachibowli, Hyderabad' },

          // Fortis Hospital
          { id: 125, username: 'doctor5', password: 'password', role: 'doctor', name: 'Dr. Sameer Khan', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },
          { id: 126, username: 'doctor5b', password: 'password', role: 'doctor', name: 'Dr. Ananya Roy', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },
          { id: 127, username: 'admin5', password: 'password', role: 'admin', name: 'Admit Coord E', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },
          { id: 128, username: 'admin5b', password: 'password', role: 'admin', name: 'Admit Coord E2', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },
          { id: 129, username: 'supervisor5', password: 'password', role: 'supervisor', name: 'Network Sup E1', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },
          { id: 130, username: 'supervisor5b', password: 'password', role: 'supervisor', name: 'Network Sup E2', hospital: 'Fortis Hospital', location: 'Shalimar Bagh, Delhi' },

          // Max Hospital
          { id: 131, username: 'doctor6', password: 'password', role: 'doctor', name: 'Dr. Sunita Patel', hospital: 'Max Hospital', location: 'Saket, Delhi' },
          { id: 132, username: 'doctor6b', password: 'password', role: 'doctor', name: 'Dr. Amit Trivedi', hospital: 'Max Hospital', location: 'Saket, Delhi' },
          { id: 133, username: 'admin6', password: 'password', role: 'admin', name: 'Admit Coord F', hospital: 'Max Hospital', location: 'Saket, Delhi' },
          { id: 134, username: 'admin6b', password: 'password', role: 'admin', name: 'Admit Coord F2', hospital: 'Max Hospital', location: 'Saket, Delhi' },
          { id: 135, username: 'supervisor6', password: 'password', role: 'supervisor', name: 'Network Sup F1', hospital: 'Max Hospital', location: 'Saket, Delhi' },
          { id: 136, username: 'supervisor6b', password: 'password', role: 'supervisor', name: 'Network Sup F2', hospital: 'Max Hospital', location: 'Saket, Delhi' }
        ],
        organs: [
          { id: 1, organ_type: 'Kidney', blood_group: 'O+', status: 'Available', hospital: 'Care Hospital', received_at: new Date().toISOString() },
          { id: 2, organ_type: 'Liver', blood_group: 'A+', status: 'Available', hospital: 'Care Hospital', received_at: new Date().toISOString() },
          { id: 3, organ_type: 'Heart', blood_group: 'B+', status: 'Available', hospital: 'Apollo Hospital', received_at: new Date().toISOString() },
          { id: 4, organ_type: 'Kidney', blood_group: 'AB+', status: 'Available', hospital: 'Apollo Hospital', received_at: new Date().toISOString() },
          { id: 5, organ_type: 'Liver', blood_group: 'O-', status: 'Available', hospital: 'Yashoda Hospital', received_at: new Date().toISOString() }
        ],
        donations: [],
        transplant_activities: [],
        transfers: []
      };
      await save(defaultData);
      return defaultData;
    }
    throw err;
  }
}

async function save(data) {
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ----------------------------------------------------
// USERS / AUTH API
// ----------------------------------------------------
async function getDoctors() {
  if (usePostgres) {
    const res = await pool.query("SELECT * FROM users WHERE role = 'doctor'");
    return res.rows;
  } else {
    const data = await load();
    return data.users.filter((u) => u.role === 'doctor');
  }
}

async function getUserByUsername(username) {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return res.rows[0] || null;
  } else {
    const data = await load();
    return data.users.find((u) => u.username === username) || null;
  }
}

async function getUserById(id) {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  } else {
    const data = await load();
    return data.users.find((u) => u.id === id) || null;
  }
}

async function createUser(user) {
  if (usePostgres) {
    const { username, password, role, name, hospital, location } = user;
    const res = await pool.query(
      'INSERT INTO users (username, password, role, name, hospital, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [username, password, role, name, hospital, location]
    );
    return res.rows[0];
  } else {
    const data = await load();
    const id = data.users.length ? Math.max(...data.users.map(u => u.id)) + 1 : 101;
    const toAdd = { id, ...user };
    data.users.push(toAdd);
    await save(data);
    return toAdd;
  }
}

// ----------------------------------------------------
// REQUESTS API
// ----------------------------------------------------
async function getRequests() {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM requests ORDER BY id DESC');
    return res.rows;
  } else {
    const data = await load();
    return data.requests || [];
  }
}

async function queryRequests(opts = {}) {
  const { page = 1, limit = 10, organ, urgency, q, sort = '-id' } = opts;
  const p = Number(page) || 1;
  const l = Number(limit) || 10;
  const offset = (p - 1) * l;

  if (usePostgres) {
    let query = 'SELECT * FROM requests';
    const params = [];
    let countQuery = 'SELECT COUNT(*) FROM requests';
    const conditions = [];

    if (organ) {
      params.push(organ);
      conditions.push(`LOWER(organ) = LOWER($${params.length})`);
    }
    if (urgency) {
      params.push(urgency);
      conditions.push(`LOWER(urgency) = LOWER($${params.length})`);
    }
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      conditions.push(`(LOWER(organ) LIKE $${params.length} OR LOWER(hospital) LIKE $${params.length} OR LOWER(location) LIKE $${params.length} OR LOWER(blood) LIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Sorting
    if (sort === 'id') {
      query += ' ORDER BY id ASC';
    } else if (sort === 'urgency') {
      query += ` ORDER BY CASE LOWER(urgency) WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'moderate' THEN 3 ELSE 4 END ASC, id DESC`;
    } else {
      query += ' ORDER BY id DESC'; // default -id
    }

    // Pagination
    params.push(l);
    const limitPlaceholder = `$${params.length}`;
    params.push(offset);
    const offsetPlaceholder = `$${params.length}`;
    query += ` LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;

    const countRes = await pool.query(countQuery, params.slice(0, conditions.length));
    const total = parseInt(countRes.rows[0].count);

    const itemsRes = await pool.query(query, params);
    return { items: itemsRes.rows, total, page: p, limit: l };
  } else {
    // Falls back to json querying
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
    const paged = items.slice(offset, offset + l);
    return { items: paged, total, page: p, limit: l };
  }
}

async function addRequest(item) {
  const { organ, urgency, blood, location, hospital, patient_name, patient_age, patient_report } = item;
  if (usePostgres) {
    const res = await pool.query(
      `INSERT INTO requests (organ, urgency, blood, location, hospital, patient_name, patient_age, patient_report, status, time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', 'Just Now') RETURNING *`,
      [organ, urgency, blood, location, hospital, patient_name || null, patient_age || null, patient_report || null]
    );
    return res.rows[0];
  } else {
    const data = await load();
    const id = data.requests.length ? Math.max(...data.requests.map((r) => r.id)) + 1 : 1;
    const toAdd = {
      id,
      status: 'Pending',
      time: 'Just Now',
      patient_name: patient_name || null,
      patient_age: patient_age || null,
      patient_report: patient_report || null,
      ...item
    };
    data.requests.push(toAdd);
    await save(data);
    return toAdd;
  }
}

async function updateRequest(id, patch) {
  if (usePostgres) {
    const keys = Object.keys(patch);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const params = [id, ...Object.values(patch)];
    const res = await pool.query(`UPDATE requests SET ${setClause} WHERE id = $1 RETURNING *`, params);
    return res.rows[0] || null;
  } else {
    const data = await load();
    const idx = data.requests.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    data.requests[idx] = { ...data.requests[idx], ...patch };
    await save(data);
    return data.requests[idx];
  }
}

async function deleteRequest(id) {
  if (usePostgres) {
    const res = await pool.query('DELETE FROM requests WHERE id = $1', [id]);
    return res.rowCount > 0;
  } else {
    const data = await load();
    const origLen = data.requests.length;
    data.requests = data.requests.filter((r) => r.id !== id);
    if (data.requests.length === origLen) return false;
    await save(data);
    return true;
  }
}

// ----------------------------------------------------
// ORGANS INVENTORY API
// ----------------------------------------------------
async function getOrgans(hospital) {
  if (usePostgres) {
    let query = 'SELECT * FROM organs';
    const params = [];
    if (hospital) {
      query += ' WHERE hospital = $1';
      params.push(hospital);
    }
    query += ' ORDER BY id DESC';
    const res = await pool.query(query, params);
    return res.rows;
  } else {
    const data = await load();
    let items = data.organs || [];
    if (hospital) {
      items = items.filter((o) => o.hospital === hospital);
    }
    return items;
  }
}

async function addOrgan(organ) {
  if (usePostgres) {
    const { organ_type, blood_group, status = 'Available', hospital } = organ;
    const res = await pool.query(
      'INSERT INTO organs (organ_type, blood_group, status, hospital) VALUES ($1, $2, $3, $4) RETURNING *',
      [organ_type, blood_group, status, hospital]
    );
    return res.rows[0];
  } else {
    const data = await load();
    const id = data.organs.length ? Math.max(...data.organs.map((o) => o.id)) + 1 : 1;
    const toAdd = { id, received_at: new Date().toISOString(), status: 'Available', ...organ };
    data.organs.push(toAdd);
    await save(data);
    return toAdd;
  }
}

async function updateOrganStatus(id, status) {
  if (usePostgres) {
    const res = await pool.query('UPDATE organs SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
    return res.rows[0] || null;
  } else {
    const data = await load();
    const idx = data.organs.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    data.organs[idx].status = status;
    await save(data);
    return data.organs[idx];
  }
}

// ----------------------------------------------------
// ALLOCATIONS & VERIFICATIONS
// ----------------------------------------------------
async function allocateDoctorAndOrgan(requestId, doctorId, organId, verificationCode) {
  const code = verificationCode || generateVerificationCode();
  if (usePostgres) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const reqRes = await client.query(
        `UPDATE requests 
         SET status = 'Allocated', allocated_doctor_id = $2, allocated_organ_id = $3, verification_code = $4, verification_confirmed = FALSE 
         WHERE id = $1 RETURNING *`,
        [requestId, doctorId, organId, code]
      );
      if (reqRes.rows.length === 0) throw new Error('Request not found');
      await client.query(`UPDATE organs SET status = 'Sent to OR' WHERE id = $1`, [organId]);
      await client.query('COMMIT');
      return reqRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const data = await load();
    const reqIdx = data.requests.findIndex((r) => r.id === requestId);
    const organIdx = data.organs.findIndex((o) => o.id === organId);

    if (reqIdx === -1) throw new Error('Request not found');
    if (organIdx === -1) throw new Error('Organ not found');

    data.requests[reqIdx] = {
      ...data.requests[reqIdx],
      status: 'Allocated',
      allocated_doctor_id: doctorId,
      allocated_organ_id: organId,
      verification_code: code,
      verification_confirmed: false
    };

    data.organs[organIdx].status = 'Sent to OR';
    await save(data);
    return data.requests[reqIdx];
  }
}

async function authorizeSurgery(requestId, doctorId, verificationCode) {
  if (usePostgres) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const reqRes = await client.query('SELECT * FROM requests WHERE id = $1', [requestId]);
      const request = reqRes.rows[0];

      if (!request) throw new Error('Request not found');
      if (request.status !== 'Allocated') throw new Error('Request must be allocated before authorization');
      if (Number(request.allocated_doctor_id) !== Number(doctorId)) throw new Error('This operation is not assigned to you');
      if (request.verification_code !== verificationCode) throw new Error('Invalid Surgical Verification Code');

      const updatedReqRes = await client.query(
        `UPDATE requests SET status = 'Authorized', verification_confirmed = TRUE, authorized_at = NOW() WHERE id = $1 RETURNING *`,
        [requestId]
      );

      await client.query(
        `INSERT INTO transplant_activities (doctor_id, description, details) VALUES ($1, $2, $3)`,
        [
          doctorId,
          `Pre-op authorization for Request #${requestId}`,
          `Patient: ${request.patient_name || 'N/A'} | Organ: ${request.organ} | Blood: ${request.blood} | Verification code validated`
        ]
      );

      await client.query('COMMIT');
      return updatedReqRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const data = await load();
    const reqIdx = data.requests.findIndex((r) => r.id === requestId);
    if (reqIdx === -1) throw new Error('Request not found');

    const request = data.requests[reqIdx];
    if (request.status !== 'Allocated') throw new Error('Request must be allocated before authorization');
    if (Number(request.allocated_doctor_id) !== Number(doctorId)) throw new Error('This operation is not assigned to you');
    if (request.verification_code !== verificationCode) throw new Error('Invalid Surgical Verification Code');

    data.requests[reqIdx].status = 'Authorized';
    data.requests[reqIdx].verification_confirmed = true;
    data.requests[reqIdx].authorized_at = new Date().toISOString();

    const activityId = data.transplant_activities.length ? Math.max(...data.transplant_activities.map(a => a.id)) + 1 : 1;
    data.transplant_activities.push({
      id: activityId,
      doctor_id: doctorId,
      description: `Pre-op authorization for Request #${requestId}`,
      details: `Patient: ${request.patient_name || 'N/A'} | Organ: ${request.organ} | Blood: ${request.blood} | Verification code validated`,
      created_at: new Date().toISOString()
    });

    await save(data);
    return data.requests[reqIdx];
  }
}

async function completeSurgery(requestId, doctorId) {
  if (usePostgres) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const reqRes = await client.query('SELECT * FROM requests WHERE id = $1', [requestId]);
      const request = reqRes.rows[0];

      if (!request) throw new Error('Request not found');
      if (request.status !== 'Authorized') throw new Error('Surgery must be authorized before completion');
      if (Number(request.allocated_doctor_id) !== Number(doctorId)) throw new Error('This operation is not assigned to you');

      const updatedReqRes = await client.query(
        `UPDATE requests SET status = 'Completed', completed_at = NOW() WHERE id = $1 RETURNING *`,
        [requestId]
      );

      if (request.allocated_organ_id) {
        await client.query(`UPDATE organs SET status = 'Transplanted' WHERE id = $1`, [request.allocated_organ_id]);
      }

      await client.query(
        `INSERT INTO transplant_activities (doctor_id, description, details) VALUES ($1, $2, $3)`,
        [
          doctorId,
          `Completed transplant for Request #${requestId}`,
          `Patient: ${request.patient_name || 'N/A'} | Organ: ${request.organ} | Blood: ${request.blood} | Outcome: Successful`
        ]
      );

      await client.query('COMMIT');
      return updatedReqRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const data = await load();
    const reqIdx = data.requests.findIndex((r) => r.id === requestId);
    if (reqIdx === -1) throw new Error('Request not found');

    const request = data.requests[reqIdx];
    if (request.status !== 'Authorized') throw new Error('Surgery must be authorized before completion');
    if (Number(request.allocated_doctor_id) !== Number(doctorId)) throw new Error('This operation is not assigned to you');

    data.requests[reqIdx].status = 'Completed';
    data.requests[reqIdx].completed_at = new Date().toISOString();

    const organIdx = data.organs.findIndex((o) => o.id === request.allocated_organ_id);
    if (organIdx !== -1) data.organs[organIdx].status = 'Transplanted';

    const activityId = data.transplant_activities.length ? Math.max(...data.transplant_activities.map(a => a.id)) + 1 : 1;
    data.transplant_activities.push({
      id: activityId,
      doctor_id: doctorId,
      description: `Completed transplant for Request #${requestId}`,
      details: `Patient: ${request.patient_name || 'N/A'} | Organ: ${request.organ} | Blood: ${request.blood} | Outcome: Successful`,
      created_at: new Date().toISOString()
    });

    await save(data);
    return data.requests[reqIdx];
  }
}

async function findMatchingOrgans(request, hospital) {
  const organs = await getOrgans(hospital || null);
  return organs.filter((o) => isOrganMatch(o, request));
}

// ----------------------------------------------------
// ACTIVITIES LOG
// ----------------------------------------------------
async function getActivities(doctorId) {
  if (usePostgres) {
    let query = 'SELECT t.*, u.name as doctor_name FROM transplant_activities t LEFT JOIN users u ON u.id = t.doctor_id';
    const params = [];
    if (doctorId) {
      query += ' WHERE t.doctor_id = $1';
      params.push(doctorId);
    }
    query += ' ORDER BY t.id DESC';
    const res = await pool.query(query, params);
    return res.rows;
  } else {
    const data = await load();
    let list = data.transplant_activities || [];
    if (doctorId) {
      list = list.filter((a) => a.doctor_id === doctorId);
    }
    const hydrated = list.map((a) => {
      const u = data.users.find(usr => usr.id === a.doctor_id);
      return { ...a, doctor_name: u ? u.name : 'Unknown Doctor' };
    });
    // Sort descending
    hydrated.sort((a, b) => b.id - a.id);
    return hydrated;
  }
}

async function addActivity(doctorId, description, details) {
  if (usePostgres) {
    const res = await pool.query(
      'INSERT INTO transplant_activities (doctor_id, description, details) VALUES ($1, $2, $3) RETURNING *',
      [doctorId, description, details]
    );
    return res.rows[0];
  } else {
    const data = await load();
    const id = data.transplant_activities.length ? Math.max(...data.transplant_activities.map(a => a.id)) + 1 : 1;
    const toAdd = { id, doctor_id: doctorId, description, details, created_at: new Date().toISOString() };
    data.transplant_activities.push(toAdd);
    await save(data);
    return toAdd;
  }
}

// ----------------------------------------------------
// DONATIONS API
// ----------------------------------------------------
async function getFundraisings() {
  if (usePostgres) {
    try {
      const res = await pool.query(
        "SELECT * FROM fundraisings ORDER BY id DESC"
      );

      if (res.rows.length > 0) return res.rows;
    } catch (err) {
      console.log("Fundraising table not found, using demo data");
    }

    return [
      {
        id: 1,
        title: "Emergency Liver Transplant for Raju",
        hospital: "AIG Hospitals",
        goal: 2500000,
        raised: 1200000,
        daysLeft: 15,
        description:
          "Raju needs an urgent liver transplant after sudden liver failure."
      },
      {
        id: 2,
        title: "Help Baby Sia's Heart Surgery",
        hospital: "Rainbow Children's Hospital",
        goal: 800000,
        raised: 450000,
        daysLeft: 25,
        description:
          "6-month-old Sia requires life-saving heart surgery."
      }
    ];
  }

  const data = await load();

  if (data.fundraisings.length > 0)
    return data.fundraisings;

  return [
    {
      id: 1,
      title: "Emergency Liver Transplant for Raju",
      hospital: "AIG Hospitals",
      goal: 2500000,
      raised: 1200000,
      daysLeft: 15
    },
    {
      id: 2,
      title: "Help Baby Sia's Heart Surgery",
      hospital: "Rainbow Children's Hospital",
      goal: 800000,
      raised: 450000,
      daysLeft: 25
    }
  ];
}

async function addDonation(campaignId, amount) {
  // Simple update raised amounts for fundraising
  if (usePostgres) {
    // If PostgreSQL doesn't have a fundraisings table, let's keep database raised updates local-friendly or run inline script.
    // Try to update Postgres, fallback to json
    try {
      const res = await pool.query(
        'UPDATE fundraisings SET raised = COALESCE(raised, 0) + $2 WHERE id = $1 RETURNING *',
        [campaignId, amount]
      );
      return res.rows[0];
    } catch {
      // If table doesn't exist, we skip
      return { id: campaignId, raised: amount };
    }
  } else {
    const data = await load();
    const idx = data.fundraisings.findIndex((f) => f.id === campaignId);
    if (idx === -1) return null;
    data.fundraisings[idx].raised = (data.fundraisings[idx].raised || 0) + amount;
    await save(data);
    return data.fundraisings[idx];
  }
}

async function recordDonation(donation) {
  if (usePostgres) {
    const { donor_name, email, donation_type, amount = 0, organ_type = null, blood_group = null, hospital = null } = donation;
    const res = await pool.query(
      `INSERT INTO donations (donor_name, email, donation_type, amount, organ_type, blood_group, hospital) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [donor_name, email, donation_type, amount, organ_type, blood_group, hospital]
    );
    return res.rows[0];
  } else {
    const data = await load();
    const id = data.donations.length ? Math.max(...data.donations.map((d) => d.id)) + 1 : 1;
    const toAdd = { id, created_at: new Date().toISOString(), ...donation };
    data.donations.push(toAdd);
    await save(data);
    return toAdd;
  }
}

// ----------------------------------------------------
// SUPERVISOR TRANSFERS API
// ----------------------------------------------------
async function getTransfers(hospital) {
  if (usePostgres) {
    let query = 'SELECT * FROM transfers';
    const params = [];
    if (hospital) {
      query += ' WHERE from_hospital = $1 OR to_hospital = $1';
      params.push(hospital);
    }
    query += ' ORDER BY id DESC';
    const res = await pool.query(query, params);
    return res.rows;
  } else {
    const data = await load();
    let items = data.transfers || [];
    if (hospital) {
      items = items.filter((t) => t.from_hospital === hospital || t.to_hospital === hospital);
    }
    return items;
  }
}

async function addTransfer(transfer) {
  if (usePostgres) {
    const { organ_type, blood_group, from_hospital, to_hospital, status = 'Requested' } = transfer;
    const res = await pool.query(
      'INSERT INTO transfers (organ_type, blood_group, from_hospital, to_hospital, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [organ_type, blood_group, from_hospital, to_hospital, status]
    );
    return res.rows[0];
  } else {
    const data = await load();
    const id = data.transfers.length ? Math.max(...data.transfers.map((t) => t.id)) + 1 : 1;
    const toAdd = { id, status: 'Requested', created_at: new Date().toISOString(), ...transfer };
    data.transfers.push(toAdd);
    await save(data);
    return toAdd;
  }
}

async function updateTransferStatus(id, status) {
  if (usePostgres) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const transferRes = await client.query('SELECT * FROM transfers WHERE id = $1', [id]);
      const transfer = transferRes.rows[0];
      if (!transfer) {
        await client.query('ROLLBACK');
        return null;
      }

      let organId = transfer.organ_id;

      if (status === 'Accepted' && !organId) {
        const organRes = await client.query(
          `SELECT * FROM organs WHERE hospital = $1 AND organ_type = $2 AND blood_group = $3 AND status = 'Available' LIMIT 1`,
          [transfer.from_hospital, transfer.organ_type, transfer.blood_group]
        );
        if (organRes.rows.length === 0) throw new Error('No matching organ available at source hospital');
        organId = organRes.rows[0].id;
        await client.query(`UPDATE organs SET status = 'In Transit' WHERE id = $1`, [organId]);
        status = 'In Transit';
      }

      if (status === 'Completed' && organId) {
        await client.query(
          `UPDATE organs SET hospital = $2, status = 'Available' WHERE id = $1`,
          [organId, transfer.to_hospital]
        );
      }

      const res = await client.query(
        'UPDATE transfers SET status = $2, organ_id = COALESCE($3, organ_id) WHERE id = $1 RETURNING *',
        [id, status, organId]
      );
      await client.query('COMMIT');
      return res.rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const data = await load();
    const idx = data.transfers.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const transfer = data.transfers[idx];
    let newStatus = status;
    let organId = transfer.organ_id;

    if (status === 'Accepted' && !organId) {
      const organIdx = data.organs.findIndex(
        (o) =>
          o.hospital === transfer.from_hospital &&
          o.organ_type.toLowerCase() === transfer.organ_type.toLowerCase() &&
          o.blood_group.toLowerCase() === transfer.blood_group.toLowerCase() &&
          o.status === 'Available'
      );
      if (organIdx === -1) throw new Error('No matching organ available at source hospital');
      organId = data.organs[organIdx].id;
      data.organs[organIdx].status = 'In Transit';
      newStatus = 'In Transit';
    }

    if (status === 'Completed' && organId) {
      const organIdx = data.organs.findIndex((o) => o.id === organId);
      if (organIdx !== -1) {
        data.organs[organIdx].hospital = transfer.to_hospital;
        data.organs[organIdx].status = 'Available';
      }
    }

    data.transfers[idx] = { ...transfer, status: newStatus, organ_id: organId || transfer.organ_id };
    await save(data);
    return data.transfers[idx];
  }
}

function getHospitals() {
  return NETWORK_HOSPITALS;
}

module.exports = {
  load,
  save,
  queryRequests,
  getRequests,
  addRequest,
  updateRequest,
  deleteRequest,
  getOrgans,
  addOrgan,
  updateOrganStatus,
  getUserByUsername,
  getUserById,
  createUser,
  allocateDoctorAndOrgan,
  authorizeSurgery,
  completeSurgery,
  findMatchingOrgans,
  getActivities,
  addActivity,
  getFundraisings,
  addDonation,
  recordDonation,
  getTransfers,
  addTransfer,
  updateTransferStatus,
  getDoctors,
  getHospitals,
  generateVerificationCode
};
