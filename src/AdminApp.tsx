import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  LogOut,
  Users,
  Shield,
  MessageSquare,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';
import {
  fetchAvailability,
  fetchBookings,
  updateAvailability,
  bulkUpdateAvailability,
  updateBookingStatus,
} from './api';
import type { AvailabilityEntry, AvailabilityStatus, Booking } from './types';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'charisma2024';
const SESSION_KEY = 'charisma-admin-session';
const LOCK_KEY = 'charisma-admin-lock';
const MAX_ATTEMPTS = 3;
const LOCK_DURATION_MS = 10 * 60 * 1000;
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const STATUSES: Record<AvailabilityStatus, { label: string; style: string; emoji: string }> = {
  open: { label: 'Open', style: 'bg-emerald-100 text-emerald-900', emoji: '🟢' },
  fully_booked: { label: 'Fully Booked', style: 'bg-rose-100 text-rose-900', emoji: '🔴' },
  appointment_only: { label: 'Appointment Only', style: 'bg-amber-100 text-amber-900', emoji: '🟡' },
};

function formatDate(date: Date | string) {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return parsed.toISOString().slice(0, 10);
}

function formatDisplay(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDefaultStatus(dateString: string): AvailabilityStatus {
  return new Date(dateString).getDay() === 0 ? 'appointment_only' : 'open';
}

function getStatusLabel(status: AvailabilityStatus) {
  return STATUSES[status]?.label || 'Open';
}

export default function AdminApp() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>('open');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [popupOpen, setPopupOpen] = useState(false);
  const [bulkFrom, setBulkFrom] = useState('');
  const [bulkTo, setBulkTo] = useState('');
  const [bulkStatus, setBulkStatus] = useState<AvailabilityStatus>('fully_booked');
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession) as { expires: number };
        if (session.expires > Date.now()) {
          setLoggedIn(true);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    const rawLock = localStorage.getItem(LOCK_KEY);
    if (rawLock) {
      try {
        const lock = JSON.parse(rawLock) as { attempts: number; lockUntil: number };
        setAttempts(lock.attempts || 0);
        setLockUntil(lock.lockUntil || null);
      } catch {
        localStorage.removeItem(LOCK_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    loadData();
  }, [loggedIn]);

  const availabilityMap = useMemo(() => {
    return availability.reduce<Record<string, AvailabilityStatus>>((acc, item) => {
      acc[item.date] = item.status;
      return acc;
    }, {});
  }, [availability]);

  const loadData = async () => {
    setLoadingAvailability(true);
    setLoadingBookings(true);
    setActionMessage('Refreshing admin data...');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
      const [availabilityData, bookingsData] = await Promise.all([
        fetchAvailability(formatDate(monthStart), formatDate(monthEnd)),
        fetchBookings(),
      ]);
      setAvailability(availabilityData);
      setBookings(bookingsData);
      setActionMessage('');
    } catch (error) {
      setActionMessage('Unable to load admin data. Please check the worker API connection.');
      console.error(error);
    } finally {
      setLoadingAvailability(false);
      setLoadingBookings(false);
    }
  };

  const currentMonthLabel = calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const getDateStatus = (dateString: string): AvailabilityStatus => {
    return availabilityMap[dateString] || getDefaultStatus(dateString);
  };

  const handleLogin = () => {
    if (lockUntil && lockUntil > Date.now()) {
      setLoginError('Too many attempts. Try again later.');
      return;
    }

    if (password === ADMIN_PASSWORD) {
      const expires = Date.now() + SESSION_DURATION_MS;
      localStorage.setItem(SESSION_KEY, JSON.stringify({ expires }));
      localStorage.removeItem(LOCK_KEY);
      setLoggedIn(true);
      setLoginError('');
      setAttempts(0);
      setLockUntil(null);
      return;
    }

    const nextAttempts = attempts + 1;
    const nextLockUntil = nextAttempts >= MAX_ATTEMPTS ? Date.now() + LOCK_DURATION_MS : null;
    localStorage.setItem(LOCK_KEY, JSON.stringify({ attempts: nextAttempts, lockUntil: nextLockUntil }));
    setAttempts(nextAttempts);
    setLockUntil(nextLockUntil);
    setLoginError(nextLockUntil ? 'Too many attempts. Locked for 10 minutes.' : 'Password incorrect.');
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setLoggedIn(false);
    setPassword('');
  };

  const openPopup = (dateString: string) => {
    setSelectedDate(dateString);
    setSelectedStatus(getDateStatus(dateString));
    setPopupOpen(true);
  };

  const saveDateStatus = async () => {
    if (!selectedDate) return;
    setSaving(true);
    setActionMessage('Saving date status...');

    try {
      await updateAvailability(selectedDate, selectedStatus);
      setAvailability((current) => {
        const existing = current.find((item) => item.date === selectedDate);
        if (existing) {
          return current.map((item) => (item.date === selectedDate ? { ...item, status: selectedStatus } : item));
        }
        return [...current, { id: selectedDate, date: selectedDate, status: selectedStatus }];
      });
      setPopupOpen(false);
      setActionMessage('Availability updated successfully.');
    } catch (error) {
      setActionMessage('Unable to save the date status.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const applyBulkChanges = async () => {
    if (!bulkFrom || !bulkTo) {
      setActionMessage('Select both range dates to apply bulk changes.');
      return;
    }
    setSaving(true);
    setActionMessage('Applying bulk availability...');

    try {
      await bulkUpdateAvailability(bulkFrom, bulkTo, bulkStatus);
      await loadData();
      setActionMessage('Range updated successfully.');
    } catch (error) {
      setActionMessage('Could not apply the bulk range.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const changeBookingStatus = async (booking: Booking, status: AvailabilityStatus | Booking['status']) => {
    const newStatus = status as Booking['status'];
    setSaving(true);
    setActionMessage('Updating booking status...');

    try {
      await updateBookingStatus(booking.id, newStatus);
      setBookings((current) =>
        current.map((item) => (item.id === booking.id ? { ...item, status: newStatus } : item)),
      );
      setActionMessage('Booking status updated.');
    } catch (error) {
      setActionMessage('Failed to update booking.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const sendWhatsAppMessage = (booking: Booking, confirmed: boolean) => {
    const base = 'https://wa.me/263777554619';
    const message = confirmed
      ? `Hi ${booking.client_name}! Your booking for ${booking.service_requested} on ${booking.preferred_date} at Charisma Beauty Studio has been confirmed. Please ensure your $10 deposit has been sent to +263 777554619. See you then! 💄`
      : `Hi ${booking.client_name}, unfortunately we are unable to accommodate your booking for ${booking.preferred_date}. Please contact us to reschedule. We apologise for any inconvenience.`;

    window.open(`${base}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const bookingsThisWeek = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return bookings.filter((booking) => {
      const date = new Date(booking.preferred_date);
      return date >= weekStart && date <= weekEnd;
    }).length;
  }, [bookings]);

  const pendingCount = bookings.filter((booking) => booking.status === 'pending').length;
  const fullyBookedDaysThisMonth = availability.filter((item) => item.status === 'fully_booked').length;

  const monthCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const startDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: Array<Date | null> = [];

    for (let i = 0; i < startDay; i += 1) cells.push(null);
    for (let day = 1; day <= totalDays; day += 1) cells.push(new Date(year, month, day));
    return cells;
  }, [calendarMonth]);

  const handleDateCellClick = (date: Date) => {
    openPopup(formatDate(date));
  };

  const getCellStatus = (date: Date) => {
    const key = formatDate(date);
    return availabilityMap[key] || getDefaultStatus(key);
  };

  if (!loggedIn) {
    const isLocked = lockUntil && lockUntil > Date.now();
    const remainingMin = isLocked ? Math.ceil((lockUntil - Date.now()) / 60000) : 0;

    return (
      <div className="min-h-screen bg-[#F8F4F0] text-slate-900 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold">Charisma Beauty Studio — Admin</h1>
              <p className="text-sm text-slate-500">Enter the admin password to manage availability and bookings.</p>
            </div>
            <Shield className="h-8 w-8 text-rose-500" />
          </div>

          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            disabled={isLocked}
          />

          {loginError && (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loginError}</p>
          )}

          {isLocked && (
            <p className="mt-3 text-sm text-slate-500">Too many attempts. Try again in {remainingMin} min.</p>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={isLocked}
            className="mt-6 w-full rounded-full bg-rose-600 px-5 py-3 text-white shadow-lg shadow-rose-200/30 transition hover:bg-rose-700"
          >
            Unlock Admin Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4F0] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-rose-500">Secret admin portal</p>
            <h1 className="mt-2 text-3xl font-semibold">Charisma Beauty Studio — Admin</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-600"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {actionMessage && (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{actionMessage}</div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Bookings this week</p>
                <p className="mt-4 text-4xl font-semibold text-slate-900">{bookingsThisWeek}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Pending confirmations</p>
                <p className="mt-4 text-4xl font-semibold text-slate-900">{pendingCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Fully booked days</p>
                <p className="mt-4 text-4xl font-semibold text-slate-900">{fullyBookedDaysThisMonth}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Availability manager</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Monthly calendar</h2>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                  {currentMonthLabel}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.35em] text-slate-500">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
                  <div key={weekday}>{weekday}</div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-2">
                {monthCells.map((cell, index) => {
                  if (!cell) {
                    return <div key={`empty-${index}`} className="h-20 rounded-3xl bg-slate-50" />;
                  }
                  const isoDate = formatDate(cell);
                  const dayStatus = getCellStatus(cell);
                  const statusInfo = STATUSES[dayStatus];
                  const isToday = formatDate(cell) === formatDate(new Date());
                  return (
                    <button
                      key={isoDate}
                      type="button"
                      onClick={() => handleDateCellClick(cell)}
                      className={`group flex h-20 flex-col justify-between rounded-3xl border px-3 py-3 text-left text-xs transition ${
                        isToday ? 'border-rose-500/40 bg-rose-50' : 'border-slate-200 bg-white'
                      } hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{cell.getDate()}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
                          {cell.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}
                        </span>
                      </div>
                      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${statusInfo.style}`}>
                        <span>{statusInfo.emoji}</span>
                        <span>{statusInfo.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {Object.entries(STATUSES).map(([key, info]) => (
                  <div key={key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg">{info.emoji}</span>
                      <span className="font-semibold text-slate-900">{info.label}</span>
                    </div>
                    <p className="text-slate-500">Tap a day to update the status instantly.</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Bulk availability setting</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Block out a range</h2>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase text-slate-700">For holidays</div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <label className="block text-sm text-slate-700">
                  From
                  <input
                    type="date"
                    value={bulkFrom}
                    onChange={(event) => setBulkFrom(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  To
                  <input
                    type="date"
                    value={bulkTo}
                    onChange={(event) => setBulkTo(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  Mark as
                  <select
                    value={bulkStatus}
                    onChange={(event) => setBulkStatus(event.target.value as AvailabilityStatus)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  >
                    <option value="fully_booked">Fully Booked</option>
                    <option value="appointment_only">Appointment Only</option>
                    <option value="open">Open</option>
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={applyBulkChanges}
                    disabled={saving}
                    className="w-full rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Apply range
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-900">
                <Clock size={20} className="text-rose-500" />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Working hours</p>
                  <p className="mt-2 text-xl font-semibold">Mon - Sat: 8:30 AM - 5:30 PM</p>
                  <p className="text-sm text-slate-500">Sunday: Appointment Only</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-900">
                <Users size={20} className="text-rose-500" />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Bookings received</p>
                  <p className="mt-2 text-xl font-semibold">{bookings.length}</p>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.35em]"><th className="py-3">Date</th><th>Name</th><th>Service</th><th>Phone</th><th className="text-right">Status</th></tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id} className="border-b border-slate-100">
                        <td className="py-3 text-slate-900">{booking.preferred_date}</td>
                        <td>{booking.client_name}</td>
                        <td>{booking.service_requested}</td>
                        <td>{booking.client_phone}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-900' : booking.status === 'cancelled' ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-900'}`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Bookings received</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Manage requests</h2>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50"
            >
              <ArrowRight size={16} /> Refresh
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.35em] text-slate-500">
                <tr>
                  <th className="py-3">Date</th>
                  <th>Name</th>
                  <th>Service</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 text-slate-900">{booking.preferred_date}</td>
                    <td>{booking.client_name}</td>
                    <td>{booking.service_requested}</td>
                    <td>{booking.client_phone}</td>
                    <td>
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-900' : booking.status === 'cancelled' ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-900'}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {booking.status === 'pending' && (
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              changeBookingStatus(booking, 'confirmed');
                              sendWhatsAppMessage(booking, true);
                            }}
                            className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              changeBookingStatus(booking, 'cancelled');
                              sendWhatsAppMessage(booking, false);
                            }}
                            className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => changeBookingStatus(booking, 'cancelled')}
                          className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-rose-500">Edit day</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{formatDisplay(selectedDate)}</h2>
              </div>
              <button type="button" onClick={() => setPopupOpen(false)} className="text-slate-400 transition hover:text-slate-700">
                <ChevronLeft size={24} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {Object.entries(STATUSES).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedStatus(key as AvailabilityStatus)}
                  className={`flex w-full items-center justify-between rounded-3xl border px-5 py-4 text-left text-sm font-semibold transition ${
                    selectedStatus === key ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50 hover:border-rose-200'
                  }`}
                >
                  <span>{info.emoji} {info.label}</span>
                  {selectedStatus === key && <CheckCircle2 className="text-rose-500" />}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPopupOpen(false)}
                className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDateStatus}
                disabled={saving}
                className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
