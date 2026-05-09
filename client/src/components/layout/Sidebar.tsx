import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import api from '../../lib/api';

const LAST_SEEN_MESSAGES_KEY = 'ic:last-seen-messages-at';
const TOPICS = [
  { name: 'Coding', icon: 'fa-code', bgColor: 'bg-slate-900', path: '/projects?tag=Coding' },
  { name: 'UI/UX', icon: 'fa-pen-nib', bgColor: 'bg-white border border-slate-200', path: '/projects?tag=UI/UX' },
  { name: 'Robotics', icon: 'fa-robot', bgColor: 'bg-white border border-slate-200', path: '/projects?tag=Robotics' },
];

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
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { on } = useSocket();
  const [messagesBadgeCount, setMessagesBadgeCount] = useState(0);
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const activeTag = searchParams.get('tag');

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
          {TOPICS.map((topic) => {
            const isSelected = activeTag === topic.name;
            return (
              <Link
                key={topic.name}
                to={topic.path}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-300 group ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100'
                    : 'bg-white border-slate-100/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all duration-300 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : topic.bgColor + ' text-slate-600 group-hover:text-indigo-600'
                    }`}
                  >
                    <i className={`fa-solid ${topic.icon}`} />
                  </div>
                  <span
                    className={`font-bold text-sm transition-colors duration-300 ${
                      isSelected ? 'text-indigo-600' : 'text-slate-700 group-hover:text-indigo-600'
                    }`}
                  >
                    {topic.name}
                  </span>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-600">Active</span>
                    <i className="fa-solid fa-check text-indigo-600 text-xs" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
