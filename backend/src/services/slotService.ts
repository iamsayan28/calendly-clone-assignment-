/**
 * slotService.ts
 * Core scheduling logic — slot generation and conflict detection.
 * All times are handled in UTC internally.
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import {
  addMinutes,
  format,
  parseISO,
  isBefore,
  isAfter,
  startOfDay,
  getDay,
} from 'date-fns';

export interface Availability {
  day_of_week: number;   // 0=Sun … 6=Sat
  start_time:  string;   // HH:mm
  end_time:    string;   // HH:mm
  timezone:    string;   // IANA, e.g. "Asia/Kolkata"
}

export interface Booking {
  start_time: Date;
  end_time:   Date;
  status:     string;
}

export interface TimeSlot {
  start: string; // ISO UTC string
  end:   string; // ISO UTC string
}

/**
 * Generate available time slots for a given date.
 *
 * @param dateStr        - Date in YYYY-MM-DD format (in the availability timezone)
 * @param availabilities - Availability rows for the event type
 * @param duration       - Event duration in minutes
 * @param bufferBefore   - Buffer before event in minutes
 * @param bufferAfter    - Buffer after event in minutes
 * @param existingBookings - All non-cancelled bookings for this event type
 * @returns Array of available time slot objects (UTC ISO strings)
 */
export function generateSlots(
  dateStr: string,
  availabilities: Availability[],
  duration: number,
  bufferBefore: number,
  bufferAfter: number,
  existingBookings: Booking[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Filter only non-cancelled bookings
  const activeBookings = existingBookings.filter(b => b.status !== 'cancelled');

  for (const avail of availabilities) {
    const { day_of_week, start_time, end_time, timezone } = avail;

    // Parse the local date in the availability timezone
    // e.g. dateStr = "2026-04-21", timezone = "Asia/Kolkata"
    const [year, month, day] = dateStr.split('-').map(Number);

    // Build a Date object representing midnight of that day in the avail timezone
    const localMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    // Convert midnight-in-UTC to midnight-in-local to get the UTC offset
    const localDate = toZonedTime(localMidnight, timezone);

    // Check day of week matches (use the local day, not UTC day)
    const localDayOfWeek = getDay(localDate); // 0=Sun … 6=Sat
    if (localDayOfWeek !== day_of_week) continue;

    // Build window start/end in local timezone then convert to UTC
    const [startH, startM] = start_time.split(':').map(Number);
    const [endH,   endM]   = end_time.split(':').map(Number);

    // fromZonedTime: treat a wall-clock time in tzName as if it's in that tz → gives UTC Date
    const windowStart = fromZonedTime(
      new Date(year, month - 1, day, startH, startM, 0),
      timezone
    );
    const windowEnd = fromZonedTime(
      new Date(year, month - 1, day, endH, endM, 0),
      timezone
    );

    // Walk through the window in `duration` steps
    let slotStart = windowStart;
    while (true) {
      const slotEnd = addMinutes(slotStart, duration);

      // Slot must end within the availability window
      if (isAfter(slotEnd, windowEnd)) break;

      // Effective blocked range for this slot (includes buffers)
      const effectiveStart = addMinutes(slotStart, -bufferBefore);
      const effectiveEnd   = addMinutes(slotEnd,    bufferAfter);

      // Check overlap with every active booking
      const hasConflict = activeBookings.some(booking => {
        // Booking's effective blocked range
        const bookingEffectiveStart = addMinutes(new Date(booking.start_time), -bufferBefore);
        const bookingEffectiveEnd   = addMinutes(new Date(booking.end_time),    bufferAfter);

        // Two ranges overlap when one starts before the other ends
        return (
          isBefore(effectiveStart, bookingEffectiveEnd) &&
          isAfter(effectiveEnd,   bookingEffectiveStart)
        );
      });

      if (!hasConflict) {
        slots.push({
          start: slotStart.toISOString(),
          end:   slotEnd.toISOString(),
        });
      }

      // Advance by duration (use duration steps, not buffer steps)
      slotStart = addMinutes(slotStart, duration);
    }
  }

  // Sort slots chronologically
  slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return slots;
}

/**
 * Check if a specific slot is available (used for booking/rescheduling validation).
 * Returns true if no conflict exists.
 */
export function isSlotAvailable(
  proposedStart: Date,
  proposedEnd:   Date,
  bufferBefore:  number,
  bufferAfter:   number,
  existingBookings: Booking[],
  excludeBookingId?: string
): boolean {
  const activeBookings = existingBookings.filter(
    b => b.status !== 'cancelled'
  );

  const effectiveStart = addMinutes(proposedStart, -bufferBefore);
  const effectiveEnd   = addMinutes(proposedEnd,    bufferAfter);

  return !activeBookings.some((booking: any) => {
    // Skip the booking being rescheduled
    if (excludeBookingId && booking.id === excludeBookingId) return false;

    const bookingEffectiveStart = addMinutes(new Date(booking.start_time), -bufferBefore);
    const bookingEffectiveEnd   = addMinutes(new Date(booking.end_time),    bufferAfter);

    return (
      isBefore(effectiveStart, bookingEffectiveEnd) &&
      isAfter(effectiveEnd,   bookingEffectiveStart)
    );
  });
}
