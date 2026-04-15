// ─── Shared TypeScript interfaces ───────────────────────────────────────────

export interface EventType {
  id:            string;
  name:          string;
  slug:          string;
  duration:      number;
  buffer_before: number;
  buffer_after:  number;
  created_at:    string;
  availability?: Availability[];
}

export interface Availability {
  id:            number;
  event_type_id: string;
  day_of_week:   number;   // 0=Sun … 6=Sat
  start_time:    string;   // HH:mm
  end_time:      string;   // HH:mm
  timezone:      string;
}

export interface Booking {
  id:              string;
  event_type_id:   string;
  event_type_name?: string;
  slug?:           string;
  duration?:       number;
  name:            string;
  email:           string;
  start_time:      string;  // ISO UTC
  end_time:        string;  // ISO UTC
  status:          'booked' | 'cancelled';
  created_at:      string;
}

export interface TimeSlot {
  start: string;  // ISO UTC
  end:   string;  // ISO UTC
}

export interface SlotsResponse {
  eventType: EventType;
  slots:     TimeSlot[];
}

export interface CreateEventTypePayload {
  name:          string;
  slug:          string;
  duration:      number;
  buffer_before: number;
  buffer_after:  number;
}

export interface AvailabilitySlot {
  day_of_week: number;
  start_time:  string;
  end_time:    string;
  timezone:    string;
}

export interface CreateBookingPayload {
  name:       string;
  email:      string;
  start_time: string;
}

export interface BookingConfirmation {
  booking:         Booking;
  rescheduleLink:  string;
}
