import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { avatarUrl } from '../../lib/utils';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';

export default function EventShow() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get(`/events/${id}`).then((res) => { setEvent(res.data.event); setIsRegistered(res.data.isRegistered); }).finally(() => setLoading(false)); }, [id]);

  const toggleRegister = async () => {
    if (isRegistered) {
      await api.delete(`/events/${id}/unregister`);
      setIsRegistered(false);
      showToast('Registration cancelled');
    } else {
      await api.post(`/events/${id}/register`);
      setIsRegistered(true);
      showToast('Registered successfully!');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  if (!event) return <div className="p-6 text-center text-gray-500">Event not found</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6 pb-24">
      {event.image && <div className="rounded-2xl overflow-hidden"><img src={event.image} alt={event.title} className="w-full max-h-80 object-cover" /></div>}
      <div>
        <span className="text-xs font-bold text-indigo-600 uppercase">{event.type}</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">{event.title}</h1>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={avatarUrl(event.user.name, event.user.profilePhotoPath)} className="w-10 h-10 rounded-full" />
          <div><p className="font-bold text-sm text-slate-900">{event.user.name}</p><p className="text-xs text-slate-500">Organizer</p></div>
        </div>
        {authUser?.id === event.user.id && (
          <Link to={`/events/${id}/edit`} className="btn-secondary text-sm">Edit Event</Link>
        )}
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs text-slate-500 mb-1">Date</p><p className="font-bold text-sm text-slate-900">{new Date(event.eventDate).toLocaleDateString()}</p></div>
        <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs text-slate-500 mb-1">Location</p><p className="font-bold text-sm text-slate-900">{event.location}</p></div>
        <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs text-slate-500 mb-1">Attendees</p><p className="font-bold text-sm text-slate-900">{event.attendees_count}{event.maxAttendees ? ` / ${event.maxAttendees}` : ''}</p></div>
      </div>
      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
      <button onClick={toggleRegister} className={`px-6 py-3 font-bold rounded-xl transition-colors ${isRegistered ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
        {isRegistered ? 'Cancel Registration' : 'Register for Event'}
      </button>
      {event.registrations?.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-800 mb-3">Attendees ({event.attendees_count})</h3>
          <div className="flex flex-wrap gap-2">
            {event.registrations.map((r: any) => (
              <div key={r.id} className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border border-slate-100">
                <img src={avatarUrl(r.user.name, r.user.profilePhotoPath)} className="w-6 h-6 rounded-full" />
                <span className="text-xs font-medium text-slate-700">{r.user.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
