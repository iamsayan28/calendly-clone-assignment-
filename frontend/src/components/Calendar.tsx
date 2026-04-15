import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Availability } from '../types';

interface CalendarProps {
  availabilities:  Availability[];
  selectedDate:    Date | null;
  onSelectDate:    (date: Date) => void;
}

/**
 * Returns the set of weekdays (0–6) that have availability defined.
 */
function getAvailableDays(availabilities: Availability[]): Set<number> {
  return new Set(availabilities.map(a => a.day_of_week));
}

export default function Calendar({ availabilities, selectedDate, onSelectDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const availableDays = getAvailableDays(availabilities);
  const today = startOfDay(new Date());

  const monthStart  = startOfMonth(currentMonth);
  const monthEnd    = endOfMonth(currentMonth);
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sun
  const calEnd      = endOfWeek(monthEnd,     { weekStartsOn: 0 });

  // Build grid of weeks
  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const isAvailable = (d: Date) =>
    isSameMonth(d, currentMonth) &&
    !isBefore(d, today) &&
    availableDays.has(d.getDay());

  const isPast = (d: Date) => isBefore(d, today);

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Month navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <button
          className="btn-ghost"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          style={{ padding: '6px' }}
        >
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--gray-800)' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          className="btn-ghost"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          style={{ padding: '6px' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        marginBottom: 8,
      }}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--gray-400)',
            letterSpacing: '0.05em',
            paddingBottom: 6,
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {week.map((d, di) => {
              const inMonth  = isSameMonth(d, currentMonth);
              const avail    = isAvailable(d);
              const past     = isPast(d);
              const selected = selectedDate ? isSameDay(d, selectedDate) : false;
              const todayDay = isToday(d);

              let bg    = 'transparent';
              let color = 'var(--gray-300)';
              let cursor = 'default';
              let border = '2px solid transparent';

              if (inMonth && !past) {
                if (avail) {
                  // Available: blue-ish, clickable
                  color  = 'var(--blue-primary)';
                  cursor = 'pointer';
                  bg     = selected ? 'var(--blue-primary)' : 'transparent';
                  color  = selected ? 'white' : 'var(--blue-primary)';
                  border = !selected && todayDay ? '2px solid var(--blue-primary)' : '2px solid transparent';
                } else {
                  // Unavailable (not in schedule): Gray, not clickable
                  color  = 'var(--gray-400)';
                  cursor = 'not-allowed';
                }
              }

              return (
                <button
                  key={di}
                  disabled={!avail}
                  onClick={() => avail && onSelectDate(d)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '50%',
                    border,
                    background: bg,
                    color,
                    fontSize: 14,
                    fontWeight: avail ? 500 : 400,
                    cursor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s, color 0.15s',
                    opacity: inMonth ? 1 : 0,
                  }}
                  onMouseEnter={e => {
                    if (avail && !selected) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue-light)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (avail && !selected) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }
                  }}
                >
                  {format(d, 'd')}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 16, marginTop: 16,
        fontSize: 12, color: 'var(--gray-500)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--blue-primary)', display: 'inline-block',
          }} />
          Available
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--gray-300)', display: 'inline-block',
          }} />
          Unavailable
        </span>
      </div>
    </div>
  );
}
