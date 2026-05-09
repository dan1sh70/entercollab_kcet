import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function InstitutionDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/institution').then((res) => setData(res.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  if (!data) return <div className="p-6 text-center text-red-500">Access denied</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Organization Dashboard</h1>
      {data.college && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">{data.college.name}</h2>
          {data.college.description && <p className="text-sm text-slate-500 mt-1">{data.college.description}</p>}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center"><p className="text-3xl font-bold text-indigo-600">{data.stats.events_total}</p><p className="text-sm text-slate-500">Total Events</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center"><p className="text-3xl font-bold text-indigo-600">{data.stats.upcoming}</p><p className="text-sm text-slate-500">Upcoming</p></div>
      </div>
      <div className="flex gap-3">
        <Link to="/events/create" className="btn-primary inline-flex items-center gap-2"><i className="fa-solid fa-plus" /> Create Event</Link>
        <Link to="/institution/events" className="btn-secondary inline-flex items-center gap-2"><i className="fa-solid fa-list" /> Manage Events</Link>
      </div>
      {data.upcomingEvents.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-800 mb-3">Upcoming Events</h3>
          <div className="space-y-3">
            {data.upcomingEvents.map((e: any) => (
              <Link key={e.id} to={`/events/${e.id}`} className="block bg-white rounded-xl border border-slate-100 p-4 hover:border-indigo-200 transition-colors">
                <h4 className="font-bold text-slate-900">{e.title}</h4>
                <p className="text-sm text-slate-500">{new Date(e.eventDate).toLocaleDateString()} &middot; {e.location}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
