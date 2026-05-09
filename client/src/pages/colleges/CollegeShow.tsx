import { useState, useEffect, Component, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { avatarUrl, timeAgo } from '../../lib/utils';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';

class ErrorCatcher extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(err: Error) { return { error: err.message }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-center">
          <p className="text-red-500 font-bold">Something went wrong</p>
          <p className="text-sm text-slate-500 mt-1">{this.state.error}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function CollegeShowInner() {
  const { slug } = useParams();
  const [college, setCollege] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [membersCount, setMembersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'members'>('projects');

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/colleges/${slug}`).then((res) => {
      setCollege(res.data.college);
      setProjects(res.data.projects || []);
      setIsMember(res.data.isMember ?? false);
      setMembersCount(res.data.membersCount ?? 0);
    }).catch((err) => {
      console.error('College fetch error:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load');
      setCollege(null);
    }).finally(() => setLoading(false));
  }, [slug]);

  const join = async () => {
    setJoining(true);
    try {
      await api.post(`/colleges/${college.id}/join`);
      setIsMember(true);
      setMembersCount((c) => c + 1);
      showToast('Joined college!');
    } catch {
      showToast('Failed to join', 'error');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <i className="fa-solid fa-spinner animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <i className="fa-solid fa-building-columns text-4xl text-slate-300 mb-3" />
        <p className="font-semibold">{error || 'College not found'}</p>
        <Link to="/colleges" className="mt-3 text-sm text-indigo-600 hover:underline">
          <i className="fa-solid fa-arrow-left mr-1" /> Back to Colleges
        </Link>
      </div>
    );
  }

  let hostname: string | null = null;
  try {
    if (college.website) hostname = new URL(college.website).hostname;
  } catch {
    hostname = college.website;
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-24">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative px-5 sm:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl sm:text-4xl font-black border border-white/30 shadow-lg flex-shrink-0">
              {college.logo
                ? <img src={college.logo} className="w-full h-full rounded-2xl object-cover" />
                : (college.name?.[0] || '?')
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{college.name}</h1>
                {college.isVerified === 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold rounded-full border border-white/30">
                    <i className="fa-solid fa-check text-[8px]" /> Verified
                  </span>
                )}
              </div>
              {college.description && (
                <p className="text-white/80 text-sm mt-1.5 leading-relaxed line-clamp-2">{college.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-white/70">
                {hostname && (
                  <a href={college.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors">
                    <i className="fa-solid fa-link text-[10px]" /> {hostname}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-users text-[10px]" /> {membersCount} Members
                </span>
                {college.domain && (
                  <span className="flex items-center gap-1">
                    <i className="fa-solid fa-at text-[10px]" /> {college.domain}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {isMember ? (
                <div className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-xl border border-white/30">
                  <i className="fa-solid fa-check text-green-300" /> Joined
                </div>
              ) : (
                <button onClick={join} disabled={joining}
                  className="px-5 py-2.5 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg disabled:opacity-50">
                  {joining ? <><i className="fa-solid fa-spinner animate-spin mr-1.5" /> Joining...</> : 'Join College'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-5 sm:px-8 py-3 bg-white border-b border-slate-100 flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-slate-800">{membersCount}</span>
          <span className="text-slate-500">Members</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-slate-800">{projects.length}</span>
          <span className="text-slate-500">Projects</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 sm:px-8 bg-white border-b border-slate-100">
        <div className="flex gap-1">
          {(['projects', 'members'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors capitalize
                ${activeTab === tab
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}>
              <i className={`fa-solid ${tab === 'projects' ? 'fa-layer-group' : 'fa-users'} mr-1.5 text-xs`} />
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 sm:px-8 py-6">
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800">Recent Projects</h2>
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p: any) => (
                  <Link key={p.id} to={`/projects/${p.id}`}
                    className="bg-white rounded-xl border border-slate-100 p-4 hover:border-indigo-200 hover:shadow-md transition-all group">
                    {p.image ? (
                      <div className="w-full h-32 rounded-lg overflow-hidden mb-3 bg-slate-100">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-lg mb-3 bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
                        <i className="fa-solid fa-layer-group text-2xl text-indigo-300" />
                      </div>
                    )}
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors leading-snug mb-1">
                      {p.title}
                    </h3>
                    {p.content && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{p.content}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {p.user?.name && (
                          <>
                            <img src={avatarUrl(p.user.name, p.user.profilePhotoPath)} className="w-5 h-5 rounded-full object-cover" />
                            <span className="text-xs text-slate-600 font-medium">{p.user.name}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span><i className="fa-solid fa-heart mr-0.5" /> {p.likesCount ?? p._count?.likes ?? 0}</span>
                        <span><i className="fa-solid fa-comment mr-0.5" /> {p.commentsCount ?? p._count?.comments ?? 0}</span>
                        {p.createdAt && <span>{timeAgo(p.createdAt)}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <i className="fa-solid fa-folder-open text-3xl text-slate-300 mb-3 block" />
                <p className="text-slate-500 text-sm font-medium">No projects shared yet.</p>
                <p className="text-slate-400 text-xs mt-1">Be the first to create one!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-4">Members ({membersCount})</h2>
            {college.users?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {college.users.map((cu: any) => (
                  <Link key={cu.user?.id || cu.id} to={`/profile/${cu.user?.id || cu.id}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 hover:border-indigo-200 hover:shadow-sm transition-all">
                    <img src={avatarUrl(cu.user?.name || 'User', cu.user?.profilePhotoPath)}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{cu.user?.name || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-500">
                        {cu.role === 'admin' ? (
                          <span className="text-indigo-600 font-semibold">Admin</span>
                        ) : (
                          cu.user?.major || 'Student'
                        )}
                      </p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-slate-300 text-[10px] flex-shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <i className="fa-solid fa-users text-3xl text-slate-300 mb-3 block" />
                <p className="text-slate-500 text-sm font-medium">No members yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CollegeShow() {
  return (
    <ErrorCatcher>
      <CollegeShowInner />
    </ErrorCatcher>
  );
}
