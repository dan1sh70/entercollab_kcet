import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { avatarUrl, timeAgo } from '../../lib/utils';
import api from '../../lib/api';

interface Project {
  id: number;
  title: string;
  content: string;
  image: string | null;
  tags: string[];
  createdAt: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  user: { id: number; name: string; profilePhotoPath: string | null; university: string | null; major: string | null };
  comments: { id: number; content: string; user: { id: number; name: string; profilePhotoPath: string | null } }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    api.get('/dashboard').then((res) => setProjects(res.data.projects)).finally(() => setLoading(false));
  }, []);

  const toggleLike = async (projectId: number) => {
    const res = await api.post(`/projects/${projectId}/like`);
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, likes_count: res.data.likes_count, is_liked: res.data.status === 'liked' } : p));
  };

  const addComment = async (e: React.FormEvent, projectId: number) => {
    e.preventDefault();
    const content = commentInputs[projectId]?.trim();
    if (!content) return;
    const res = await api.post(`/projects/${projectId}/comment`, { content });
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, comments: [res.data.comment, ...p.comments], comments_count: p.comments_count + 1 } : p));
    setCommentInputs((prev) => ({ ...prev, [projectId]: '' }));
    setOpenComments((prev) => new Set(prev).add(projectId));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading feed...</div></div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="min-h-full pb-20">
        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-white/70 bg-white/75 backdrop-blur-xl">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <img src={avatarUrl(user?.name || '', user?.profilePhotoPath)} className="w-14 h-14 rounded-full object-cover" />
              <div>
                <h1 className="page-title">Good afternoon, {user?.name?.split(' ')[0]}.</h1>
                <p className="page-subtitle">Ready to collaborate?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Feed Content */}
            <div className="flex-1 min-w-0 space-y-8">
              {/* Post Input */}
              <Link to="/projects/create" className="block">
                <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <i className="fa-solid fa-pen-nib text-sm" />
                  </div>
                  <div className="flex-1 text-sm text-slate-400">Share an update or start a new project...</div>
                  <button className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex-shrink-0">Post</button>
                </div>
              </Link>

              {/* Feed */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-slate-300">
            <i className="fa-solid fa-layer-group text-4xl text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No updates yet</h3>
            <p className="text-slate-500 text-sm mb-6">Be the first to share your research with the campus!</p>
            <Link to="/projects/create" className="inline-block px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Create Project</Link>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group">
              {/* Header */}
              <div className="px-6 py-4 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${project.user.id}`} className="relative">
                    <img src={avatarUrl(project.user.name, project.user.profilePhotoPath)} alt={project.user.name} className="w-10 h-10 rounded-full border border-slate-100 object-cover" />
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors">{project.user.name}</h3>
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded">{project.user.university || 'MIT'}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{project.user.major || 'Engineering'}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">{timeAgo(project.createdAt)}</span>
              </div>

              {/* Media */}
              {project.image && (
                <div className="w-full aspect-[16/9] bg-slate-100 relative overflow-hidden group-hover:scale-[1.01] transition-transform duration-500">
                  <img src={project.image} alt={project.title || ''} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Content */}
              <div className="px-6 py-5">
                {project.title && <h2 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{project.title}</h2>}
                <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">{project.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-3 mb-4">
                  <Link to={`/projects/${project.id}`} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center gap-2">
                    <i className="fa-regular fa-bell" /> Collaborate
                  </Link>
                  {user?.id === project.user.id && (
                    <Link to={`/projects/${project.id}/edit`} className="px-4 py-2 bg-white text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-all flex items-center gap-2">
                      <i className="fa-solid fa-pen-to-square" /> Edit
                    </Link>
                  )}
                  <button onClick={() => toggleLike(project.id)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 group/btn border ${project.is_liked ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                    <i className="fa-solid fa-arrow-up group-hover/btn:-translate-y-0.5 transition-transform" /> Upvote {project.likes_count}
                  </button>
                  <button onClick={() => setOpenComments((prev) => { const s = new Set(prev); s.has(project.id) ? s.delete(project.id) : s.add(project.id); return s; })} className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all flex items-center gap-2">
                    <i className="fa-regular fa-comment" /> Discuss {project.comments_count}
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, i) => (
                    <span key={i} className={`px-3 py-1 text-[10px] font-bold rounded-full ${i % 2 === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>#{tag}</span>
                  ))}
                </div>
              </div>

              {/* Comments Section */}
              {openComments.has(project.id) && (
                <div className="bg-slate-50 border-t border-slate-100 p-6 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Discussion</h4>
                  {project.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <img src={avatarUrl(comment.user.name, comment.user.profilePhotoPath)} className="w-8 h-8 rounded-full border border-white shadow-sm" />
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200/60 shadow-sm flex-1">
                        <p className="text-xs font-bold text-slate-900 mb-1">{comment.user.name}</p>
                        <p className="text-xs text-slate-600">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  <form onSubmit={(e) => addComment(e, project.id)} className="relative">
                    <input
                      type="text"
                      value={commentInputs[project.id] || ''}
                      onChange={(e) => setCommentInputs((prev) => ({ ...prev, [project.id]: e.target.value }))}
                      placeholder="Add to the discussion..."
                      className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent block shadow-sm"
                    />
                    <button type="submit" className="absolute right-2 top-1.5 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <i className="fa-solid fa-paper-plane" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))
        )}

            {/* Right Sidebar */}
            <aside className="hidden xl:block w-80 flex-shrink-0 space-y-6">
              {/* Profile Summary */}
              <div className="panel-surface p-6 sticky top-20">
                <div className="flex items-center gap-4 mb-5">
                  <img src={avatarUrl(user?.name || '', user?.profilePhotoPath)} className="w-14 h-14 rounded-full object-cover border-2 border-indigo-100" />
                  <div>
                    <h3 className="font-bold text-slate-900">{user?.name}</h3>
                    <p className="text-xs text-slate-500">{user?.university || 'Student'}</p>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Projects</span>
                    <span className="font-bold text-indigo-600">-</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Following</span>
                    <span className="font-bold text-indigo-600">-</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Followers</span>
                    <span className="font-bold text-indigo-600">-</span>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="panel-surface p-6">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-lightbulb text-amber-500" /> Quick Tips
                </h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="text-indigo-600 flex-shrink-0">•</span>
                    <span>Join projects that match your skills</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-600 flex-shrink-0">•</span>
                    <span>Build your portfolio with real work</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-600 flex-shrink-0">•</span>
                    <span>Connect with peers across campuses</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
