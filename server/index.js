const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

const store = require('./store');

// Routes
// GET /api/requests with filtering, search, sort and pagination
app.get('/api/requests', async (req, res) => {
  const { page, limit, organ, urgency, q, sort } = req.query;
  try {
    const result = await store.queryRequests({ page, limit, organ, urgency, q, sort });
    res.json(result);
  } catch (err) {
    console.error('query error', err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/requests', async (req, res) => {
  const data = req.body;
  if (!data.organ || !data.blood || !data.hospital) {
    return res.status(400).json({ error: 'organ, blood and hospital are required' });
  }
  const item = await store.addRequest(data);
  res.status(201).json(item);
});

app.get('/api/requests/:id', async (req, res) => {
  const id = Number(req.params.id);
  const requests = await store.getRequests();
  const item = requests.find((r) => r.id === id);
  if (!item) return res.status(404).json({ error: 'not found' });
  res.json(item);
});

app.patch('/api/requests/:id', async (req, res) => {
  const id = Number(req.params.id);
  const patch = req.body;
  const updated = await store.updateRequest(id, patch);
  if (!updated) return res.status(404).json({ error: 'not found' });
  res.json(updated);
});

app.delete('/api/requests/:id', async (req, res) => {
  const id = Number(req.params.id);
  const ok = await store.deleteRequest(id);
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

app.get('/api/fundraising', async (req, res) => {
  const fundraisings = await store.getFundraisings();
  res.json(fundraisings);
});

app.post('/api/fundraising', async (req, res) => {
  const data = req.body;
  if (!data.title || !data.hospital) {
    return res.status(400).json({ error: 'title and hospital are required' });
  }
  const item = await store.addFundraising(data);
  res.status(201).json(item);
});

app.post('/api/fundraising/:id/donate', async (req, res) => {
  const id = Number(req.params.id);
  const { amount } = req.body;
  const n = Number(amount || 0);
  if (!n || n <= 0) return res.status(400).json({ error: 'amount must be a positive number' });
  const updated = await store.addDonation(id, n);
  if (!updated) return res.status(404).json({ error: 'fundraising not found' });
  res.json(updated);
});

app.listen(port, () => {
  console.log(`Organ-E API listening on port ${port}`);
});
