const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5001;
const host = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

const store = require('./store');

// Middleware to extract authenticated user from X-User-Id header
async function authenticate(req, res, next) {
  const userIdHeader = req.headers['x-user-id'];
  if (!userIdHeader) {
    req.user = null;
    return next();
  }
  try {
    const user = await store.getUserById(Number(userIdHeader));
    req.user = user;
  } catch (err) {
    req.user = null;
  }
  next();
}
app.use(authenticate);

// ----------------------------------------------------
// AUTHENTICATION ENDPOINTS
// ----------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const user = await store.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    // Omit password in response
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, role, name, hospital, location } = req.body;
  if (!username || !password || !role || !name || !hospital || !location) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const existing = await store.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    const user = await store.createUser({ username, password, role, name, hospital, location });
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword });
  } catch (err) {
    console.error('Registration error', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const list = await store.getDoctors();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// ORGAN REQUESTS ENDPOINTS
// ----------------------------------------------------
app.get('/api/requests', async (req, res) => {
  const { page, limit, organ, urgency, q, sort } = req.query;
  try {
    const result = await store.queryRequests({ page, limit, organ, urgency, q, sort });
    res.json(result);
  } catch (err) {
    console.error('Query error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/requests', async (req, res) => {
  const data = req.body;
  if (!data.organ || !data.blood || !data.hospital) {
    return res.status(400).json({ error: 'organ, blood and hospital are required' });
  }
  try {
    const item = await store.addRequest(data);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const requests = await store.getRequests();
    const item = requests.find((r) => r.id === id);
    if (!item) return res.status(404).json({ error: 'not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/requests/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const patch = req.body;
    const updated = await store.updateRequest(id, patch);
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ok = await store.deleteRequest(id);
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// ORGANS INVENTORY ENDPOINTS
// ----------------------------------------------------
app.get('/api/organs', async (req, res) => {
  const { hospital } = req.query;
  try {
    const organs = await store.getOrgans(hospital);
    res.json(organs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/organs', async (req, res) => {
  const { organ_type, blood_group, status, hospital } = req.body;
  if (!organ_type || !blood_group || !hospital) {
    return res.status(400).json({ error: 'organ_type, blood_group, and hospital are required' });
  }
  try {
    const organ = await store.addOrgan({ organ_type, blood_group, status, hospital });
    res.status(201).json(organ);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// ALLOCATIONS & VERIFICATIONS ENDPOINTS
// ----------------------------------------------------
app.post('/api/admit/allocate', async (req, res) => {
  const { requestId, doctorId, organId, verificationCode } = req.body;
  if (!requestId || !doctorId || !organId || !verificationCode) {
    return res.status(400).json({ error: 'requestId, doctorId, organId, and verificationCode are required' });
  }
  try {
    const updatedRequest = await store.allocateDoctorAndOrgan(
      Number(requestId),
      Number(doctorId),
      Number(organId),
      verificationCode
    );
    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doctor/confirm', async (req, res) => {
  const { requestId, doctorId, verificationCode } = req.body;
  if (!requestId || !doctorId || !verificationCode) {
    return res.status(400).json({ error: 'requestId, doctorId, and verificationCode are required' });
  }
  try {
    const updatedRequest = await store.confirmTransplant(
      Number(requestId),
      Number(doctorId),
      verificationCode
    );
    res.json(updatedRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/doctor/activities', async (req, res) => {
  const { doctorId } = req.query;
  try {
    const list = await store.getActivities(doctorId ? Number(doctorId) : null);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// DONATIONS ENDPOINTS
// ----------------------------------------------------
app.get('/api/fundraising', async (req, res) => {
  try {
    const result = await store.getFundraisings();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fundraising/:id/donate', async (req, res) => {
  const id = Number(req.params.id);
  const { amount } = req.body;
  const n = Number(amount || 0);
  if (!n || n <= 0) return res.status(400).json({ error: 'amount must be a positive number' });
  try {
    const updated = await store.addDonation(id, n);
    if (!updated) return res.status(404).json({ error: 'fundraising not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/donations', async (req, res) => {
  const { donor_name, email, donation_type, amount, organ_type, blood_group, hospital } = req.body;
  if (!donor_name || !email || !donation_type) {
    return res.status(400).json({ error: 'donor_name, email, and donation_type are required' });
  }
  try {
    const saved = await store.recordDonation({
      donor_name,
      email,
      donation_type,
      amount: Number(amount || 0),
      organ_type,
      blood_group,
      hospital
    });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// SUPERVISOR TRANSFERS ENDPOINTS
// ----------------------------------------------------
app.get('/api/supervisor/transfers', async (req, res) => {
  const { hospital } = req.query;
  try {
    const list = await store.getTransfers(hospital);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/supervisor/transfers', async (req, res) => {
  const { organ_type, blood_group, from_hospital, to_hospital } = req.body;
  if (!organ_type || !blood_group || !from_hospital || !to_hospital) {
    return res.status(400).json({ error: 'organ_type, blood_group, from_hospital, and to_hospital are required' });
  }
  try {
    const transfer = await store.addTransfer({ organ_type, blood_group, from_hospital, to_hospital });
    res.status(201).json(transfer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/supervisor/transfers/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  try {
    const updated = await store.updateTransferStatus(id, status);
    if (!updated) return res.status(404).json({ error: 'transfer not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Organ-E API listening on http://0.0.0.0:${port}`);
  });
}

module.exports = app;

