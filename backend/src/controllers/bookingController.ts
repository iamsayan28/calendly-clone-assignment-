import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/index';
import { generateSlots, isSlotAvailable } from '../services/slotService';

// GET /book/:slug/slots?date=YYYY-MM-DD
export async function getSlots(req: Request, res: Response) {
  const { slug } = req.params;
  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'date query param is required (YYYY-MM-DD)' });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
  }

  try {
    // Get event type by slug
    const etResult = await pool.query(
      'SELECT * FROM event_types WHERE slug = $1',
      [slug]
    );
    if (etResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    const eventType = etResult.rows[0];

    // Get availability schedules
    const availResult = await pool.query(
      'SELECT * FROM availability WHERE event_type_id = $1',
      [eventType.id]
    );

    // Get existing bookings on that day (with a safe date window)
    const bookingsResult = await pool.query(
      `SELECT * FROM bookings
       WHERE event_type_id = $1
         AND status = 'booked'
         AND start_time >= $2::date - INTERVAL '1 day'
         AND start_time <  $2::date + INTERVAL '2 days'`,
      [eventType.id, date]
    );

    const slots = generateSlots(
      date,
      availResult.rows,
      eventType.duration,
      eventType.buffer_before,
      eventType.buffer_after,
      bookingsResult.rows
    );

    res.json({ eventType, slots });
  } catch (err: any) {
    console.error('getSlots error:', err);
    res.status(500).json({ error: 'Failed to generate slots' });
  }
}

// POST /book/:slug
export async function createBooking(req: Request, res: Response) {
  const { slug } = req.params;
  const { name, email, start_time } = req.body;

  if (!name || !email || !start_time) {
    return res.status(400).json({ error: 'name, email, and start_time are required' });
  }

  try {
    // Get event type
    const etResult = await pool.query(
      'SELECT * FROM event_types WHERE slug = $1',
      [slug]
    );
    if (etResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    const eventType = etResult.rows[0];

    const proposedStart = new Date(start_time);
    const proposedEnd   = new Date(proposedStart.getTime() + eventType.duration * 60000);

    // Prevent past bookings
    if (proposedStart < new Date()) {
      return res.status(400).json({ error: 'Cannot book a slot in the past' });
    }

    // Re-fetch bookings for conflict check (prevent race condition)
    const bookingsResult = await pool.query(
      `SELECT * FROM bookings
       WHERE event_type_id = $1 AND status = 'booked'`,
      [eventType.id]
    );

    const available = isSlotAvailable(
      proposedStart,
      proposedEnd,
      eventType.buffer_before,
      eventType.buffer_after,
      bookingsResult.rows
    );

    if (!available) {
      return res.status(409).json({ error: 'This slot is no longer available. Please choose another.' });
    }

    // Create the booking
    const result = await pool.query(
      `INSERT INTO bookings (id, event_type_id, name, email, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'booked')
       RETURNING *`,
      [uuidv4(), eventType.id, name, email, proposedStart.toISOString(), proposedEnd.toISOString()]
    );

    const booking = result.rows[0];

    res.status(201).json({
      booking,
      rescheduleLink: `/bookings/reschedule/${booking.id}`,
    });
  } catch (err: any) {
    console.error('createBooking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
}

// GET /bookings/reschedule/:id
export async function getReschedule(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT b.*, et.name as event_type_name, et.slug, et.duration, et.buffer_before, et.buffer_after
       FROM bookings b
       JOIN event_types et ON et.id = b.event_type_id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];

    if (booking.status === 'cancelled') {
      return res.status(410).json({ error: 'This booking has been cancelled and cannot be rescheduled' });
    }

    res.json(booking);
  } catch (err: any) {
    console.error('getReschedule error:', err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
}

// PUT /bookings/reschedule/:id
export async function rescheduleBooking(req: Request, res: Response) {
  const { id } = req.params;
  const { start_time } = req.body;

  if (!start_time) {
    return res.status(400).json({ error: 'start_time is required' });
  }

  try {
    // Get existing booking
    const bookingResult = await pool.query(
      `SELECT b.*, et.duration, et.buffer_before, et.buffer_after
       FROM bookings b
       JOIN event_types et ON et.id = b.event_type_id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    if (booking.status === 'cancelled') {
      return res.status(410).json({ error: 'Cannot reschedule a cancelled booking' });
    }

    const proposedStart = new Date(start_time);
    const proposedEnd   = new Date(proposedStart.getTime() + booking.duration * 60000);

    if (proposedStart < new Date()) {
      return res.status(400).json({ error: 'Cannot reschedule to a past slot' });
    }

    // Get all bookings for conflict check (exclude this booking itself)
    const allBookings = await pool.query(
      `SELECT * FROM bookings WHERE event_type_id = $1 AND status = 'booked'`,
      [booking.event_type_id]
    );

    const available = isSlotAvailable(
      proposedStart,
      proposedEnd,
      booking.buffer_before,
      booking.buffer_after,
      allBookings.rows,
      id as string // exclude current booking
    );

    if (!available) {
      return res.status(409).json({ error: 'This slot is no longer available. Please choose another.' });
    }

    // Update the booking
    const result = await pool.query(
      `UPDATE bookings
       SET start_time = $1, end_time = $2
       WHERE id = $3
       RETURNING *`,
      [proposedStart.toISOString(), proposedEnd.toISOString(), id]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('rescheduleBooking error:', err);
    res.status(500).json({ error: 'Failed to reschedule booking' });
  }
}
