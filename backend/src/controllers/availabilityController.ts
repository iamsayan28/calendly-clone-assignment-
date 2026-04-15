import { Request, Response } from 'express';
import pool from '../db/index';

// GET /availability/:event_type_id
export async function getAvailability(req: Request, res: Response) {
  const { event_type_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM availability
       WHERE event_type_id = $1
       ORDER BY day_of_week ASC`,
      [event_type_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('getAvailability error:', err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
}

// POST /availability
// Replaces all availability for an event type (upsert pattern)
export async function setAvailability(req: Request, res: Response) {
  const { event_type_id, slots } = req.body;

  // slots: Array<{ day_of_week, start_time, end_time, timezone }>
  if (!event_type_id || !Array.isArray(slots)) {
    return res.status(400).json({ error: 'event_type_id and slots array are required' });
  }

  // Validate event type exists
  const etCheck = await pool.query('SELECT id FROM event_types WHERE id = $1', [event_type_id]);
  if (etCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Event type not found' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete existing availability for this event type
    await client.query('DELETE FROM availability WHERE event_type_id = $1', [event_type_id]);

    // Insert new slots
    for (const slot of slots) {
      const { day_of_week, start_time, end_time, timezone } = slot;
      await client.query(
        `INSERT INTO availability (event_type_id, day_of_week, start_time, end_time, timezone)
         VALUES ($1, $2, $3, $4, $5)`,
        [event_type_id, day_of_week, start_time, end_time, timezone || 'Asia/Kolkata']
      );
    }

    await client.query('COMMIT');

    // Return updated availability
    const result = await pool.query(
      'SELECT * FROM availability WHERE event_type_id = $1 ORDER BY day_of_week ASC',
      [event_type_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('setAvailability error:', err);
    res.status(500).json({ error: 'Failed to set availability' });
  } finally {
    client.release();
  }
}
