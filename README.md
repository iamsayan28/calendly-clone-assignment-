# Calendly Clone 

A full-stack scheduling web application built with **React + Vite + TypeScript + Tailwind CSS** (frontend) and **Node.js + Express + PostgreSQL** (backend).

---

## Features

- Create, edit, delete event types with custom duration and buffer times
- Set availability per event type (day + time window + timezone)
- Public booking page with interactive month calendar and time slot picker
- Available dates/time slots shown in **blue**, unavailable in **gray**
- Booking form with name + email collection
- Double-booking prevention (race condition safe)
- Buffer time applied to all slot generation and conflict checks
- Confirmation page with reschedule link
- Reschedule page — updates existing booking (no duplicate created)
- Meetings page — upcoming/past tabs with cancel support


## Tech Stack

| Layer    | Technology                     |
|----------|--------------------------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v4 |
| Backend  | Node.js, Express, TypeScript   |
| Database | PostgreSQL                     |
| ORM      | Raw SQL via `pg` (node-postgres) |
| Date ops | `date-fns`, `date-fns-tz`      |
| Icons    | `lucide-react`                 |

---

## Project Structure

```
calendly-clone01/
├── backend/
│   ├── src/
│   │   ├── controllers/          # Route handlers
│   │   │   ├── eventTypesController.ts
│   │   │   ├── availabilityController.ts
│   │   │   ├── bookingController.ts
│   │   │   └── meetingsController.ts
│   │   ├── routes/               # Express routers
│   │   │   ├── eventTypes.ts
│   │   │   ├── availability.ts
│   │   │   ├── booking.ts
│   │   │   └── meetings.ts
│   │   ├── services/
│   │   │   └── slotService.ts    # Core slot generation logic
│   │   ├── db/
│   │   │   ├── index.ts          # pg Pool
│   │   │   ├── schema.sql        # DB schema
│   │   │   └── seed.sql          # Seed data
│   │   └── index.ts              # Express app entry
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/index.ts          # All API fetch wrappers
│   │   ├── types/index.ts        # Shared TypeScript interfaces
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Calendar.tsx      # Month calendar with availability
│   │   │   └── TimeSlotPicker.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── EventTypeFormPage.tsx  # Create + Edit
│   │   │   ├── MeetingsPage.tsx
│   │   │   ├── BookingPage.tsx
│   │   │   └── ReschedulePage.tsx
│   │   ├── App.tsx               # Router
│   │   ├── main.tsx
│   │   └── index.css             # Global styles + design tokens
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- npm

---

### 1. Database Setup

```sql
-- Create the database
CREATE DATABASE calendly_clone;
```

Then run the schema and seed:

```bash
# Connect to your database and run:
psql -U postgres -d calendly_clone -f backend/src/db/schema.sql
psql -U postgres -d calendly_clone -f backend/src/db/seed.sql
```

Or using psql interactively:
```sql
\c calendly_clone
\i path/to/backend/src/db/schema.sql
\i path/to/backend/src/db/seed.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Copy and fill in your DB credentials
# Edit .env with your actual PostgreSQL credentials:
#   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
```

The `.env` file is already created at `backend/.env`. Update it:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calendly_clone
DB_USER=postgres
DB_PASSWORD=your_actual_password
PORT=4000
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
cd backend
npm run dev
```

The backend runs at **http://localhost:4000**

---

### 3. Frontend Setup

```bash
cd frontend
npm run dev
```

The frontend runs at **http://localhost:5173**

> The Vite dev server proxies `/api/*` to `http://localhost:4000` automatically — no CORS issues.

---

## Usage

### Admin Dashboard (`/`)
- View all event types
- Copy public booking link
- Open booking page in new tab
- Edit or delete event types

### Create Event Type (`/event-types/new`)
- Set name, duration, buffer before/after
- Define availability: select day, start time, end time, timezone
- Add multiple days

### Meetings (`/meetings`)
- View upcoming and past meetings (tabs)
- Cancel upcoming meetings
- Click "Reschedule" to reschedule a meeting

### Booking Page (`/book/:slug`)
- Calendar shows available dates in **blue**, unavailable in **gray**
- Select a date to see available time slots
- Select a slot → fill in name + email → confirm booking
- Confirmation page shows reschedule link

### Reschedule Page (`/bookings/reschedule/:id`)
- Shows current booking details
- Pick a new date and time slot
- Updates the existing booking in place

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/event-types` | List all event types |
| POST | `/event-types` | Create event type |
| PUT | `/event-types/:id` | Update event type |
| DELETE | `/event-types/:id` | Delete event type |
| GET | `/availability/:event_type_id` | Get availability |
| POST | `/availability` | Set availability (replaces all) |
| GET | `/book/:slug/slots?date=YYYY-MM-DD` | Get available time slots |
| POST | `/book/:slug` | Create a booking |
| GET | `/bookings/reschedule/:id` | Get booking for rescheduling |
| PUT | `/bookings/reschedule/:id` | Reschedule a booking |
| GET | `/meetings?type=upcoming\|past` | List meetings |
| DELETE | `/meetings/:id` | Cancel a meeting |

---

## Slot Generation Logic

1. Parse availability window (day of week + time range) and convert to UTC
2. Walk through the window in `duration`-minute steps
3. For each candidate slot `[start, end]`:
   - Compute effective blocked range: `[start - buffer_before, end + buffer_after]`
   - Check overlap against all active bookings (also buffered)
4. Return only non-conflicting slots

---

## Design

- Clean minimal design inspired by Calendly
- Blue (`#0069FF`) primary color, white background, gray borders
- Inter font (Google Fonts)
- **Calendar**: available days in blue, unavailable days in gray
- **Time slots**: available = blue border button, selected = filled blue
- Left sidebar navigation

---

## Seed Data

The seed creates two event types:
- **30 Min Meeting** (`/book/30-min-meeting`) — Mon–Fri, 9am–5pm IST
- **60 Min Deep Dive** (`/book/60-min-deep-dive`) — Tue/Thu, 10am–4pm IST
