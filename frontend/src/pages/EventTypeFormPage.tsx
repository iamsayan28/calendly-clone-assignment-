import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { api } from '../api';
import type { AvailabilitySlot } from '../types';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

const TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
];

interface FormData {
  name:          string;
  slug:          string;
  duration:      number;
  buffer_before: number;
  buffer_after:  number;
}

interface Props {
  mode: 'create' | 'edit';
}

export default function EventTypeFormPage({ mode }: Props) {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  const [form, setForm] = useState<FormData>({
    name: '', slug: '', duration: 30, buffer_before: 0, buffer_after: 0,
  });

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading,  setLoading]  = useState(mode === 'edit');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  // Fetch existing data for edit mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      Promise.all([
        api.eventTypes.list(),
        api.availability.get(id),
      ]).then(([types, avails]) => {
        const et = types.find(t => t.id === id);
        if (!et) { setError('Event type not found'); return; }
        setForm({
          name:          et.name,
          slug:          et.slug,
          duration:      et.duration,
          buffer_before: et.buffer_before,
          buffer_after:  et.buffer_after,
        });
        setAvailability(avails.map(a => ({
          day_of_week: a.day_of_week,
          start_time:  a.start_time,
          end_time:    a.end_time,
          timezone:    a.timezone,
        })));
      }).catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [mode, id]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev, name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }));
  };

  const addAvailabilityRow = () => {
    setAvailability(prev => [
      ...prev,
      { day_of_week: 1, start_time: '09:00', end_time: '17:00', timezone: 'Asia/Kolkata' },
    ]);
  };

  const removeAvailabilityRow = (index: number) => {
    setAvailability(prev => prev.filter((_, i) => i !== index));
  };

  const updateAvailabilityRow = (index: number, field: keyof AvailabilitySlot, value: string | number) => {
    setAvailability(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      setError('Name and slug are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let eventTypeId: string;

      if (mode === 'create') {
        const created = await api.eventTypes.create(form);
        eventTypeId = created.id;
      } else {
        await api.eventTypes.update(id!, form);
        eventTypeId = id!;
      }

      // Save availability
      if (availability.length > 0) {
        await api.availability.set(eventTypeId, availability);
      }

      navigate('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '40px', color: 'var(--gray-400)' }}>Loading…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '32px 40px', maxWidth: 700 }}>
        {/* Back */}
        <button
          className="btn-ghost"
          onClick={() => navigate('/')}
          style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-600)' }}
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          {mode === 'create' ? 'New Event Type' : 'Edit Event Type'}
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 32 }}>
          {mode === 'create'
            ? 'Set up a new meeting type for people to book with you.'
            : 'Update your event type details and availability.'}
        </p>

        {error && (
          <div style={{
            padding: '12px 16px', background: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: 8,
            color: '#DC2626', fontSize: 14, marginBottom: 24,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── Event Type Details ── */}
          <section style={{
            background: 'white', border: '1px solid var(--gray-200)',
            borderRadius: 12, padding: 24, marginBottom: 24,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--gray-800)' }}>
              Event Details
            </h2>

            <div className="form-group">
              <label className="form-label">Event Name *</label>
              <input
                className="form-input"
                placeholder="e.g. 30 Minute Meeting"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug (URL) *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <span style={{
                  padding: '9px 12px', background: 'var(--gray-50)',
                  border: '1px solid var(--gray-300)', borderRight: 'none',
                  borderRadius: '6px 0 0 6px', fontSize: 13, color: 'var(--gray-400)',
                  whiteSpace: 'nowrap',
                }}>
                  /book/
                </span>
                <input
                  className="form-input"
                  style={{ borderRadius: '0 6px 6px 0' }}
                  placeholder="my-event"
                  value={form.slug}
                  onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Duration (min) *</label>
                <select
                  className="form-input"
                  value={form.duration}
                  onChange={e => setForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                >
                  {DURATIONS.map(d => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Buffer Before (min)</label>
                <input
                  type="number" min={0} max={60}
                  className="form-input"
                  value={form.buffer_before}
                  onChange={e => setForm(prev => ({ ...prev, buffer_before: Number(e.target.value) }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Buffer After (min)</label>
                <input
                  type="number" min={0} max={60}
                  className="form-input"
                  value={form.buffer_after}
                  onChange={e => setForm(prev => ({ ...prev, buffer_after: Number(e.target.value) }))}
                />
              </div>
            </div>
          </section>

          {/* ── Availability ── */}
          <section style={{
            background: 'white', border: '1px solid var(--gray-200)',
            borderRadius: 12, padding: 24, marginBottom: 24,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-800)' }}>
                Availability
              </h2>
              <button type="button" className="btn-outline" onClick={addAvailabilityRow}
                style={{ fontSize: 13, padding: '6px 14px' }}>
                <Plus size={14} /> Add Day
              </button>
            </div>

            {availability.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '30px',
                color: 'var(--gray-400)', fontSize: 14,
                border: '2px dashed var(--gray-200)', borderRadius: 8,
              }}>
                No availability set. Click "Add Day" to define available times.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {availability.map((row, i) => (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                    gap: 10, alignItems: 'center',
                  }}>
                    <select
                      className="form-input"
                      value={row.day_of_week}
                      onChange={e => updateAvailabilityRow(i, 'day_of_week', Number(e.target.value))}
                    >
                      {DAYS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>

                    <input
                      type="time" className="form-input"
                      value={row.start_time}
                      onChange={e => updateAvailabilityRow(i, 'start_time', e.target.value)}
                    />

                    <input
                      type="time" className="form-input"
                      value={row.end_time}
                      onChange={e => updateAvailabilityRow(i, 'end_time', e.target.value)}
                    />

                    <select
                      className="form-input"
                      value={row.timezone}
                      onChange={e => updateAvailabilityRow(i, 'timezone', e.target.value)}
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => removeAvailabilityRow(i)}
                      style={{ color: '#DC2626', padding: '6px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={saving}
              style={{ padding: '10px 28px', borderRadius: 8 }}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create Event Type' : 'Save Changes'}
            </button>
            <button type="button" className="btn-outline" onClick={() => navigate('/')}
              style={{ padding: '10px 20px', borderRadius: 8 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
