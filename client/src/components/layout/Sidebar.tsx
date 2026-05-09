import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import api from '../../lib/api';

const LAST_SEEN_MESSAGES_KEY = 'ic:last-seen-messages-at';

function getLastSeenMessagesAt(): number {
  const raw = localStorage.getItem(LAST_SEEN_MESSAGES_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function setLastSeenMessagesAt(value: number) {
  localStorage.setItem(LAST_SEEN_MESSAGES_KEY, String(value));
}

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { on } = useSocket();
  const [messagesBadgeCount, setMessagesBadgeCount] = useState(0);
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const refreshMessagesBadge = async () => {
    if (!user?.id) {
      setMessagesBadgeCount(0);
      return;
    }

    try {
      const res = await api.get('/chat');
      const lastSeen = getLastSeenMessagesAt();
      const rooms = Array.isArray(res.data.rooms) ? res.data.rooms : [];
      const unreadRooms = rooms.filter((room: { updatedAt?: string }) => {
        if (!room.updatedAt) return false;
        return new Date(room.updatedAt).getTime() > lastSeen;
      });
      setMessagesBadgeCount(unreadRooms.length);
    } catch {
      setMessagesBadgeCount(0);
    }
  };

  useEffect(() => {
    void refreshMessagesBadge();
  }, [user?.id, location.pathname]);

  useEffect(() => {
    if (location.pathname === '/chat') {
      const now = Date.now();
      setLastSeenMessagesAt(now);
      setMessagesBadgeCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!user?.id) return;

    const cleanupMessage = on('message:receive', () => {
      void refreshMessagesBadge();
    });
    const cleanupRooms = on('chat:rooms:refresh', () => {
      void refreshMessagesBadge();
    });

    return () => {
      cleanupMessage();
      cleanupRooms();
    };
  }, [on, user?.id]);

  const navClass = (path: string) =>
    `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
      isActive(path)
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/15'
        : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <nav className="space-y-6 pr-2 pb-24">
      <div className="panel-surface p-3 sm:p-4 space-y-2">
        <Link to="/dashboard" className={navClass('/dashboard')}>
          <i className="fa-solid fa-magnifying-glass text-lg" />
          <span className="font-bold text-sm tracking-wide">Feed</span>
        </Link>
        <Link to="/explore" className={navClass('/explore')}>
          <i className="fa-solid fa-compass text-lg" />
          <span className="font-bold text-sm tracking-wide">Explore</span>
        </Link>
        <Link to="/feed" className={navClass('/feed')}>
          <i className="fa-solid fa-building-columns text-lg" />
          <span className="font-bold text-sm tracking-wide">Campus Life</span>
        </Link>
        <Link to="/colleges" className={navClass('/colleges')}>
          <i className="fa-solid fa-graduation-cap text-lg" />
          <span className="font-bold text-sm tracking-wide">Universities</span>
        </Link>
        <Link to="/projects" className={navClass('/projects')}>
          <i className="fa-solid fa-layer-group text-lg" />
          <span className="font-bold text-sm tracking-wide">Projects</span>
        </Link>
        <Link to="/research" className={navClass('/research')}>
          <i className="fa-solid fa-flask text-lg" />
          <span className="font-bold text-sm tracking-wide">Research</span>
        </Link>
        <Link to="/chat" className={navClass('/chat')}>
          <i className="fa-regular fa-comment-dots text-lg" />
          <span className="font-bold text-sm tracking-wide">Messages</span>
          {messagesBadgeCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] min-w-5 h-5 px-1 flex items-center justify-center rounded-full font-bold">
              {messagesBadgeCount > 9 ? '9+' : messagesBadgeCount}
            </span>
          )}
        </Link>
        <Link to="/events" className={navClass('/events')}>
          <i className="fa-regular fa-calendar text-lg" />
          <span className="font-bold text-sm tracking-wide">Events</span>
        </Link>
        {user?.accountType === 'institution' && (
          <Link to="/institution" className={navClass('/institution')}>
            <i className="fa-solid fa-building-columns text-lg" />
            <span className="font-bold text-sm tracking-wide">Organization</span>
          </Link>
        )}
      </div>

      {/* Explore Topics */}
      <div className="panel-surface p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Explore Topics</h3>
          <button className="text-slate-400 transition-colors hover:text-slate-600"><i className="fa-solid fa-plus" /></button>
        </div>
        <div className="space-y-2">
          <Link to="/projects?tag=Coding" className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-indigo-600 transition-colors flex items-center justify-center text-white text-xs">
                <i className="fa-solid fa-code" />
              </div>
              <span className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">Coding</span>
            </div>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-200" />
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
          </Link>
          <Link to="/projects?tag=UI/UX" className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 text-xs group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                <i className="fa-solid fa-pen-nib" />
              </div>
              <span className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">UI/UX</span>
            </div>
          </Link>
          <Link to="/projects?tag=Robotics" className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 text-xs group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                <i className="fa-solid fa-robot" />
              </div>
              <span className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">Robotics</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
