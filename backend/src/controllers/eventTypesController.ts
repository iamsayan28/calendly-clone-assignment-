import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/index';

// GET /event-types
export async function getEventTypes(req: Request, res: Response) {
  try {
    const result = await pool.query(
      `SELECT et.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'day_of_week', a.day_of_week,
              'start_time', a.start_time,
              'end_time', a.end_time,
              'timezone', a.timezone
            )
          ) FILTER (WHERE a.id IS NOT NULL), '[]'
        ) as availability
       FROM event_types et
       LEFT JOIN availability a ON a.event_type_id = et.id
       GROUP BY et.id
       ORDER BY et.created_at ASC`
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('getEventTypes error:', err);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
}

// POST /event-types
export async function createEventType(req: Request, res: Response) {
  const { name, slug, duration, buffer_before = 0, buffer_after = 0 } = req.body;

  if (!name || !slug || !duration) {
    return res.status(400).json({ error: 'name, slug, and duration are required' });
  }

  // Normalize slug: lowercase, replace spaces with hyphens, strip special chars
  const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  try {
    const result = await pool.query(
      `INSERT INTO event_types (id, name, slug, duration, buffer_before, buffer_after)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [uuidv4(), name, normalizedSlug, duration, buffer_before, buffer_after]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Slug already exists. Please choose a different slug.' });
    }
    console.error('createEventType error:', err);
    res.status(500).json({ error: 'Failed to create event type' });
  }
}

// PUT /event-types/:id
export async function updateEventType(req: Request, res: Response) {
  const { id } = req.params;
  const { name, slug, duration, buffer_before, buffer_after } = req.body;

  if (!name || !slug || !duration) {
    return res.status(400).json({ error: 'name, slug, and duration are required' });
  }

  const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  try {
    const result = await pool.query(
      `UPDATE event_types
       SET name=$1, slug=$2, duration=$3, buffer_before=$4, buffer_after=$5
       WHERE id=$6
       RETURNING *`,
      [name, normalizedSlug, duration, buffer_before ?? 0, buffer_after ?? 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Slug already exists. Please choose a different slug.' });
    }
    console.error('updateEventType error:', err);
    res.status(500).json({ error: 'Failed to update event type' });
  }
}

// DELETE /event-types/:id
export async function deleteEventType(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM event_types WHERE id=$1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    res.json({ message: 'Event type deleted', id });
  } catch (err: any) {
    console.error('deleteEventType error:', err);
    res.status(500).json({ error: 'Failed to delete event type' });
  }
}
