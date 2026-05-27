export type AvailabilityStatus = 'open' | 'fully_booked' | 'appointment_only';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface AvailabilityEntry {
  id: number | string;
  date: string;
  status: AvailabilityStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: number | string;
  client_name: string;
  client_phone: string;
  service_requested: string;
  preferred_date: string;
  status: BookingStatus;
  deposit_paid: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BookingCreatePayload {
  client_name: string;
  client_phone: string;
  service_requested: string;
  preferred_date: string;
  status: BookingStatus;
  deposit_paid: boolean;
  notes?: string;
}
