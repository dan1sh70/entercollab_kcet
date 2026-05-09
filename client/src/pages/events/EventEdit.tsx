import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';

export default function EventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', location: '', event_date: '', max_attendees: '', type: '', status: '' });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}`).then((res) => {
      const e = res.data.event;
      setForm({
        title: e.title || '',
        description: e.description || '',
        location: e.location || '',
        event_date: e.eventDate ? new Date(e.eventDate).toISOString().slice(0, 16) : '',
        max_attendees: e.maxAttendees?.toString() || '',
        type: e.type || '',
        status: e.status || 'upcoming',
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (image) fd.append('image', image);
      await api.patch(`/events/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Event updated!');
      navigate(`/events/${id}`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update event.', 'error');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Event</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees</label>
            <input type="number" value={form.max_attendees} onChange={(e) => setForm({ ...form, max_attendees: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required className="input-field">
              <option value="">Select type</option>
              <option value="hackathon">Hackathon</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="conference">Conference</option>
              <option value="meetup">Meetup</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required className="input-field">
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="input-field" />
          </div>
          <div className="flex gap-3 pb-20">
            <button type="submit" className="btn-primary py-3 px-8 font-semibold">Save Changes</button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary py-3 px-8">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
