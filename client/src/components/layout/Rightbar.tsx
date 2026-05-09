import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { avatarUrl } from '../../lib/utils';
import api from '../../lib/api';
import { APP_EVENTS, emitFollowChanged } from '../../lib/events';

export default function Rightbar() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ projects: 0, following: 0, followers: 0 });
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      if (!user) return;
      try {
        const [feedRes, profileRes] = await Promise.all([
          api.get('/feed'),
          api.get(`/profile/${user.id}`),
        ]);
        if (cancelled) return;
        if (feedRes.data.recommendedUsers) setSuggestedUsers(feedRes.data.recommendedUsers.slice(0, 3));
        setStats({
          projects: profileRes.data.projectsCount || 0,
          following: profileRes.data.followingCount || 0,
          followers: profileRes.data.followersCount || 0,
        });
      } catch {
        /* ignore */
      }
    };

    refresh();

    const onFollowChanged = () => refresh();
    window.addEventListener(APP_EVENTS.followChanged, onFollowChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(APP_EVENTS.followChanged, onFollowChanged);
    };
  }, [user]);

  const followUser = async (userId: number) => {
    try {
      const res = await api.post(`/feed/users/${userId}/follow`);
      const nowFollowing = !!res.data.following;
      setSuggestedUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: nowFollowing } : u))
      );
      setStats((s) => ({
        ...s,
        following: Math.max(0, s.following + (nowFollowing ? 1 : -1)),
      }));
      emitFollowChanged();
    } catch { /* ignore */ }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pr-2">
      {/* Profile Summary Card */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-100/50 border border-slate-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={avatarUrl(user.name, user.profilePhotoPath)} className="w-12 h-12 rounded-full object-cover" />
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white w-4 h-4 text-[8px] flex items-center justify-center rounded-full border-2 border-white">
                <i className="fa-solid fa-check" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">{user.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <i className="fa-solid fa-building-columns text-indigo-500 text-[10px]" />
                <span>{user.university || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Score */}
        <div className="bg-slate-50 rounded-xl px-4 py-2.5 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-star text-amber-500 text-sm" />
            <span className="font-extrabold text-slate-800">{user.totalTrustPoints ?? 0}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
            <i className="fa-solid fa-graduation-cap text-[10px] text-indigo-500" />
            <span>{user.major || 'Major not set'}</span>
          </div>
          <i className="fa-solid fa-chevron-right text-slate-300 text-xs" />
        </div>

        {/* Stats Grid (clickable) */}
        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
          <Link to="/projects/mine" className="hover:bg-slate-50 rounded-xl py-1.5 transition-colors">
            <i className="fa-solid fa-layer-group text-slate-400 mb-1" />
            <div className="font-bold text-slate-800 text-lg leading-none">{stats.projects}</div>
            <span className="text-[10px] text-slate-400 font-medium">Projects</span>
          </Link>
          <Link to="/profile/following" className="hover:bg-slate-50 rounded-xl py-1.5 transition-colors">
            <i className="fa-regular fa-handshake text-slate-400 mb-1" />
            <div className="font-bold text-slate-800 text-lg leading-none">{stats.following}</div>
            <span className="text-[10px] text-slate-400 font-medium">Following</span>
          </Link>
          <Link to="/profile/followers" className="hover:bg-slate-50 rounded-xl py-1.5 transition-colors">
            <i className="fa-solid fa-users text-slate-400 mb-1" />
            <div className="font-bold text-slate-800 text-lg leading-none">{stats.followers}</div>
            <span className="text-[10px] text-slate-400 font-medium">Followers</span>
          </Link>
        </div>
      </div>

      {/* Connect with Others */}
      {suggestedUsers.length > 0 && (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-100/50 border border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Connect with Others</h3>
          <div className="space-y-3">
            {suggestedUsers.map((person) => (
              <div key={person.id} className="flex items-center gap-3">
                <img src={avatarUrl(person.name, person.profilePhotoPath)} className="w-9 h-9 rounded-full bg-slate-100 object-cover flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm leading-snug">{person.name}</p>
                  <p className="text-[10px] text-slate-500">{person.university || 'Student'}</p>
                </div>
                <button onClick={() => followUser(person.id)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-colors flex-shrink-0 ${
                    person.isFollowing
                      ? 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                      : 'border-slate-200 text-indigo-600 hover:bg-indigo-50'
                  }`}>
                  {person.isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Research Summary */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-[2rem] p-5 border border-indigo-100/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px]">
            <i className="fa-solid fa-robot" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">AI Research Summary</h3>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
            <i className="fa-solid fa-microchip" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600 leading-snug">
              Welcome to InterCollab! Connect with researchers and start collaborating on exciting projects.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to="/projects/create"
            className="flex-1 py-2 bg-indigo-600 text-white text-center rounded-lg text-[10px] font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200">
            Start Project
          </Link>
        </div>
      </div>

      {/* Logout */}
      <div className="pt-4 mt-2 border-t border-slate-100">
        <button onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold hover:bg-red-100 transition-all group/logout">
          <i className="fa-solid fa-right-from-bracket group-hover/logout:translate-x-0.5 transition-transform" />
          Sign Out from InterCollab
        </button>
      </div>
    </div>
  );
}
