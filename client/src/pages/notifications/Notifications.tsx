import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

export default function Notifications() {
  const { user } = useAuth();
  const { on } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/notifications').then((res) => setNotifications(res.data.notifications)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    return on('notification:new', (payload: any) => {
      setNotifications((prev) => {
        const row = { ...payload, data: payload.data || {} };
        const next = [row, ...prev];
        const seen = new Set<string>();
        return next.filter((n) => {
          if (seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        });
      });
    });
  }, [on, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    return on('notification:removed', (payload: { id: string }) => {
      setNotifications((prev) => prev.filter((n) => n.id !== payload.id));
    });
  }, [on, user?.id]);

  const markAsRead = async (id: string) => {
    await api.post(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
  };

  const markAllAsRead = async () => {
    await api.post('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <button onClick={markAllAsRead} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Mark all as read</button>
      </div>
      <div className="space-y-3 pb-20">
        {notifications.map((n) => {
          const href = n.data?.link?.trim() || '#';
          const body = (
            <div className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition-colors ${!n.readAt ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100'}`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 flex-shrink-0">
                <i className="fa-solid fa-bell text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 font-medium">{n.data?.message || 'New notification'}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt || n.created_at).toLocaleString()}</p>
              </div>
              {!n.readAt && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void markAsRead(n.id);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex-shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          );
          return n.data?.link ? (
            <Link key={n.id} to={href} className="block hover:opacity-95 transition-opacity">
              {body}
            </Link>
          ) : (
            <div key={n.id}>{body}</div>
          );
        })}
        {notifications.length === 0 && <div className="text-center py-12 text-slate-400">No notifications yet</div>}
      </div>
    </div>
  );
}
