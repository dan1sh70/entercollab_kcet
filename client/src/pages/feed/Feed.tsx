import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { avatarUrl, timeAgo } from '../../lib/utils';
import api from '../../lib/api';
import { emitFollowChanged } from '../../lib/events';

export default function Feed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/feed').then((res) => {
      setFeedItems(res.data.feedItems);
      setRecommendedUsers(res.data.recommendedUsers);
    }).finally(() => setLoading(false));
  }, []);

  const followUser = async (userId: number) => {
    const res = await api.post(`/feed/users/${userId}/follow`);
    setRecommendedUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isFollowing: !!res.data.following } : u)));
    emitFollowChanged();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
          <i className="fa-solid fa-building-columns text-indigo-600" /> Campus Life
        </h1>
        <p className="text-sm text-slate-500 mt-1">See what's happening across campuses</p>
      </div>

      {/* People to Follow */}
      {recommendedUsers.length > 0 && (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-100/50 border border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <i className="fa-solid fa-user-group text-indigo-500" /> People you may know
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {recommendedUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-xl p-4 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <img src={avatarUrl(u.name, u.profilePhotoPath)} className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3 h-3 rounded-full border-2 border-white" />
                  </div>
                  <Link to={`/profile/${u.id}`} className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors leading-snug">
                    {u.name}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">{u.university || 'Student'}</p>
                  {u.major && <p className="text-[10px] text-slate-400 mt-0.5">{u.major}</p>}
                  {u.skills && (
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {u.skills.split(',').slice(0, 3).map((skill: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-medium rounded-full border border-slate-200">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <button onClick={() => followUser(u.id)}
                    className={`w-full mt-3 py-2 border text-xs font-bold rounded-lg transition-colors ${
                      u.isFollowing
                        ? 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                        : 'bg-slate-50 border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300'
                    }`}>
                    <i className={`fa-solid mr-1.5 ${u.isFollowing ? 'fa-user-minus' : 'fa-user-plus'}`} /> {u.isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="space-y-4 pb-20">
        {feedItems.length > 0 ? feedItems.map((item: any) => (
          <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all duration-200">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link to={`/profile/${item.user.id}`} className="relative">
                  <img
                    src={avatarUrl(item.user.name, item.user.profilePhotoPath)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-100 object-cover"
                    alt=""
                  />
                </Link>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/profile/${item.user.id}`} className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors">
                      {item.user.name}
                    </Link>
                    {item.user.university && (
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {item.user.university}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {formatAction(item.type)} &middot; {timeAgo(item.createdAt)}
                  </p>
                </div>
              </div>
              <button className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0">
                <i className="fa-solid fa-ellipsis" />
              </button>
            </div>

            {/* Activity Content */}
            {item.project && (
              <Link to={`/projects/${item.project.id}`} className="block px-4 sm:px-6 pb-4">
                <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100 hover:border-indigo-200 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start gap-3">
                    {item.project.image ? (
                      <div className="w-full sm:w-16 h-40 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                        <img src={item.project.image} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full sm:w-16 h-20 sm:h-16 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-layer-group text-indigo-400 text-xl" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1 line-clamp-2 sm:line-clamp-1">
                        {item.project.title}
                      </h4>
                      {item.project.content && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.project.content}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-slate-400">
                        {item.project.category && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">{item.project.category}</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <i className="fa-solid fa-arrow-up" />
                          {item.project.likes_count ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <i className="fa-regular fa-comment" />
                          {item.project.comments_count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {item.comment && !item.project && (
              <div className="px-4 sm:px-6 pb-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-sm text-slate-600 italic">"{item.comment.content}"</p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="px-2.5 sm:px-6 py-2.5 border-t border-slate-50 flex items-center justify-between sm:justify-start gap-1.5 sm:gap-4">
              <button className="flex-1 sm:flex-none text-xs text-slate-600 hover:text-indigo-600 font-semibold transition-colors flex items-center justify-center sm:justify-start gap-2 rounded-lg py-2 px-2.5 hover:bg-slate-50">
                <i className="fa-regular fa-heart" />
                <span>Like</span>
              </button>
              <button className="flex-1 sm:flex-none text-xs text-slate-600 hover:text-indigo-600 font-semibold transition-colors flex items-center justify-center sm:justify-start gap-2 rounded-lg py-2 px-2.5 hover:bg-slate-50">
                <i className="fa-regular fa-comment" />
                <span>Comment</span>
              </button>
              <button className="flex-1 sm:flex-none text-xs text-slate-600 hover:text-indigo-600 font-semibold transition-colors flex items-center justify-center sm:justify-start gap-2 rounded-lg py-2 px-2.5 hover:bg-slate-50">
                <i className="fa-regular fa-share-from-square" />
                <span>Share</span>
              </button>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
              <i className="fa-solid fa-building-columns text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No campus activity yet</h3>
            <p className="text-slate-500 text-sm mb-6">Follow people to see their updates here!</p>
            <Link to="/projects" className="inline-block px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
              Explore Projects
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function formatAction(type: string): string {
  const map: Record<string, string> = {
    project_created: 'created a new project',
    project_liked: 'liked a project',
    project_commented: 'commented on a project',
    project_joined: 'joined a project',
    user_followed: 'started following someone',
    event_created: 'created an event',
  };
  return map[type] || type.replace(/_/g, ' ');
}
