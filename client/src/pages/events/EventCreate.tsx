import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';

export default function EventCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', location: '', event_date: '', max_attendees: '', type: '' });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (image) fd.append('image', image);
      const res = await api.post('/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Event created!');
      navigate(`/events/${res.data.event.id}`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create event.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Event</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label><input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees</label><input type="number" value={form.max_attendees} onChange={(e) => setForm({ ...form, max_attendees: e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required className="input-field">
              <option value="">Select type</option>
              <option value="hackathon">Hackathon</option><option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option><option value="conference">Conference</option>
              <option value="meetup">Meetup</option><option value="other">Other</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Image</label><input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="input-field" /></div>
          <div className="flex gap-3 pb-20">
            <button type="submit" disabled={loading} className="btn-primary py-3 px-8 font-semibold disabled:opacity-50">{loading ? 'Creating...' : 'Create Event'}</button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary py-3 px-8">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
