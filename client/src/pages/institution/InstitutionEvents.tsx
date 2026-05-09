import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function InstitutionEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/institution/events').then((res) => setEvents(res.data.events)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Events</h1>
          <p className="text-sm text-slate-500">Manage all events published by your institution</p>
        </div>
        <Link to="/events/create" className="btn-primary flex items-center gap-2">
          <i className="fa-solid fa-plus" /> New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <i className="fa-regular fa-calendar text-4xl text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No events yet</h3>
          <p className="text-sm text-slate-500 mb-4">Create your first event to reach campus audiences.</p>
          <Link to="/events/create" className="btn-primary">Create Event</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4 font-medium text-slate-600">Event</th>
                <th className="text-left p-4 font-medium text-slate-600">Date</th>
                <th className="text-left p-4 font-medium text-slate-600">Status</th>
                <th className="text-left p-4 font-medium text-slate-600">Type</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-slate-50">
                  <td className="p-4">
                    <Link to={`/events/${event.id}`} className="font-medium text-slate-900 hover:text-indigo-600">{event.title}</Link>
                  </td>
                  <td className="p-4 text-slate-500">{new Date(event.eventDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      event.status === 'upcoming' ? 'bg-blue-50 text-blue-600'
                      : event.status === 'ongoing' ? 'bg-green-50 text-green-600'
                      : event.status === 'completed' ? 'bg-slate-100 text-slate-500'
                      : 'bg-red-50 text-red-600'
                    }`}>{event.status}</span>
                  </td>
                  <td className="p-4 text-slate-500 capitalize">{event.type}</td>
                  <td className="p-4">
                    <Link to={`/events/${event.id}/edit`} className="text-xs px-3 py-1 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
