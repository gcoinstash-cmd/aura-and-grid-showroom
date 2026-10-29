import express from 'express';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.json());

// Simulation of ring buffer state
let ringState = {
  sequenceCursor: 0,
  latencyNs: 420,
  throughput: 14800000,
  utilization: 12.5,
};

app.get('/api/telemetry', (req, res) => {
  // Simulate slight jitter in telemetry
  ringState.sequenceCursor += Math.floor(Math.random() * 100);
  ringState.latencyNs = 400 + Math.floor(Math.random() * 50);
  res.json(ringState);
});

// Serve static assets in production
// Assuming standard Vite build output structure
app.use(express.static('dist'));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
