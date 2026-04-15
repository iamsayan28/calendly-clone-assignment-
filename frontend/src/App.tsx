import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage      from './pages/DashboardPage';
import EventTypeFormPage  from './pages/EventTypeFormPage';
import MeetingsPage       from './pages/MeetingsPage';
import BookingPage        from './pages/BookingPage';
import ReschedulePage     from './pages/ReschedulePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes */}
        <Route path="/"                        element={<DashboardPage />} />
        <Route path="/event-types/new"         element={<EventTypeFormPage mode="create" />} />
        <Route path="/event-types/:id/edit"    element={<EventTypeFormPage mode="edit" />} />
        <Route path="/meetings"                element={<MeetingsPage />} />

        {/* Public routes */}
        <Route path="/book/:slug"              element={<BookingPage />} />
        <Route path="/bookings/reschedule/:id" element={<ReschedulePage />} />

        {/* 404 */}
        <Route path="*" element={
          <div style={{
            minHeight: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 16, color: 'var(--gray-400)',
          }}>
            <h1 style={{ fontSize: 48, fontWeight: 700, color: 'var(--gray-300)' }}>404</h1>
            <p style={{ fontSize: 16 }}>Page not found</p>
            <a href="/" style={{ color: 'var(--blue-primary)', fontSize: 14 }}>
              Go to Dashboard
            </a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
