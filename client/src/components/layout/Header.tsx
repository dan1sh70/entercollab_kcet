import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { avatarUrl } from '../../lib/utils';
import api from '../../lib/api';

interface Notification {
  id: string;
  data: { message?: string; type?: string; link?: string };
  readAt: string | null;
  read_at: string | null;
  createdAt: string;
  created_at: string;
}

const SEARCH_DEBOUNCE_MS = 280;

export default function Header({ onToggleMobileSidebar }: { onToggleMobileSidebar: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { on } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Keep header field in sync when Explore URL changes (e.g. typing on Explore page). */
  useEffect(() => {
    if (location.pathname !== '/explore') return;
    const q = new URLSearchParams(location.search).get('q') || '';
    setSearchQuery(q);
  }, [location.pathname, location.search]);

  useEffect(() => {
    return () => {
      if (searchNavTimerRef.current != null) clearTimeout(searchNavTimerRef.current);
    };
  }, []);

  const navigateToExploreSearch = (q: string, replace = true) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    const search = params.toString() ? `?${params}` : '';
    navigate({ pathname: '/explore', search }, { replace });
  };

  const onHeaderSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchNavTimerRef.current != null) clearTimeout(searchNavTimerRef.current);
    searchNavTimerRef.current = setTimeout(() => {
      navigateToExploreSearch(value);
      searchNavTimerRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
  };

  const clearProfileLeaveTimer = () => {
    if (profileLeaveTimerRef.current != null) {
      clearTimeout(profileLeaveTimerRef.current);
      profileLeaveTimerRef.current = null;
    }
  };

  /** Delay before closing on hover leave so the pointer can cross the gap to the menu. */
  const scheduleProfileClose = () => {
    clearProfileLeaveTimer();
    profileLeaveTimerRef.current = setTimeout(() => {
      setProfileOpen(false);
      profileLeaveTimerRef.current = null;
    }, 280);
  };

  useEffect(() => {
    api.get('/notifications/fetch')
      .then((res) => {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unread_count);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const cleanup = on('notification:new', (payload: { id: string; type: string; data: Notification['data']; readAt: string | null; createdAt: string }) => {
      setNotifications((prev) => {
        const next = [{ ...payload, readAt: payload.readAt, createdAt: payload.createdAt }, ...prev];
        const seen = new Set<string>();
        return next.filter((n) => {
          if (seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        }).slice(0, 10);
      });
      setUnreadCount((c) => c + 1);
    });
    return cleanup;
  }, [on, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const cleanup = on('notification:removed', (payload: { id: string; wasUnread?: boolean }) => {
      setNotifications((prev) => prev.filter((n) => n.id !== payload.id));
      if (payload.wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    });
    return cleanup;
  }, [on, user?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(t)) setIsOpen(false);
      if (profileRef.current && !profileRef.current.contains(t)) {
        clearProfileLeaveTimer();
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    return () => {
      if (profileLeaveTimerRef.current != null) {
        clearTimeout(profileLeaveTimerRef.current);
        profileLeaveTimerRef.current = null;
      }
    };
  }, []);

  const markAsRead = (id: string) => {
    api.post(`/notifications/${id}/read`).then(() => {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString(), read_at: new Date().toISOString() } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  };

  const markAllAsRead = () => {
    api.post('/notifications/read-all').then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString(), read_at: new Date().toISOString() })));
      setUnreadCount(0);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchNavTimerRef.current != null) {
      clearTimeout(searchNavTimerRef.current);
      searchNavTimerRef.current = null;
    }
    navigateToExploreSearch(searchQuery);
  };

  return (
    <header className="relative z-50 border-b border-slate-100/50 bg-white shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/logo.gif"
              alt="EnterCollab"
              className="w-10 h-10 rounded-xl shadow-sm border border-slate-100/30 bg-white object-cover p-1"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.onerror = null;
                t.src = '/favicon-32x32.png';
              }}
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full border-2 border-white shadow-lg" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 text-transparent bg-clip-text leading-tight">
              EnterCollab
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 font-medium">Ideas Beyond Borders</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-8 max-w-2xl">
          <div className="relative flex-1">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onHeaderSearchChange(e.target.value)}
              placeholder="Search projects, clubs, or people…"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200 placeholder-slate-400"
            />
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-slate-400">⌘K</span>
          </div>
        </form>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {user?.accountType === 'institution' ? (
            <Link
              to="/events/create"
              className="px-3 sm:px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-full text-sm shadow-lg hover:shadow-indigo-200/30 hover:scale-105 transition-all duration-200 flex items-center gap-2"
              aria-label="Create new event"
            >
              <i className="fas fa-calendar-plus" />
              <span className="hidden sm:inline">New event</span>
            </Link>
          ) : (
            <Link
              to="/projects/create"
              className="px-3 sm:px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-full text-sm shadow-lg hover:shadow-indigo-200/30 hover:scale-105 transition-all duration-200 flex items-center gap-2"
              aria-label="Create project"
            >
              <i className="fas fa-plus" />
              <span className="hidden sm:inline">Create</span>
            </Link>
          )}

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                clearProfileLeaveTimer();
                setIsOpen((v) => !v);
                setProfileOpen(false);
              }}
              className="group relative rounded-full p-3 text-slate-600 transition-colors hover:bg-slate-100"
            >
              <i className="fas fa-bell" />
              {unreadCount > 0 && <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white" />}
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-1rem))] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[60]">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                  <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                  <button onClick={markAllAsRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline">Mark all read</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <i className="fa-regular fa-bell-slash text-slate-300 text-xl" />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">No new notifications</p>
                      <p className="text-xs text-slate-400 mt-1">We'll let you know when something happens.</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const unread = !(n.readAt || n.read_at);
                      const href = n.data?.link?.trim() || '/notifications';
                      return (
                        <Link
                          key={n.id}
                          to={href}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            if (unread) markAsRead(n.id);
                          }}
                          className={`block p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors duration-200 group ${unread ? 'bg-indigo-50/50' : ''}`}
                        >
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100">
                                <i className="fa-solid fa-bell text-slate-400 text-sm" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 leading-snug">{n.data?.message || 'New Notification'}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                {new Date(n.createdAt || n.created_at).toLocaleDateString()} &bull; {new Date(n.createdAt || n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {unread && (
                              <span className="text-slate-300 p-1" title="Unread">
                                <i className="fa-solid fa-circle text-[6px] text-indigo-400" />
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
                <div className="p-2 border-t border-slate-50 bg-slate-50/50 text-center">
                  <Link to="/notifications" className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">View all history</Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile menu */}
          <div
            ref={profileRef}
            className="relative"
            onMouseEnter={() => {
              clearProfileLeaveTimer();
              if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
                setProfileOpen(true);
                setIsOpen(false);
              }
            }}
            onMouseLeave={() => {
              if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
                scheduleProfileClose();
              }
            }}
          >
            <button
              type="button"
              onClick={() => {
                clearProfileLeaveTimer();
                setProfileOpen((v) => !v);
                setIsOpen(false);
              }}
              className="group flex items-center gap-1 rounded-full border-2 border-transparent p-0.5 transition-all hover:border-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="Account menu"
            >
              <img
                src={avatarUrl(user?.name || '', user?.profilePhotoPath)}
                alt=""
                className="h-9 w-9 cursor-pointer rounded-full border-2 border-slate-100 object-cover shadow-sm"
              />
              <i className={`fas fa-chevron-down hidden text-[10px] text-slate-400 transition-transform sm:inline ${profileOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-[60] w-56 pt-2 sm:w-60">
                <div className="overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-xl shadow-slate-900/10">
                <div className="border-b border-slate-50 px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Account'}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  onClick={() => {
                    clearProfileLeaveTimer();
                    setProfileOpen(false);
                  }}
                >
                  <i className="fa-regular fa-user w-4 text-center text-slate-400" />
                  My profile
                </Link>
                <Link
                  to="/profile/edit"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  onClick={() => {
                    clearProfileLeaveTimer();
                    setProfileOpen(false);
                  }}
                >
                  <i className="fa-solid fa-gear w-4 text-center text-slate-400" />
                  Settings
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                  onClick={() => {
                    clearProfileLeaveTimer();
                    setProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center" />
                  Log out
                </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={onToggleMobileSidebar} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
            <i className="fas fa-bars" />
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      <form onSubmit={handleSearch} className="px-4 py-3 md:hidden bg-white border-b border-slate-100/30">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onHeaderSearchChange(e.target.value)}
            placeholder="Search EnterCollab…"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200 placeholder-slate-400"
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        </div>
      </form>
    </header>
  );
}
