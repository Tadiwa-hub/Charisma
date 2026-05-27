import { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  LogOut,
  Users,
  Shield,
  ArrowRight,
  Calendar,
  AlertCircle,
  TrendingUp
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
  open: { label: 'Open', style: 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20', emoji: '🟢' },
  fully_booked: { label: 'Fully Booked', style: 'bg-[#E53935]/10 text-[#E53935] border border-[#E53935]/20', emoji: '🔴' },
  appointment_only: { label: 'Appointment Only', style: 'bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20', emoji: '🟡' },
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

function formatDateToSlashes(dateStr: string): string {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

function getDefaultStatus(dateString: string): AvailabilityStatus {
  return new Date(dateString).getDay() === 0 ? 'appointment_only' : 'open';
}

export default function AdminApp() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [, setLoadingAvailability] = useState(false);
  const [, setLoadingBookings] = useState(false);
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
    const formattedDate = formatDateToSlashes(booking.preferred_date);
    const message = confirmed
      ? `Hi ${booking.client_name}! Your booking for ${booking.service_requested} on ${formattedDate} at Charisma Beauty Studio has been confirmed. Please ensure your $10 deposit has been sent to +263 777554619. See you then! 💄`
      : `Hi ${booking.client_name}, unfortunately we are unable to accommodate your booking for ${formattedDate}. Please contact us to reschedule. We apologise for any inconvenience.`;

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

  // --- Login Redesign screen ---
  if (!loggedIn) {
    const isLocked = Boolean(lockUntil && lockUntil > Date.now());
    const remainingMin = isLocked && lockUntil ? Math.ceil((lockUntil - Date.now()) / 60000) : 0;

    return (
      <div className="min-h-screen bg-[#FDF9F7] text-[#1A1A1A] font-inter flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[480px] bg-white border border-[#F0EBEB] rounded-[24px] p-8 md:p-10 shadow-luxury space-y-8">
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FDF9F7] border border-[#F0EBEB] flex items-center justify-center mx-auto text-[#C9A96E]">
              <Shield size={22} />
            </div>
            <h1 className="text-3xl font-garamond font-bold tracking-wider text-[#1A1A1A]">
              Charisma Admin
            </h1>
            <p className="text-xs font-inter text-[#6B6B6B]">
              Enter password to access studio logs and calendar
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-inter font-semibold text-[#1A1A1A]">
                Secure Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAFAFA] border border-[#E8E0E0] rounded-[10px] px-4 h-[50px] font-inter text-[15px] focus:border-[#C9A96E] outline-none transition-all placeholder-[#AAAAAA]"
                disabled={isLocked}
              />
            </div>

            {loginError && (
              <div className="p-3 bg-[#E53935]/5 border border-[#E53935]/15 rounded-lg flex items-center gap-2 text-xs text-[#E53935] animate-fade-in">
                <AlertCircle size={14} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {isLocked && (
              <p className="text-xs text-[#6B6B6B] italic text-center">
                Portal locked. Please retry in {remainingMin} min.
              </p>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={isLocked}
              className="w-full h-[52px] bg-[#C9A96E] hover:bg-[#B8935A] text-white rounded-[10px] font-inter font-semibold tracking-wider transition-all duration-300 active-press shadow-md disabled:bg-[#AAAAAA] disabled:opacity-50"
            >
              Unlock Admin Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Dashboard Redesign screen ---
  return (
    <div className="min-h-screen bg-[#FDF9F7] text-[#1A1A1A] font-inter flex flex-col md:flex-row">
      
      {/* Side panel navbar */}
      <aside className="w-full md:w-64 bg-white border-r border-[#F0EBEB] flex flex-col justify-between p-6 shrink-0">
        <div className="space-y-8">
          
          {/* Logo */}
          <div>
            <h1 className="text-24px font-garamond font-bold text-[#C9A96E] tracking-widest uppercase">Charisma</h1>
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#AAAAAA] block -mt-1 font-semibold">
              Secret Admin Portal
            </span>
          </div>

          {/* Quick Stats side info */}
          <div className="space-y-4 pt-4 border-t border-[#F0EBEB]">
            <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider block">Studio details</span>
            <div className="space-y-3 font-inter text-xs text-[#6B6B6B]">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#C9A96E]" />
                <span>Mon-Sat: 8:30-17:30</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#C9A96E]" />
                <span>Sun: Appointment Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout bottom action */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 border border-[#F0EBEB] rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#E53935] hover:border-[#E53935]/30 transition-all flex items-center justify-center gap-2 active-press mt-8"
        >
          <LogOut size={14} />
          <span>Logout Portal</span>
        </button>
      </aside>

      {/* Main Panel space */}
      <main className="flex-1 p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full overflow-hidden">
        
        {/* Top Info Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#F0EBEB]">
          <div>
            <h2 className="text-2xl md:text-3xl font-garamond font-bold tracking-tight text-[#1A1A1A]">
              Dashboard Overview
            </h2>
            <p className="text-xs text-[#6B6B6B] mt-0.5">Manage appointment requests and block calendar slots</p>
          </div>
          
          <button 
            type="button" 
            onClick={loadData}
            className="px-4 py-2 border border-[#F0EBEB] bg-white rounded-lg text-xs font-semibold text-[#6B6B6B] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all active-press flex items-center gap-2 shadow-sm"
          >
            Refresh Database
          </button>
        </div>

        {/* Action/Error Notification Bar */}
        {actionMessage && (
          <div className="p-4 bg-[#FDF9F7] border border-[#C9A96E]/20 rounded-xl text-xs text-[#C9A96E] font-medium flex items-center gap-2 animate-fade-in shadow-sm">
            <CheckCircle2 size={16} className="text-[#C9A96E]" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Stat cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Stats Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0EBEB] shadow-luxury flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FDF9F7] border border-[#F0EBEB] flex items-center justify-center text-[#C9A96E] shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] text-[#AAAAAA] uppercase tracking-wider font-semibold block">Bookings This Week</span>
              <span className="text-2xl font-bold font-inter text-[#1A1A1A] block mt-0.5">{bookingsThisWeek}</span>
            </div>
          </div>

          {/* Stats Card 2 */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0EBEB] shadow-luxury flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FDF9F7] border border-[#F0EBEB] flex items-center justify-center text-[#C9A96E] shrink-0">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[10px] text-[#AAAAAA] uppercase tracking-wider font-semibold block">Pending Requests</span>
              <span className="text-2xl font-bold font-inter text-[#1A1A1A] block mt-0.5">{pendingCount}</span>
            </div>
          </div>

          {/* Stats Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0EBEB] shadow-luxury flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FDF9F7] border border-[#F0EBEB] flex items-center justify-center text-[#C9A96E] shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-[10px] text-[#AAAAAA] uppercase tracking-wider font-semibold block">Fully Booked Days</span>
              <span className="text-2xl font-bold font-inter text-[#1A1A1A] block mt-0.5">{fullyBookedDaysThisMonth}</span>
            </div>
          </div>

        </div>

        {/* Middle Panel layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Availability Calendar grid (Left cols 2) */}
          <div className="bg-white rounded-2xl border border-[#F0EBEB] p-6 shadow-luxury lg:col-span-2 space-y-6">
            
            <div className="flex justify-between items-center pb-2 border-b border-[#F0EBEB]">
              <div>
                <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider block">STUDIO SPACE</span>
                <h3 className="text-lg font-garamond font-bold text-[#1A1A1A] mt-0.5">Availability Grid</h3>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  className="w-8 h-8 rounded-full border border-[#F0EBEB] flex items-center justify-center text-xs text-[#6B6B6B] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all active-press"
                >
                  ←
                </button>
                <span className="text-sm font-garamond font-bold text-[#1A1A1A]">{currentMonthLabel}</span>
                <button 
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  className="w-8 h-8 rounded-full border border-[#F0EBEB] flex items-center justify-center text-xs text-[#6B6B6B] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all active-press"
                >
                  →
                </button>
              </div>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-inter font-semibold uppercase tracking-widest text-[#AAAAAA]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-2">
              {monthCells.map((cell, index) => {
                if (!cell) {
                  return <div key={`empty-${index}`} className="aspect-square rounded-xl bg-[#FDF9F7]/40" />;
                }

                const isoDate = formatDate(cell);
                const status = getCellStatus(cell);
                const isToday = formatDate(cell) === formatDate(new Date());

                return (
                  <button
                    key={isoDate}
                    type="button"
                    onClick={() => handleDateCellClick(cell)}
                    className={`group relative aspect-square rounded-xl border flex flex-col justify-between p-2.5 text-left transition-all active-press ${
                      isToday 
                        ? 'border-[#C9A96E] bg-[#FDF9F7]' 
                        : 'border-[#F0EBEB] bg-white hover:border-[#C9A96E]/50'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${isToday ? 'text-[#C9A96E]' : 'text-[#1A1A1A]'}`}>
                      {cell.getDate()}
                    </span>

                    {/* Small Status indicator */}
                    <div className="w-full flex justify-end">
                      <span className={`w-2 h-2 rounded-full block border ${
                        status === 'open' 
                          ? 'bg-[#4CAF50] border-[#4CAF50]/30' 
                          : status === 'fully_booked' 
                            ? 'bg-[#E53935] border-[#E53935]/30' 
                            : 'bg-[#C9A96E] border-[#C9A96E]/30'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend row */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-[#F0EBEB] text-[11px] font-inter text-[#6B6B6B]">
              {Object.entries(STATUSES).map(([key, info]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="text-xs">{info.emoji}</span>
                  <span className="font-semibold text-[#1A1A1A]">{info.label}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Bulk date selection panel (Right col 1) */}
          <div className="bg-white rounded-2xl border border-[#F0EBEB] p-6 shadow-luxury space-y-6">
            <div>
              <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider block">BULK SETTINGS</span>
              <h3 className="text-lg font-garamond font-bold text-[#1A1A1A] mt-0.5">Blockout Range</h3>
            </div>

            <div className="space-y-4 font-inter text-xs text-[#6B6B6B]">
              
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#1A1A1A]">From Date</label>
                <input
                  type="date"
                  value={bulkFrom}
                  onChange={(event) => setBulkFrom(event.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#E8E0E0] rounded-[10px] px-3 h-[45px] text-xs focus:border-[#C9A96E] outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#1A1A1A]">To Date</label>
                <input
                  type="date"
                  value={bulkTo}
                  onChange={(event) => setBulkTo(event.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#E8E0E0] rounded-[10px] px-3 h-[45px] text-xs focus:border-[#C9A96E] outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#1A1A1A]">Mark Status As</label>
                <select
                  value={bulkStatus}
                  onChange={(event) => setBulkStatus(event.target.value as AvailabilityStatus)}
                  className="w-full bg-[#FAFAFA] border border-[#E8E0E0] rounded-[10px] px-3 h-[45px] text-xs focus:border-[#C9A96E] outline-none transition-all cursor-pointer"
                >
                  <option value="fully_booked">Fully Booked</option>
                  <option value="appointment_only">Appointment Only</option>
                  <option value="open">Open</option>
                </select>
              </div>

              <button
                type="button"
                onClick={applyBulkChanges}
                disabled={saving}
                className="w-full h-[45px] bg-[#C9A96E] hover:bg-[#B8935A] text-white font-semibold rounded-[10px] uppercase tracking-wider transition-all duration-300 active-press shadow-sm mt-4 flex items-center justify-center disabled:bg-[#AAAAAA] disabled:opacity-50"
              >
                Apply Range blocker
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Booking requests table log */}
        <section className="bg-white rounded-2xl border border-[#F0EBEB] p-6 shadow-luxury space-y-6">
          
          <div className="flex justify-between items-center pb-2 border-b border-[#F0EBEB]">
            <div>
              <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider block">CLIENT LOGS</span>
              <h3 className="text-lg font-garamond font-bold text-[#1A1A1A] mt-0.5">Manage Booking Requests</h3>
            </div>
            
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2 border border-[#F0EBEB] bg-white rounded-lg text-xs font-semibold text-[#6B6B6B] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all active-press flex items-center gap-1 shadow-sm"
            >
              <ArrowRight size={14} />
              <span>Refresh bookings</span>
            </button>
          </div>

          {/* Bookings table data container */}
          <div className="w-full overflow-x-auto">
            {bookings.length === 0 ? (
              <p className="text-center text-xs text-[#AAAAAA] py-8">No booking requests logged in system</p>
            ) : (
              <table className="w-full text-left text-xs font-inter text-[#6B6B6B] min-w-[850px]">
                
                <thead className="border-b border-[#F0EBEB] text-[10px] text-[#AAAAAA] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="pb-3 pt-1">Client name</th>
                    <th className="pb-3 pt-1">Requested Service</th>
                    <th className="pb-3 pt-1">Target Date</th>
                    <th className="pb-3 pt-1">Phone Number</th>
                    <th className="pb-3 pt-1">Special Notes</th>
                    <th className="pb-3 pt-1">Status</th>
                    <th className="pb-3 pt-1 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-[#F0EBEB]/50 hover:bg-[#FDF9F7]/60 transition-colors">
                      <td className="py-4 font-bold text-[#1A1A1A]">{booking.client_name}</td>
                      <td className="py-4">{booking.service_requested}</td>
                      <td className="py-4 font-medium text-[#1A1A1A]">{formatDateToSlashes(booking.preferred_date)}</td>
                      <td className="py-4">{booking.client_phone}</td>
                      <td className="py-4 max-w-[200px] truncate">{booking.notes || 'None'}</td>
                      
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${
                          booking.status === 'confirmed' 
                            ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20' 
                            : booking.status === 'cancelled' 
                              ? 'bg-[#E53935]/10 text-[#E53935] border-[#E53935]/20' 
                              : 'bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/20'
                        }`}>
                          {booking.status}
                        </span>
                      </td>

                      <td className="py-4 text-right">
                        {booking.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                changeBookingStatus(booking, 'confirmed');
                                sendWhatsAppMessage(booking, true);
                              }}
                              className="px-3 py-1.5 bg-[#4CAF50] text-white hover:bg-[#43A047] font-semibold text-[11px] rounded-lg transition-all active-press"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                changeBookingStatus(booking, 'cancelled');
                                sendWhatsAppMessage(booking, false);
                              }}
                              className="px-3 py-1.5 bg-[#E53935] text-white hover:bg-[#D32F2F] font-semibold text-[11px] rounded-lg transition-all active-press"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => changeBookingStatus(booking, 'cancelled')}
                            className="px-3 py-1.5 border border-[#E53935]/30 text-[#E53935] hover:bg-[#E53935]/5 font-semibold text-[11px] rounded-lg transition-all active-press"
                          >
                            Cancel Slot
                          </button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            )}
          </div>

        </section>

      </main>

      {/* Date Editor Popup Modal Dialog */}
      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#F0EBEB] space-y-6">
            
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#F0EBEB]">
              <div>
                <span className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-wider block">Calendar Setting</span>
                <h2 className="text-xl font-garamond font-bold text-[#1A1A1A] mt-0.5">
                  {formatDisplay(selectedDate)}
                </h2>
              </div>
              
              <button 
                type="button" 
                onClick={() => setPopupOpen(false)} 
                className="w-8 h-8 rounded-full border border-[#F0EBEB] text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center justify-center transition-all active-press"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 font-inter">
              {Object.entries(STATUSES).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedStatus(key as AvailabilityStatus)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-xs font-semibold transition-all ${
                    selectedStatus === key 
                      ? 'border-[#C9A96E] bg-[#FDF9F7] text-[#1A1A1A]' 
                      : 'border-[#F0EBEB] bg-[#FAFAFA] hover:border-[#C9A96E]/50 text-[#6B6B6B]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{info.emoji}</span>
                    <span>{info.label}</span>
                  </span>
                  
                  {selectedStatus === key && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPopupOpen(false)}
                className="px-4 py-2 border border-[#F0EBEB] bg-white rounded-lg text-xs font-semibold text-[#6B6B6B] hover:border-[#C9A96E] transition-all active-press"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={saveDateStatus}
                disabled={saving}
                className="px-5 py-2 bg-[#C9A96E] hover:bg-[#B8935A] text-white rounded-lg text-xs font-semibold transition-all active-press shadow-sm disabled:bg-[#AAAAAA] disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
