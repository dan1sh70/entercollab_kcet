import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { avatarUrl, timeAgo } from '../../lib/utils';
import api from '../../lib/api';
import { APP_EVENTS, emitFollowChanged } from '../../lib/events';

export default function FollowingList() {
  const { id: paramId } = useParams();
  const { user: authUser } = useAuth();
  const userId = useMemo(() => (paramId ? parseInt(paramId, 10) : authUser?.id), [paramId, authUser?.id]);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const loadFollowing = () => {
    if (!userId || Number.isNaN(userId)) return;
    api.get(`/profile/${userId}/following`).then((res) => setItems(res.data.following || []));
  };

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) { setLoading(false); return; }
    setLoading(true);
    api.get(`/profile/${userId}/following`).then((res) => setItems(res.data.following || [])).finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) return;
    const onFollowChanged = () => {
      loadFollowing();
    };
    window.addEventListener(APP_EVENTS.followChanged, onFollowChanged);
    return () => window.removeEventListener(APP_EVENTS.followChanged, onFollowChanged);
  }, [userId]);

  const toggleFollow = async (targetUserId: number) => {
    setTogglingId(targetUserId);
    try {
      const res = await api.post(`/feed/users/${targetUserId}/follow`);
      setItems((prev) =>
        prev.map((it) =>
          it.user.id === targetUserId ? { ...it, isFollowing: !!res.data.following } : it
        )
      );
      emitFollowChanged();
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-bold text-slate-900">Following</h1>
          <Link to={userId === authUser?.id ? '/profile' : `/profile/${userId}`} className="text-sm font-semibold text-indigo-600 hover:underline">
            Back to profile
          </Link>
        </div>

        {items.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {items.map((it: any) => (
              <div key={it.user.id} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                <Link to={`/profile/${it.user.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <img src={avatarUrl(it.user.name, it.user.profilePhotoPath)} className="w-11 h-11 rounded-full object-cover border border-slate-100" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 leading-snug truncate">{it.user.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {[it.user.university, it.user.major].filter(Boolean).join(' · ') || 'Student'}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap hidden sm:inline">
                    {it.followedAt ? `Followed ${timeAgo(it.followedAt)}` : ''}
                  </span>
                  {authUser?.id !== it.user.id && (
                    <button
                      type="button"
                      onClick={() => toggleFollow(it.user.id)}
                      disabled={togglingId === it.user.id}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors disabled:opacity-60 ${
                        it.isFollowing ? 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200' : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {togglingId === it.user.id ? '...' : it.isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-14 bg-white border border-dashed border-slate-200 rounded-2xl">
            <i className="fa-regular fa-handshake text-3xl text-slate-300 mb-3 block" />
            <p className="text-slate-500 text-sm font-medium">Not following anyone yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

