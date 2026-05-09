import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function EventsIndex() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events').then((res) => setEvents(res.data.events)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  const featured = events.length > 0 ? events[0] : null;
  const rest = events.slice(1);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return { day: d.getDate().toString().padStart(2, '0'), month: d.toLocaleString('en-US', { month: 'short' }), full: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) };
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="mx-auto w-full max-w-[1600px] py-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Campus Events</h1>
            <p className="text-slate-500 mt-1">Discover workshops, hackathons, and guest lectures happening near you.</p>
          </div>
          <Link to="/events/create"
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2">
            <i className="fa-regular fa-calendar-plus" /> Host Event
          </Link>
        </div>

        {/* Featured Event */}
        {featured && (
          <Link to={`/events/${featured.id}`}
            className="relative rounded-3xl overflow-hidden mb-12 group cursor-pointer shadow-xl shadow-indigo-100 block">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10" />
            <img src={featured.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(featured.title)}&background=random&size=800`}
              className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
              <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg mb-3">FEATURED</span>
              <h2 className="text-4xl font-bold text-white mb-2">{featured.title}</h2>
              <div className="flex items-center gap-6 text-slate-300 text-sm font-medium">
                <span className="flex items-center gap-2"><i className="fa-regular fa-calendar" /> {formatDate(featured.eventDate).full}</span>
                {featured.location && <span className="flex items-center gap-2"><i className="fa-solid fa-location-dot" /> {featured.location}</span>}
              </div>
            </div>
          </Link>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {rest.map((event) => {
            const date = formatDate(event.eventDate);
            return (
              <Link key={event.id} to={`/events/${event.id}`}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 overflow-hidden flex flex-col h-full">
                <div className="relative h-48 overflow-hidden">
                  <img src={event.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=random&size=400`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-800 text-center px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                    <div className="text-indigo-600 text-lg leading-none">{date.day}</div>
                    <div className="uppercase tracking-wide text-[10px]">{date.month}</div>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                  {event.description && <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{event.description}</p>}
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex items-center gap-4">
                      {event.location && <span><i className="fa-solid fa-location-dot text-slate-300 mr-1" /> {event.location}</span>}
                      <span><i className="fa-solid fa-users text-slate-300 mr-1" /> {event.attendees_count ?? 0} going</span>
                    </div>
                    <span className="text-indigo-600 font-bold">Details &rarr;</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-lg">
            <i className="fa-regular fa-calendar text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700">No upcoming events</h3>
            <p className="text-gray-500 text-sm mb-6">Be the first to host a campus event!</p>
            <Link to="/events/create" className="inline-block px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
              Host Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
