-- ============================================================
-- Calendly Clone — Seed Data
-- ============================================================

-- Insert a sample event type
INSERT INTO event_types (id, name, slug, duration, buffer_before, buffer_after)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '30 Min Meeting', '30-min-meeting', 30, 5, 5),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '60 Min Deep Dive', '60-min-deep-dive', 60, 10, 10)
ON CONFLICT (slug) DO NOTHING;

-- Availability for "30 Min Meeting" — Mon–Fri, 9am–5pm IST
INSERT INTO availability (event_type_id, day_of_week, start_time, end_time, timezone)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, '09:00', '17:00', 'Asia/Kolkata'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, '09:00', '17:00', 'Asia/Kolkata'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, '09:00', '17:00', 'Asia/Kolkata'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, '09:00', '17:00', 'Asia/Kolkata'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, '09:00', '17:00', 'Asia/Kolkata')
ON CONFLICT DO NOTHING;

-- Availability for "60 Min Deep Dive" — Tue, Thu, 10am–4pm IST
INSERT INTO availability (event_type_id, day_of_week, start_time, end_time, timezone)
VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 2, '10:00', '16:00', 'Asia/Kolkata'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 4, '10:00', '16:00', 'Asia/Kolkata')
ON CONFLICT DO NOTHING;
