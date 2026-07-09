const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

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
        { id: 101, username: 'doctor1', password: 'password', role: 'doctor', name: 'Dr. Sai Teja', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
        { id: 102, username: 'admin1', password: 'password', role: 'admin', name: 'Admit Coord A', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
        { id: 103, username: 'supervisor1', password: 'password', role: 'supervisor', name: 'Network Sup B', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' }
      ];
    }
    if (!data.organs) data.organs = [];
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
          { id: 101, username: 'doctor1', password: 'password', role: 'doctor', name: 'Dr. Sai Teja', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
          { id: 102, username: 'admin1', password: 'password', role: 'admin', name: 'Admit Coord A', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' },
          { id: 103, username: 'supervisor1', password: 'password', role: 'supervisor', name: 'Network Sup B', hospital: 'Care Hospital', location: 'Miyapur, Hyderabad' }
        ],
        organs: [],
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
  if (usePostgres) {
    const { organ, urgency, blood, location, hospital } = item;
    const res = await pool.query(
      `INSERT INTO requests (organ, urgency, blood, location, hospital, status, time) VALUES ($1, $2, $3, $4, $5, 'Pending', 'Just Now') RETURNING *`,
      [organ, urgency, blood, location, hospital]
    );
    return res.rows[0];
  } else {
    const data = await load();
    const id = data.requests.length ? Math.max(...data.requests.map((r) => r.id)) + 1 : 1;
    const toAdd = { id, status: 'Pending', time: 'Just Now', ...item };
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
  if (usePostgres) {
    // Begin Transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Update request status, doctor, organ, verification code
      const reqRes = await client.query(
        `UPDATE requests 
         SET status = 'Allocated', allocated_doctor_id = $2, allocated_organ_id = $3, verification_code = $4, verification_confirmed = FALSE 
         WHERE id = $1 RETURNING *`,
        [requestId, doctorId, organId, verificationCode]
      );
      if (reqRes.rows.length === 0) {
        throw new Error('Request not found');
      }
      // Update organ status
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
      verification_code: verificationCode,
      verification_confirmed: false
    };

    data.organs[organIdx].status = 'Sent to OR';
    await save(data);
    return data.requests[reqIdx];
  }
}

async function confirmTransplant(requestId, doctorId, verificationCode) {
  if (usePostgres) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const reqRes = await client.query('SELECT * FROM requests WHERE id = $1', [requestId]);
      const request = reqRes.rows[0];

      if (!request) throw new Error('Request not found');
      if (request.status !== 'Allocated') throw new Error('Request not allocated yet');
      if (request.verification_code !== verificationCode) throw new Error('Invalid verification code');

      // Update request to Completed
      const updatedReqRes = await client.query(
        `UPDATE requests SET status = 'Completed', verification_confirmed = TRUE WHERE id = $1 RETURNING *`,
        [requestId]
      );

      // Update organ status to transplanted
      if (request.allocated_organ_id) {
        await client.query(`UPDATE organs SET status = 'Transplanted' WHERE id = $1`, [request.allocated_organ_id]);
      }

      // Log activity
      await client.query(
        `INSERT INTO transplant_activities (doctor_id, description, details) VALUES ($1, $2, $3)`,
        [doctorId, `Completed transplant operation for Request #${requestId}`, `Organ: ${request.organ}, Blood: ${request.blood}`]
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
    if (request.status !== 'Allocated') throw new Error('Request not allocated yet');
    if (request.verification_code !== verificationCode) throw new Error('Invalid verification code');

    data.requests[reqIdx].status = 'Completed';
    data.requests[reqIdx].verification_confirmed = true;

    const organIdx = data.organs.findIndex((o) => o.id === request.allocated_organ_id);
    if (organIdx !== -1) {
      data.organs[organIdx].status = 'Transplanted';
    }

    const activityId = data.transplant_activities.length ? Math.max(...data.transplant_activities.map(a => a.id)) + 1 : 1;
    data.transplant_activities.push({
      id: activityId,
      doctor_id: doctorId,
      description: `Completed transplant operation for Request #${requestId}`,
      details: `Organ: ${request.organ}, Blood: ${request.blood}`,
      created_at: new Date().toISOString()
    });

    await save(data);
    return data.requests[reqIdx];
  }
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
    const res = await pool.query('UPDATE transfers SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
    return res.rows[0] || null;
  } else {
    const data = await load();
    const idx = data.transfers.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    data.transfers[idx].status = status;
    await save(data);
    return data.transfers[idx];
  }
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
  confirmTransplant,
  getActivities,
  addActivity,
  getFundraisings,
  addDonation,
  recordDonation,
  getTransfers,
  addTransfer,
  updateTransferStatus,
  getDoctors
};
