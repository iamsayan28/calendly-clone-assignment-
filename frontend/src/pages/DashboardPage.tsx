import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Copy, ExternalLink, Pencil, Trash2, Plus, CalendarDays } from 'lucide-react';
import Layout from '../components/Layout';
import { api } from '../api';
import type { EventType } from '../types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getAvailabilitySummary(avail: EventType['availability']): string {
  if (!avail || avail.length === 0) return 'No availability set';
  const days = avail.map(a => DAY_LABELS[a.day_of_week]);
  const time = `${avail[0].start_time} – ${avail[0].end_time}`;
  return `${days.join(', ')}, ${time}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState<string | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);

  useEffect(() => {
    api.eventTypes.list()
      .then(setEventTypes)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will also remove all bookings.`)) return;
    setDeleting(id);
    try {
      await api.eventTypes.delete(id);
      setEventTypes(prev => prev.filter(et => et.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Layout>
      <div style={{ padding: '32px 40px', maxWidth: 900 }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 28,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
              Scheduling
            </h1>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>
              Manage your event types and booking links
            </p>
          </div>
          <Link to="/event-types/new" className="btn-primary">
            <Plus size={16} />
            New Event Type
          </Link>
        </div>

        {/* States */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2].map(i => (
              <div key={i} style={{
                height: 88, background: 'white', border: '1px solid var(--gray-200)',
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
          }}>
            {error} — Make sure the backend is running.
          </div>
        )}

        {!loading && !error && eventTypes.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            color: 'var(--gray-400)',
          }}>
            <CalendarDays size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No event types yet</p>
            <p style={{ fontSize: 14, marginBottom: 24 }}>
              Create your first event type to start accepting bookings.
            </p>
            <Link to="/event-types/new" className="btn-primary">
              <Plus size={16} />
              Create Event Type
            </Link>
          </div>
        )}

        {/* Event type list */}
        {!loading && eventTypes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Section label */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              fontSize: 13, fontWeight: 600, color: 'var(--gray-600)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--blue-primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>S</div>
              Sayan Mandal
            </div>

            {eventTypes.map(et => (
              <div
                key={et.id}
                className="card"
                style={{
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderLeft: '4px solid var(--blue-primary)',
                  gap: 16,
                }}
              >
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--blue-primary)', marginBottom: 4 }}>
                    {et.name}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, color: 'var(--gray-500)',
                  }}>
                    <Clock size={12} />
                    <span>{et.duration} min</span>
                    <span>•</span>
                    <span>One-on-One</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 3 }}>
                    {getAvailabilitySummary(et.availability)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn-outline"
                    onClick={() => handleCopy(et.slug)}
                    style={{ fontSize: 13, padding: '6px 14px' }}
                  >
                    <Copy size={13} />
                    {copied === et.slug ? 'Copied!' : 'Copy link'}
                  </button>

                  <a
                    href={`/book/${et.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                    style={{ padding: '6px 8px' }}
                  >
                    <ExternalLink size={15} />
                  </a>

                  <button
                    className="btn-ghost"
                    onClick={() => navigate(`/event-types/${et.id}/edit`)}
                    style={{ padding: '6px 8px' }}
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    className="btn-ghost"
                    onClick={() => handleDelete(et.id, et.name)}
                    disabled={deleting === et.id}
                    style={{ padding: '6px 8px', color: '#DC2626' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
