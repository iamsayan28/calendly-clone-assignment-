import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Clock, Globe, CalendarDays, ChevronLeft, CheckCircle, Copy } from 'lucide-react';
import Calendar from '../components/Calendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import { api } from '../api';
import type { EventType, Availability, TimeSlot, BookingConfirmation } from '../types';

type Step = 'select' | 'form' | 'confirmed';

const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function formatDateHeader(date: Date): string {
  return format(date, 'EEEE, MMMM d');
}

function formatSlotDisplay(isoStr: string, tz: string): string {
  return format(toZonedTime(new Date(isoStr), tz), 'h:mm aaa');
}

function formatConfirmation(start: string, end: string, tz: string): string {
  const s = toZonedTime(new Date(start), tz);
  const e = toZonedTime(new Date(end), tz);
  return `${format(s, 'h:mm aaa')} – ${format(e, 'h:mm aaa')}, ${format(s, 'EEEE MMMM d, yyyy')}`;
}

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();

  const [eventType,     setEventType]     = useState<EventType | null>(null);
  const [availability,  setAvailability]  = useState<Availability[]>([]);
  const [selectedDate,  setSelectedDate]  = useState<Date | null>(null);
  const [slots,         setSlots]         = useState<TimeSlot[]>([]);
  const [selectedSlot,  setSelectedSlot]  = useState<TimeSlot | null>(null);
  const [slotsLoading,  setSlotsLoading]  = useState(false);
  const [step,          setStep]          = useState<Step>('select');
  const [confirmation,  setConfirmation]  = useState<BookingConfirmation | null>(null);
  const [error,         setError]         = useState('');
  const [pageLoading,   setPageLoading]   = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [copied,        setCopied]        = useState(false);

  // Form fields
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');

  // Load event type + availability
  useEffect(() => {
    if (!slug) return;
    Promise.all([
      api.eventTypes.list(),
      fetch(`/api/availability`).then(() => null).catch(() => null), // warm up
    ]).then(([types]) => {
      const et = types.find(t => t.slug === slug);
      if (!et) { setError('Event type not found'); return; }
      setEventType(et);
      return api.availability.get(et.id);
    }).then(avails => {
      if (avails) setAvailability(avails);
    }).catch(e => setError(e.message))
      .finally(() => setPageLoading(false));
  }, [slug]);

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate || !slug) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    api.booking.getSlots(slug, dateStr)
      .then(res => setSlots(res.slots))
      .catch(e => setError(e.message))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, slug]);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('form');
    setError('');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !selectedSlot) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await api.booking.create(slug, {
        name,
        email,
        start_time: selectedSlot.start,
      });
      setConfirmation(result);
      setStep('confirmed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyRescheduleLink = () => {
    if (!confirmation) return;
    navigator.clipboard.writeText(
      `${window.location.origin}${confirmation.rescheduleLink}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (pageLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--gray-50)',
      }}>
        <div style={{ color: 'var(--gray-400)', fontSize: 15 }}>Loading…</div>
      </div>
    );
  }

  if (error && !eventType) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--gray-50)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
          <CalendarDays size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: 18, fontWeight: 600 }}>Event type not found</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>
            The link you followed may be invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  // ─── Confirmed State ───────────────────────────────────────────────────────
  if (step === 'confirmed' && confirmation) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--gray-50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '48px 40px',
          maxWidth: 480, width: '100%',
          textAlign: 'center',
        }}>
          <CheckCircle size={52} style={{ color: '#10B981', margin: '0 auto 20px' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            You're scheduled!
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 28 }}>
            A calendar invitation has been sent to <strong>{confirmation.booking.email}</strong>.
          </p>

          <div style={{
            background: 'var(--gray-50)', borderRadius: 10,
            padding: '18px 20px', textAlign: 'left', marginBottom: 28,
          }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>
              {eventType?.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' }}>
                <Clock size={14} /> {eventType?.duration} min
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' }}>
                <CalendarDays size={14} />
                {formatConfirmation(confirmation.booking.start_time, confirmation.booking.end_time, USER_TZ)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' }}>
                <Globe size={14} /> {USER_TZ}
              </div>
            </div>
          </div>

          {/* Reschedule link */}
          <div style={{
            border: '1px solid var(--gray-200)', borderRadius: 8,
            padding: '14px 16px',
          }}>
            <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>
              Need to reschedule? Use this link:
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{
                flex: 1, fontSize: 11, color: 'var(--blue-primary)',
                background: 'var(--blue-light)', padding: '6px 10px',
                borderRadius: 6, wordBreak: 'break-all',
              }}>
                {window.location.origin}{confirmation.rescheduleLink}
              </code>
              <button className="btn-outline" onClick={copyRescheduleLink}
                style={{ padding: '6px 10px', flexShrink: 0 }}>
                <Copy size={13} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Booking Layout ───────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#F3F4F6',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        display: 'flex',
        maxWidth: 860,
        width: '100%',
        minHeight: 540,
        overflow: 'hidden',
      }}>
        {/* ── Left Panel: Event Info ── */}
        <div style={{
          width: 260, flexShrink: 0,
          padding: '32px 28px',
          borderRight: '1px solid var(--gray-200)',
          background: 'white',
        }}>
          {/* Back button (shown in form step) */}
          {step === 'form' && (
            <button
              className="btn-ghost"
              onClick={() => { setStep('select'); setSelectedSlot(null); }}
              style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 6, fontWeight: 500 }}>
            Sayan Mandal
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>
            {eventType?.name}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' }}>
              <Clock size={14} />
              <span>{eventType?.duration} min</span>
            </div>

            {selectedSlot && step === 'form' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' }}>
                <CalendarDays size={14} />
                <span>
                  {formatSlotDisplay(selectedSlot.start, USER_TZ)} – {formatSlotDisplay(selectedSlot.end, USER_TZ)},&nbsp;
                  {selectedDate ? formatDateHeader(selectedDate) : ''}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' }}>
              <Globe size={14} />
              <span style={{ wordBreak: 'break-word' }}>{USER_TZ}</span>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div style={{ flex: 1, padding: '32px 32px' }}>
          {step === 'select' && (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 24 }}>
                Select a Date &amp; Time
              </h2>

              <div style={{ display: 'flex', gap: 32 }}>
                {/* Calendar */}
                <div style={{ flex: '0 0 auto', minWidth: 280 }}>
                  <Calendar
                    availabilities={availability}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                  />
                </div>

                {/* Time Slots (shown when date selected) */}
                {selectedDate && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: 14,
                      color: 'var(--gray-700)', marginBottom: 16,
                    }}>
                      {formatDateHeader(selectedDate)}
                    </div>
                    <TimeSlotPicker
                      slots={slots}
                      selectedSlot={selectedSlot}
                      timezone={USER_TZ}
                      onSelect={handleSlotSelect}
                      loading={slotsLoading}
                    />
                  </div>
                )}
              </div>

              {/* Timezone notice */}
              <div style={{
                marginTop: 24, display: 'flex', alignItems: 'center',
                gap: 6, fontSize: 13, color: 'var(--gray-500)',
              }}>
                <Globe size={13} />
                <span>Times shown in <strong>{USER_TZ}</strong></span>
              </div>
            </>
          )}

          {step === 'form' && (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 24 }}>
                Enter Details
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

              <form onSubmit={handleBookingSubmit} style={{ maxWidth: 380 }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    className="form-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <p style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 20, lineHeight: 1.5 }}>
                  By proceeding, you confirm that you have read and agree to the Terms and Privacy Notice.
                </p>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ padding: '11px 28px', borderRadius: 9, fontSize: 15 }}
                >
                  {submitting ? 'Scheduling…' : 'Schedule Event'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
