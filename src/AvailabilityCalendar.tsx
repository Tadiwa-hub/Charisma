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
    <div className="bg-white p-6 rounded-2xl border border-[#F0EBEB] luxury-shadow space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#F0EBEB]">
        <div>
          <h4 className="text-base font-garamond font-bold tracking-wider text-[#1A1A1A]">Select Date</h4>
          <p className="text-xs font-inter text-[#6B6B6B]">Select a preferred slot below</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="w-8 h-8 rounded-full border border-[#F0EBEB] flex items-center justify-center text-xs text-[#6B6B6B] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all active-press"
          >
            ←
          </button>
          <span className="text-sm font-garamond font-bold tracking-wide text-[#1A1A1A] min-w-[100px] text-center">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="w-8 h-8 rounded-full border border-[#F0EBEB] flex items-center justify-center text-xs text-[#6B6B6B] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all active-press"
          >
            →
          </button>
        </div>
      </div>

      {/* Weekday Titles */}
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-inter font-semibold uppercase tracking-widest text-[#AAAAAA]">
        {DAY_LABELS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {monthGrid.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="aspect-square rounded-xl bg-[#FDF9F7]/40" />;
          }

          const isoDate = formatDate(cell);
          const status = (availabilityMap[isoDate] as AvailabilityStatus) || getDefaultStatus(isoDate);
          const isSelected = selectedDate === isoDate;
          const isFullyBooked = status === 'fully_booked';
          const isAppointmentOnly = status === 'appointment_only';

          return (
            <button
              key={isoDate}
              type="button"
              onClick={() => !isFullyBooked && onSelectDate(isoDate)}
              disabled={isFullyBooked}
              className={`group relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 text-center transition-all active-press ${
                isSelected 
                  ? 'border-[#C9A96E] bg-[#FDF9F7] text-[#1A1A1A] font-semibold' 
                  : 'border-[#F0EBEB] bg-white hover:border-[#C9A96E]/50 text-[#1A1A1A]'
              } ${isFullyBooked ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
            >
              {/* Date Number with Availability Modifiers */}
              <div className="relative">
                <span className={`text-sm font-inter ${
                  isFullyBooked ? 'text-[#E53935] line-through font-normal' : ''
                } ${
                  isSelected ? 'font-bold' : 'font-medium'
                }`}>
                  {cell.getDate()}
                </span>
                
                {/* Appointment Only Asterisk */}
                {isAppointmentOnly && (
                  <span className="absolute -top-1.5 -right-2 text-[#C9A96E] text-xs font-bold font-inter">
                    *
                  </span>
                )}
              </div>

              {/* Minimal text label for accessibility / details */}
              <span className={`text-[8px] uppercase tracking-tighter mt-0.5 block ${
                isFullyBooked 
                  ? 'text-[#E53935]/70' 
                  : isAppointmentOnly 
                    ? 'text-[#C9A96E]' 
                    : isSelected 
                      ? 'text-[#C9A96E]' 
                      : 'text-[#AAAAAA] opacity-0 group-hover:opacity-100 transition-opacity'
              }`}>
                {isFullyBooked ? 'Booked' : isAppointmentOnly ? 'Appt Only' : 'Select'}
              </span>

              {/* Highlight bar for selection */}
              {isSelected && (
                <div className="absolute bottom-1 w-4 h-[2px] bg-[#C9A96E] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-[#F0EBEB] text-[11px] font-inter text-[#6B6B6B]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-[#F0EBEB] bg-white inline-block" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#E53935] font-bold line-through">15</span>
          <span>Fully Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#C9A96E] font-bold text-xs">*</span>
          <span>Appointment Only</span>
        </div>
      </div>

      {loading && (
        <div className="skeleton-bg rounded-xl p-3 text-center text-xs font-inter text-[#6B6B6B]">
          Loading availability slots…
        </div>
      )}
    </div>
  );
}
