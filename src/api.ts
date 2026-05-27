import type { AvailabilityEntry, Booking, BookingCreatePayload, BookingStatus, AvailabilityStatus } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

function buildUrl(path: string, query?: Record<string, string>) {
  const url = new URL(path, window.location.origin);
  url.pathname = `${API_BASE}${path}`.replace(/\/\/g, '/');

  if (query) {
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  return url.toString();
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return response.json();
}

export async function fetchAvailability(from: string, to: string): Promise<AvailabilityEntry[]> {
  const url = buildUrl('/api/availability', { from, to });
  return jsonRequest<AvailabilityEntry[]>(url);
}

export async function updateAvailability(date: string, status: AvailabilityStatus) {
  const url = buildUrl('/api/availability');
  return jsonRequest<{ success: boolean }>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, status }),
  });
}

export async function bulkUpdateAvailability(from: string, to: string, status: AvailabilityStatus) {
  const url = buildUrl('/api/availability/bulk');
  return jsonRequest<{ success: boolean }>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, status }),
  });
}

export async function fetchBookings(): Promise<Booking[]> {
  const url = buildUrl('/api/bookings');
  return jsonRequest<Booking[]>(url);
}

export async function createBooking(payload: BookingCreatePayload): Promise<Booking> {
  const url = buildUrl('/api/bookings');
  return jsonRequest<Booking>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateBookingStatus(id: string | number, status: BookingStatus) {
  const url = buildUrl(`/api/bookings/${id}/status`);
  return jsonRequest<{ success: boolean }>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}
