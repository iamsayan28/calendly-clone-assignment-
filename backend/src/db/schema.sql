-- ============================================================
-- Calendly Clone — Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Event Types table
CREATE TABLE IF NOT EXISTS event_types (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) NOT NULL UNIQUE,
  duration      INTEGER NOT NULL DEFAULT 30,   -- in minutes
  buffer_before INTEGER NOT NULL DEFAULT 0,    -- in minutes
  buffer_after  INTEGER NOT NULL DEFAULT 0,    -- in minutes
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availability table (one schedule per event type)
CREATE TABLE IF NOT EXISTS availability (
  id              SERIAL PRIMARY KEY,
  event_type_id   UUID NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  start_time      VARCHAR(5) NOT NULL,  -- HH:mm
  end_time        VARCHAR(5) NOT NULL,  -- HH:mm
  timezone        VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata'
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type_id   UUID NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  start_time      TIMESTAMP WITH TIME ZONE NOT NULL,  -- stored in UTC
  end_time        TIMESTAMP WITH TIME ZONE NOT NULL,  -- stored in UTC
  status          VARCHAR(20) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled')),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast slot conflict queries
CREATE INDEX IF NOT EXISTS idx_bookings_event_type_status ON bookings(event_type_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_availability_event_type ON availability(event_type_id);
