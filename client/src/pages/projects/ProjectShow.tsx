import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { avatarUrl, timeAgo } from '../../lib/utils';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';

export default function ProjectShow() {
  const { id } = useParams();
  const { user } = useAuth();
  const { on, joinProject, leaveProject } = useSocket();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [joining, setJoining] = useState(false);
  const [hasRequestedJoin, setHasRequestedJoin] = useState(false);
  const [projectChat, setProjectChat] = useState<{ id: number } | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);

  useEffect(() => {
    api.get(`/projects/${id}`).then((res) => {
      setProject(res.data.project);
      setIsMember(res.data.isMember);
      setBookmarked(res.data.bookmarked ?? false);
      const reqs = res.data.project?.requests || [];
      setHasRequestedJoin(!!user?.id && reqs.some((r: any) => r.userId === user.id && r.approved === 0));
    }).finally(() => setLoading(false));
  }, [id, user?.id]);

  useEffect(() => {
    if (!id || !user?.id) {
      setChatLoading(false);
      return;
    }
    setChatLoading(true);
    api
      .get(`/chat/rooms/by-post/${id}`)
      .then((res) => setProjectChat(res.data.room))
      .catch(() => setProjectChat(null))
      .finally(() => setChatLoading(false));
  }, [id, user?.id]);

  useEffect(() => {
    if (!id) return;
    const postId = Number(id);
    if (Number.isNaN(postId)) return;
    joinProject(postId);
    const offLikes = on(
      'project:likes',
      (payload: { postId: number; likes_count: number; actorUserId: number; liked: boolean }) => {
        if (payload.postId !== postId) return;
        setProject((p: any) => {
          if (!p) return p;
          const next: any = { ...p, likes_count: payload.likes_count };
          if (user?.id === payload.actorUserId) next.is_liked = payload.liked;
          return next;
        });
      }
    );
    const offComment = on('project:comment', (payload: { postId: number; comment: any }) => {
      if (payload.postId !== postId) return;
      setProject((p: any) => {
        if (!p) return p;
        const list = p.comments || [];
        if (list.some((c: any) => c.id === payload.comment?.id)) return p;
        return { ...p, comments: [payload.comment, ...list], comments_count: (p.comments_count || 0) + 1 };
      });
    });
    const offRefresh = on('project:refresh', (payload: { postId: number }) => {
      if (payload.postId !== postId) return;
      api
        .get(`/projects/${id}`)
        .then((res) => {
          setProject(res.data.project);
          setIsMember(res.data.isMember);
          setBookmarked(res.data.bookmarked ?? false);
          const reqs = res.data.project?.requests || [];
          setHasRequestedJoin(!!user?.id && reqs.some((r: any) => r.userId === user.id && r.approved === 0));
        })
        .catch(() => {});
    });
    return () => {
      leaveProject(postId);
      offLikes();
      offComment();
      offRefresh();
    };
  }, [id, user?.id, on, joinProject, leaveProject]);

  const createProjectChat = async () => {
    if (!id) return;
    setCreatingChat(true);
    try {
      const res = await api.post('/chat/rooms', { postId: Number(id) });
      setProjectChat(res.data.room);
      showToast(res.data.created ? 'Project chat created' : 'Opening project chat');
      navigate(`/chat?room=${res.data.room.id}`);
    } catch {
      showToast('Could not create chat', 'error');
    } finally {
      setCreatingChat(false);
    }
  };

  const toggleLike = async () => {
    const res = await api.post(`/projects/${id}/like`);
    setProject((p: any) => ({ ...p, likes_count: res.data.likes_count, is_liked: res.data.status === 'liked' }));
  };

  const toggleBookmark = async () => {
    try {
      const res = await api.post(`/projects/${id}/bookmark`);
      setBookmarked(res.data.bookmarked);
      showToast(res.data.bookmarked ? 'Bookmarked!' : 'Removed bookmark');
    } catch { /* ignore */ }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const res = await api.post(`/projects/${id}/comment`, { content: commentInput });
    setProject((p: any) => ({ ...p, comments: [res.data.comment, ...p.comments], comments_count: p.comments_count + 1 }));
    setCommentInput('');
    showToast('Comment posted!');
  };

  const requestJoin = async () => {
    setJoining(true);
    try {
      const res = await api.post(`/projects/${id}/join`);
      if (res.data.status === 'requested') showToast('Join request sent!');
      else if (res.data.status === 'exists') showToast('Already requested.', 'info');
      if (res.data.status === 'requested' || res.data.status === 'exists') setHasRequestedJoin(true);
    } finally { setJoining(false); }
  };

  const approveRequest = async (userId: number, btn: HTMLButtonElement) => {
    const original = btn.innerText;
    btn.innerText = '...';
    btn.disabled = true;
    try {
      await api.post(`/projects/${id}/request/${userId}/approve`);
      showToast('Approved!');
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.project);
      setIsMember(res.data.isMember);
    } catch {
      btn.innerText = original;
      btn.disabled = false;
    }
  };

  const deleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      showToast('Project deleted');
      navigate('/projects');
    } catch { showToast('Failed to delete', 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  if (!project) return <div className="p-6 text-center text-gray-500">Project not found</div>;

  const isOwner = project.userId === user?.id;
  const tags = Array.isArray(project.tags) ? project.tags : [];
  const gallery = Array.isArray(project.media) ? project.media : [];
  const pendingRequests = (project.requests || []).filter((r: any) => r.approved === 0);
  const approvedMembers = (project.requests || []).filter((r: any) => r.approved === 1);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-24">
      {/* Hero Banner - full bleed inside the main card */}
      <div className="relative group">
        <div className="h-52 sm:h-64 md:h-72 relative">
          {project.image ? (
            <>
              <img src={project.image} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-900/35 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <i className="fa-solid fa-shapes text-5xl text-gray-600" />
            </div>
          )}

          <div className="absolute bottom-0 left-0 p-4 sm:p-6 w-full">
            <div className="space-y-3">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {project.category && (
                  <span className="px-2.5 py-0.5 bg-white/95 text-gray-900 text-[10px] sm:text-xs font-semibold uppercase tracking-wide rounded-md">
                    {project.category}
                  </span>
                )}
                {project.is_featured && (
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] sm:text-xs font-semibold uppercase tracking-wide rounded-md border border-amber-200">
                    <i className="fa-solid fa-star mr-1" /> Featured
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight drop-shadow-sm">
                {project.title}
              </h1>

              {/* Author + Date */}
              <div className="flex flex-wrap items-center gap-3 text-white/90 text-xs sm:text-sm font-medium">
                <Link to={`/profile/${project.user.id}`} className="inline-flex items-center gap-2 hover:text-white transition-colors">
                  <img src={avatarUrl(project.user.name, project.user.profilePhotoPath)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white/40 object-cover" />
                  {project.user.name}
                </Link>
                <span className="inline-flex items-center gap-1 text-white/70">
                  <i className="fa-regular fa-calendar text-[10px]" />
                  {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2 bg-gray-50/50">
        {isMember && (
          <>
            <Link to={`/projects/${id}/board`} className="px-3 py-2 bg-white text-indigo-700 font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5 text-xs sm:text-sm">
              <i className="fa-solid fa-columns" /> Board
            </Link>
            {!chatLoading && isOwner && !projectChat && (
              <button
                type="button"
                onClick={createProjectChat}
                disabled={creatingChat}
                className="px-3 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-1.5 text-xs sm:text-sm disabled:opacity-60"
              >
                {creatingChat ? (
                  <><i className="fa-solid fa-spinner fa-spin" /> Creating...</>
                ) : (
                  <><i className="fa-solid fa-plus" /> Create project chat</>
                )}
              </button>
            )}
            {!chatLoading && projectChat && (
              <Link
                to={`/chat?room=${projectChat.id}`}
                className="px-3 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <i className="fa-regular fa-comments" /> Open chat
              </Link>
            )}
            {!chatLoading && !isOwner && !projectChat && (
              <span className="px-2 text-xs text-gray-400" title="The project owner has not created a chat room yet">
                No project chat yet
              </span>
            )}
          </>
        )}
        {!isMember && !isOwner && (
          <button
            onClick={requestJoin}
            disabled={joining || hasRequestedJoin}
            className={`px-3 py-2 font-semibold rounded-lg transition flex items-center gap-1.5 text-xs sm:text-sm disabled:opacity-60 ${
              hasRequestedJoin ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {joining ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Requesting...</>
            ) : hasRequestedJoin ? (
              <><i className="fa-solid fa-clock" /> Requested</>
            ) : (
              <><i className="fa-solid fa-user-plus" /> Request to join</>
            )}
          </button>
        )}
        <button
          onClick={toggleBookmark}
          className={`px-3 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 text-xs sm:text-sm border ${
            bookmarked
              ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm shadow-amber-100'
              : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
          }`}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <i className={`${bookmarked ? 'fa-solid text-amber-500' : 'fa-regular text-slate-400'} fa-bookmark`} />
        </button>
        {isOwner && (
          <>
            <Link to={`/projects/${id}/edit`} className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-xs sm:text-sm" title="Edit">
              <i className="fa-solid fa-pen-to-square" />
            </Link>
            <button onClick={deleteProject} className="px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition text-xs sm:text-sm" title="Delete">
              <i className="fa-solid fa-trash" />
            </button>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleLike}
            className={`px-3 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 text-xs sm:text-sm border ${project.is_liked ? 'bg-rose-50 text-rose-500 border-rose-200' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200'}`}>
            <i className="fa-solid fa-heart" /> {project.likes_count}
          </button>
        </div>
      </div>

      {/* Content Area - responsive flex layout */}
      <div className="px-4 sm:px-6 py-6">
        <div className="flex flex-col xl:flex-row gap-6 xl:gap-10">

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Overview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-indigo-600 pl-3">Project overview</h3>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {project.content}
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200">#{tag}</span>
                ))}
              </div>
            )}

            {/* Media Gallery */}
            {gallery.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-indigo-600 pl-3">Media gallery</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {gallery.map((media: string, i: number) => (
                    <div key={i} className="rounded-lg overflow-hidden aspect-video group cursor-pointer relative bg-gray-100 border border-gray-200">
                      <img src={media} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <i className="fa-solid fa-expand text-white text-2xl" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-indigo-600 pl-3">Discussion</h3>
                <span className="text-sm text-gray-500">{project.comments_count} comments</span>
              </div>

              <form onSubmit={addComment} className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-9 h-9 rounded-full bg-indigo-50 flex-shrink-0 flex items-center justify-center font-semibold text-indigo-600 border border-gray-200 text-sm">
                  {user?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)} rows={2}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder-gray-400 resize-none"
                    placeholder="Add to the conversation..." />
                  <div className="flex justify-end mt-2">
                    <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
                      Post
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-4">
                {(project.comments || []).map((comment: any) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex-shrink-0 flex items-center justify-center font-semibold text-gray-600 group-hover:border-indigo-300 transition-colors text-sm">
                      {comment.user?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{comment.user?.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full xl:w-72 flex-shrink-0 space-y-5">
            {/* Engagement Card */}
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Engagement</div>
                  <div className="text-xl font-bold text-gray-900">{project.likes_count} likes</div>
                </div>
                <button onClick={toggleLike}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition border ${project.is_liked ? 'bg-rose-50 text-rose-500 border-rose-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border-gray-200'}`}>
                  <i className="fa-solid fa-heart" />
                </button>
              </div>

              <div className="h-px bg-gray-200 w-full mb-4" />

              {/* Team */}
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <i className="fa-solid fa-users text-indigo-600" /> Team
              </h4>
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-semibold">
                    {project.user.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{project.user.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Owner</p>
                  </div>
                </div>
                {approvedMembers.slice(0, 4).map((req: any) => (
                  <div key={req.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-semibold border border-gray-200">
                      {req.user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{req.user?.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags in sidebar */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tags.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-medium rounded border border-gray-200">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Trust Score */}
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-shield-halved text-indigo-600" />
                  <div>
                    <div className="text-base font-bold text-indigo-900">{project.user.totalTrustPoints ?? 0}</div>
                    <div className="text-[10px] text-indigo-700 font-semibold uppercase">Trust score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Panel */}
            {isOwner && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                    <i className="fa-solid fa-user-gear text-gray-600" /> Owner
                  </h4>
                  {pendingRequests.length > 0 ? (
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Pending requests</span>
                      <div className="font-bold text-gray-900 text-lg">{pendingRequests.length}</div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-3">No pending join requests.</p>
                  )}
                  <Link to={`/projects/${id}/edit`} className="block w-full py-2 bg-white border border-gray-200 rounded-lg text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                    Edit project
                  </Link>
                </div>

                {pendingRequests.length > 0 && (
                  <ul className="space-y-2">
                    {pendingRequests.slice(0, 3).map((req: any) => (
                      <li key={req.id} className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-800 truncate">{req.user?.name}</span>
                        <button onClick={(e) => approveRequest(req.userId, e.currentTarget)}
                          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 shrink-0">
                          Accept
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
