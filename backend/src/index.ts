import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import eventTypesRouter  from './routes/eventTypes';
import availabilityRouter from './routes/availability';
import bookingRouter      from './routes/booking';
import meetingsRouter     from './routes/meetings';

const app  = express();
const PORT = process.env.PORT || 4000;

// ────────────────────────────────
// Middleware
// ────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// ────────────────────────────────
// Routes
// ────────────────────────────────
app.use('/event-types',  eventTypesRouter);
app.use('/availability', availabilityRouter);
app.use('/book',         bookingRouter);
app.use('/bookings',     bookingRouter);   // also handles /bookings/reschedule/:id
app.use('/meetings',     meetingsRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ────────────────────────────────
// Start
// ────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});

export default app;
