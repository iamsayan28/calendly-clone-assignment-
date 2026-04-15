import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { TimeSlot } from '../types';

interface TimeSlotPickerProps {
  slots:        TimeSlot[];
  selectedSlot: TimeSlot | null;
  timezone:     string;
  onSelect:     (slot: TimeSlot) => void;
  loading:      boolean;
}

function formatTime(isoStr: string, tz: string): string {
  const zoned = toZonedTime(new Date(isoStr), tz);
  return format(zoned, 'h:mmaaa'); // e.g. "9:00am"
}

export default function TimeSlotPicker({
  slots,
  selectedSlot,
  timezone,
  onSelect,
  loading,
}: TimeSlotPickerProps) {
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            height: 44, background: 'var(--gray-100)',
            borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px 20px',
        color: 'var(--gray-400)', fontSize: 14,
      }}>
        No available slots for this day.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 420 }}>
      {slots.map((slot, i) => {
        const isSelected = selectedSlot?.start === slot.start;
        return (
          <button
            key={i}
            onClick={() => onSelect(slot)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: isSelected
                ? '2px solid var(--blue-primary)'
                : '1px solid var(--blue-border)',
              background: isSelected ? 'var(--blue-primary)' : 'white',
              color: isSelected ? 'white' : 'var(--blue-primary)',
              fontWeight: 500,
              fontSize: 15,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue-light)';
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = 'white';
              }
            }}
          >
            {formatTime(slot.start, timezone)}
          </button>
        );
      })}
    </div>
  );
}
