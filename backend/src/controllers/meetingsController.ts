import { Request, Response } from 'express';
import pool from '../db/index';

// GET /meetings?type=upcoming|past
export async function getMeetings(req: Request, res: Response) {
  const { type } = req.query;
  const now = new Date().toISOString();

  try {
    let query: string;
    let params: string[];

    if (type === 'past') {
      query = `
        SELECT b.*, et.name as event_type_name, et.slug, et.duration
        FROM bookings b
        JOIN event_types et ON et.id = b.event_type_id
        WHERE b.start_time < $1
        ORDER BY b.start_time DESC
      `;
      params = [now];
    } else {
      // Default: upcoming (includes cancelled so user can see them)
      query = `
        SELECT b.*, et.name as event_type_name, et.slug, et.duration
        FROM bookings b
        JOIN event_types et ON et.id = b.event_type_id
        WHERE b.start_time >= $1 AND b.status = 'booked'
        ORDER BY b.start_time ASC
      `;
      params = [now];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error('getMeetings error:', err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
}

// DELETE /meetings/:id  (soft delete — sets status to cancelled)
export async function cancelMeeting(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE id = $1 AND status = 'booked'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found or already cancelled' });
    }

    res.json({ message: 'Meeting cancelled', booking: result.rows[0] });
  } catch (err: any) {
    console.error('cancelMeeting error:', err);
    res.status(500).json({ error: 'Failed to cancel meeting' });
  }
}
