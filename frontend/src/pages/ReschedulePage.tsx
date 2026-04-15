import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Clock, CalendarDays, Globe, CheckCircle, RefreshCw } from 'lucide-react';
import Calendar from '../components/Calendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import { api } from '../api';
import type { Booking, Availability, TimeSlot, EventType } from '../types';

type Step = 'select' | 'confirmed';

const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function formatDateTime(isoStr: string, tz: string): string {
  const z = toZonedTime(new Date(isoStr), tz);
  return format(z, 'EEEE MMMM d, yyyy · h:mm aaa');
}

export default function ReschedulePage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();

  const [booking,       setBooking]       = useState<Booking | null>(null);
  const [eventType,     setEventType]     = useState<EventType | null>(null);
  const [availability,  setAvailability]  = useState<Availability[]>([]);
  const [selectedDate,  setSelectedDate]  = useState<Date | null>(null);
  const [slots,         setSlots]         = useState<TimeSlot[]>([]);
  const [slotsLoading,  setSlotsLoading]  = useState(false);
  const [step,          setStep]          = useState<Step>('select');
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');

  // Load reschedule data
  useEffect(() => {
    if (!id) return;
    api.reschedule.get(id)
      .then(async bk => {
        setBooking(bk);
        // Load event type + availability
        const [types, avails] = await Promise.all([
          api.eventTypes.list(),
          api.availability.get(bk.event_type_id),
        ]);
        const et = types.find(t => t.id === bk.event_type_id);
        if (et) setEventType(et);
        setAvailability(avails);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate || !eventType) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    setSlotsLoading(true);
    setSlots([]);
    api.booking.getSlots(eventType.slug, dateStr)
      .then(res => setSlots(res.slots))
      .catch(e => setError(e.message))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, eventType]);

  const handleSlotSelect = async (slot: TimeSlot) => {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api.reschedule.update(id, slot.start);
      setBooking(updated);
      setStep('confirmed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--gray-50)',
      }}>
        <div style={{ color: 'var(--gray-400)' }}>Loading booking…</div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--gray-50)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 40 }}>
          <CalendarDays size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Booking not found</p>
          <p style={{ fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  // ─── Confirmed ─────────────────────────────────────────────────────────────
  if (step === 'confirmed' && booking) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--gray-50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
      }}>
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '48px 40px', maxWidth: 460, width: '100%', textAlign: 'center',
        }}>
          <CheckCircle size={52} style={{ color: '#10B981', margin: '0 auto 20px' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Rescheduled!</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 28 }}>
            Your meeting has been rescheduled successfully.
          </p>

          <div style={{
            background: 'var(--gray-50)', borderRadius: 10,
            padding: '18px 20px', textAlign: 'left',
          }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>
              {eventType?.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' }}>
                <CalendarDays size={14} />
                {formatDateTime(booking.start_time, USER_TZ)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' }}>
                <Globe size={14} /> {USER_TZ}
              </div>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => navigate('/')}
            style={{ marginTop: 28, padding: '10px 24px' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Reschedule Layout ─────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#F3F4F6',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        background: 'white', borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        display: 'flex', maxWidth: 860, width: '100%',
        minHeight: 540, overflow: 'hidden',
      }}>
        {/* Left Panel */}
        <div style={{
          width: 260, flexShrink: 0, padding: '32px 28px',
          borderRight: '1px solid var(--gray-200)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', background: '#FFF7ED', borderRadius: 9999,
            fontSize: 12, color: '#C2410C', fontWeight: 500, marginBottom: 20,
          }}>
            <RefreshCw size={12} /> Rescheduling
          </div>

          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 6, fontWeight: 500 }}>
            Sayan Mandal
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>
            {eventType?.name}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>
              <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>Current slot:</span><br />
              {booking && formatDateTime(booking.start_time, USER_TZ)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' }}>
              <Clock size={14} /> {eventType?.duration} min
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' }}>
              <Globe size={14} />
              <span style={{ wordBreak: 'break-word' }}>{USER_TZ}</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, padding: '32px 32px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 24 }}>
            Choose a New Time
          </h2>

          {error && (
            <div style={{
              padding: '12px 16px', background: '#FEF2F2',
              border: '1px solid #FECACA', borderRadius: 8,
              color: '#DC2626', fontSize: 14, marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ flex: '0 0 auto', minWidth: 280 }}>
              <Calendar
                availabilities={availability}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>

            {selectedDate && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: 14,
                  color: 'var(--gray-700)', marginBottom: 16,
                }}>
                  {format(selectedDate, 'EEEE, MMMM d')}
                </div>
                <TimeSlotPicker
                  slots={slots}
                  selectedSlot={null}
                  timezone={USER_TZ}
                  onSelect={saving ? () => {} : handleSlotSelect}
                  loading={slotsLoading || saving}
                />
                {saving && (
                  <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 12 }}>
                    Rescheduling your meeting…
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
