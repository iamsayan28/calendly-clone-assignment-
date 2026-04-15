import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CalendarDays, Clock, Ban, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import { api } from '../api';
import type { Booking } from '../types';

type Tab = 'upcoming' | 'past';

const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function formatDateTime(isoStr: string, tz: string): string {
  const zoned = toZonedTime(new Date(isoStr), tz);
  return format(zoned, 'EEE, MMM d, yyyy · h:mm aaa');
}

function formatTimeRange(startISO: string, endISO: string, tz: string): string {
  const s = toZonedTime(new Date(startISO), tz);
  const e = toZonedTime(new Date(endISO), tz);
  return `${format(s, 'h:mm aaa')} – ${format(e, 'h:mm aaa')}`;
}

export default function MeetingsPage() {
  const [tab,      setTab]      = useState<Tab>('upcoming');
  const [meetings, setMeetings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchMeetings = (t: Tab) => {
    setLoading(true);
    setError('');
    api.meetings.list(t)
      .then(setMeetings)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMeetings(tab); }, [tab]);

  const handleCancel = async (id: string, name: string) => {
    if (!confirm(`Cancel meeting with ${name}?`)) return;
    setCancelling(id);
    try {
      await api.meetings.cancel(id);
      setMeetings(prev => prev.filter(m => m.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <Layout>
      <div style={{ padding: '32px 40px', maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
            Meetings
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>
            View and manage your scheduled meetings
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '1px solid var(--gray-200)',
          marginBottom: 24,
        }}>
          {(['upcoming', 'past'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'transparent',
                fontSize: 14,
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? 'var(--blue-primary)' : 'var(--gray-500)',
                borderBottom: tab === t ? '2px solid var(--blue-primary)' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'color 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* States */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 80, background: 'var(--gray-100)',
                borderRadius: 10, animation: 'pulse 1.5s infinite',
              }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{
            padding: '14px 18px', background: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: 8,
            color: '#DC2626', fontSize: 14,
          }}>{error}</div>
        )}

        {!loading && !error && meetings.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '80px 20px', color: 'var(--gray-400)',
          }}>
            <CalendarDays size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>
              No {tab} meetings
            </p>
            <p style={{ fontSize: 13, marginTop: 6 }}>
              {tab === 'upcoming'
                ? 'Share your booking link to get meetings scheduled.'
                : 'Past meetings will appear here.'}
            </p>
          </div>
        )}

        {/* Meeting cards */}
        {!loading && meetings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meetings.map(m => (
              <div key={m.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '18px 22px',
                borderLeft: m.status === 'cancelled'
                  ? '4px solid var(--gray-300)'
                  : '4px solid var(--blue-primary)',
                opacity: m.status === 'cancelled' ? 0.65 : 1,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'var(--blue-light)', color: 'var(--blue-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, flexShrink: 0,
                }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4,
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</span>
                    {m.status === 'cancelled' && (
                      <span className="badge badge-red">Cancelled</span>
                    )}
                    {m.status === 'booked' && tab === 'upcoming' && (
                      <span className="badge badge-blue">Upcoming</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 2 }}>
                    {m.email} · {m.event_type_name}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, color: 'var(--gray-600)',
                  }}>
                    <CalendarDays size={13} />
                    {formatDateTime(m.start_time, USER_TZ)}
                    <span style={{ color: 'var(--gray-300)' }}>·</span>
                    <Clock size={13} />
                    {formatTimeRange(m.start_time, m.end_time, USER_TZ)}
                  </div>
                </div>

                {/* Actions */}
                {m.status === 'booked' && tab === 'upcoming' && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <a
                      href={`/bookings/reschedule/${m.id}`}
                      className="btn-outline"
                      style={{ fontSize: 13, padding: '6px 14px', textDecoration: 'none' }}
                    >
                      <RefreshCw size={13} />
                      Reschedule
                    </a>
                    <button
                      className="btn-danger"
                      onClick={() => handleCancel(m.id, m.name)}
                      disabled={cancelling === m.id}
                      style={{ fontSize: 13, padding: '6px 14px' }}
                    >
                      <Ban size={13} style={{ display: 'inline', marginRight: 4 }} />
                      {cancelling === m.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
