/**
 * api/index.ts — Typed fetch wrappers for all backend endpoints.
 * All requests go through Vite's proxy: /api → http://localhost:4000
 */

import type {
  EventType,
  Availability,
  AvailabilitySlot,
  SlotsResponse,
  Booking,
  BookingConfirmation,
  CreateEventTypePayload,
  CreateBookingPayload,
} from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Event Types ──────────────────────────────────────────────────────────────

export const api = {
  eventTypes: {
    list: () =>
      request<EventType[]>('/event-types'),

    create: (data: CreateEventTypePayload) =>
      request<EventType>('/event-types', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: CreateEventTypePayload) =>
      request<EventType>(`/event-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ message: string; id: string }>(`/event-types/${id}`, {
        method: 'DELETE',
      }),
  },

  // ─── Availability ──────────────────────────────────────────────────────────

  availability: {
    get: (eventTypeId: string) =>
      request<Availability[]>(`/availability/${eventTypeId}`),

    set: (eventTypeId: string, slots: AvailabilitySlot[]) =>
      request<Availability[]>('/availability', {
        method: 'POST',
        body: JSON.stringify({ event_type_id: eventTypeId, slots }),
      }),
  },

  // ─── Booking ───────────────────────────────────────────────────────────────

  booking: {
    getSlots: (slug: string, date: string) =>
      request<SlotsResponse>(`/book/${slug}/slots?date=${date}`),

    create: (slug: string, data: CreateBookingPayload) =>
      request<BookingConfirmation>(`/book/${slug}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Reschedule ────────────────────────────────────────────────────────────

  reschedule: {
    get: (id: string) =>
      request<Booking>(`/bookings/reschedule/${id}`),

    update: (id: string, start_time: string) =>
      request<Booking>(`/bookings/reschedule/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ start_time }),
      }),
  },

  // ─── Meetings ──────────────────────────────────────────────────────────────

  meetings: {
    list: (type: 'upcoming' | 'past') =>
      request<Booking[]>(`/meetings?type=${type}`),

    cancel: (id: string) =>
      request<{ message: string }>(`/meetings/${id}`, { method: 'DELETE' }),
  },
};
