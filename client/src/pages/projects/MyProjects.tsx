import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { timeAgo } from '../../lib/utils';
import api from '../../lib/api';

export default function MyProjects() {
  const { id: paramId } = useParams();
  const { user: authUser } = useAuth();

  const userId = useMemo(() => (paramId ? parseInt(paramId, 10) : authUser?.id), [paramId, authUser?.id]);
  const isOwn = !!authUser?.id && userId === authUser.id;

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) { setLoading(false); return; }
    setLoading(true);
    api.get(`/projects?userId=${userId}`).then((res) => setProjects(res.data.projects || [])).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{isOwn ? 'My Projects' : 'Projects'}</h1>
            <p className="text-sm text-slate-500">Only projects created by this user</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={isOwn ? '/profile' : `/profile/${userId}`} className="text-sm font-semibold text-indigo-600 hover:underline">
              Back to profile
            </Link>
            {isOwn && (
              <Link to="/projects/create" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition text-sm">
                <i className="fa-solid fa-plus mr-2" /> New
              </Link>
            )}
          </div>
        </div>

        {projects.length > 0 ? (
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/projects/${p.id}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                      {p.title}
                    </Link>
                    {p.content && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.content}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <span>{timeAgo(p.createdAt)}</span>
                      <span><i className="fa-solid fa-heart mr-1" />{p.likes_count ?? 0}</span>
                      <span><i className="fa-regular fa-comment mr-1" />{p.comments_count ?? 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link to={`/projects/${p.id}`} className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100">
                      View
                    </Link>
                    {isOwn && (
                      <Link to={`/projects/${p.id}/edit`} className="px-3 py-2 bg-white border border-slate-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50">
                        <i className="fa-solid fa-pen-to-square mr-1" /> Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
            <i className="fa-solid fa-layer-group text-3xl text-slate-300 mb-3 block" />
            <p className="text-slate-500 text-sm font-medium">{isOwn ? 'You have not created any projects yet.' : 'No projects yet.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

