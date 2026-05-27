import { useMemo } from 'react';
import type { AvailabilityEntry, AvailabilityStatus } from './types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultStatus(dateString: string): AvailabilityStatus {
  const date = new Date(dateString);
  return date.getDay() === 0 ? 'appointment_only' : 'open';
}

export function getDateStatus(dateString: string, availability: AvailabilityEntry[]) {
  const override = availability.find((entry) => entry.date === dateString);
  return override?.status || getDefaultStatus(dateString);
}

interface Props {
  availability: AvailabilityEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  currentMonth: Date;
  onMonthChange: (nextMonth: Date) => void;
  loading: boolean;
}

export default function AvailabilityCalendar({
  availability,
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
  loading,
}: Props) {
  const monthGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const cells: Array<Date | null> = [];

    for (let i = 0; i < firstDayIndex; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }

    return cells;
  }, [currentMonth]);

  const availabilityMap = useMemo(() => {
    return availability.reduce<Record<string, AvailabilityStatus>>((acc, entry) => {
      acc[entry.date] = entry.status;
      return acc;
    }, {});
  }, [availability]);

  const monthLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm uppercase tracking-[0.35em] text-rose-gold">Preferred Date</h4>
          <p className="text-xs text-slate-400">Tap a date to select from the calendar.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="rounded-sm border border-slate-700 px-3 py-1 hover:border-rose-gold/70"
          >
            Prev
          </button>
          <span className="font-semibold">{monthLabel}</span>
          <button
            type="button"
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="rounded-sm border border-slate-700 px-3 py-1 hover:border-rose-gold/70"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">
        {DAY_LABELS.map((day) => (
          <div key={day} className="text-center font-semibold">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {monthGrid.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="h-14 rounded-lg bg-white/5" />;
          }

          const isoDate = formatDate(cell);
          const status = (availabilityMap[isoDate] as AvailabilityStatus) || getDefaultStatus(isoDate);
          const isSelected = selectedDate === isoDate;
          const isFullyBooked = status === 'fully_booked';
          const statusStyle = status === 'open'
            ? 'bg-emerald-100 text-emerald-900'
            : status === 'appointment_only'
              ? 'bg-amber-100 text-amber-900'
              : 'bg-rose-100 text-rose-900';

          return (
            <button
              key={isoDate}
              type="button"
              onClick={() => !isFullyBooked && onSelectDate(isoDate)}
              disabled={isFullyBooked}
              className={`group relative min-h-[3.5rem] rounded-lg border px-2 py-2 text-left text-xs transition-all ${
                isSelected ? 'border-rose-gold bg-rose-gold/10 shadow-sm' : 'border-white/10 bg-white/5 hover:border-rose-gold/30 hover:bg-white/10'
              } ${isFullyBooked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${status === 'appointment_only' ? 'ring-amber-200/50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{cell.getDate()}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle}`}>
                  {status === 'open' ? '🟢' : status === 'appointment_only' ? '🟡' : '🔴'}
                </span>
              </div>
              <div className="mt-2 text-[10px] leading-tight text-slate-300">
                {status === 'open' ? 'Available' : status === 'appointment_only' ? 'Appointment only' : 'Fully booked'}
              </div>
              {isFullyBooked && (
                <div className="pointer-events-none absolute inset-0 rounded-lg bg-black/10" />
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="rounded-lg border border-rose-gold/20 bg-white/5 p-4 text-center text-sm text-slate-200">
          Loading availability…
        </div>
      )}
    </div>
  );
}
