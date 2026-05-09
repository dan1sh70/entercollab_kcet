import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { timeAgo } from '../../lib/utils';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { showToast } from '../../components/layout/Toast';

interface Project {
  id: number; title: string; content: string; image: string | null; category: string | null;
  tags: string[]; createdAt: string; likes_count: number; comments_count: number;
  bookmarked?: boolean;
  user: { id: number; name: string; profilePhotoPath: string | null; university: string | null };
}

const DOMAINS = ['Computer Science', 'Engineering', 'AI & ML', 'Bio-Tech', 'Humanities', 'Physics'];
const COLLAB_TYPES = ['Remote', 'On-Campus', 'Open to Students'];

export default function ProjectsIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    const tag = searchParams.get('tag');
    const category = searchParams.get('category');
    const params = new URLSearchParams();
    if (tag) params.set('tag', tag);
    if (category) params.set('category', category);
    api.get(`/projects?${params}`).then((res) => setProjects(res.data.projects)).finally(() => setLoading(false));
  }, [searchParams]);

  const filteredProjects = projects.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase())
  );

  const toggleBookmark = async (e: React.MouseEvent, projectId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.post(`/projects/${projectId}/bookmark`);
      const next = !!res.data.bookmarked;
      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, bookmarked: next } : p)));
      showToast(next ? 'Bookmarked' : 'Removed bookmark');
    } catch {
      showToast('Could not update bookmark', 'error');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading projects...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="min-h-full pb-20">
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between py-5 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                  <i className="fa-solid fa-layer-group text-indigo-600" /> Projects Directory
                </h1>
                <p className="text-slate-500 text-sm mt-1">Discover, collaborate, and contribute to academic &amp; technical research.</p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/projects/mine" className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all text-sm shadow-sm">
                  <i className="fa-regular fa-folder-open mr-2" /> My Projects
                </Link>
                <Link to="/projects/create" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-sm shadow-sm flex items-center">
                  <i className="fa-solid fa-plus mr-2" /> Create Project
                </Link>
              </div>
            </div>

            {/* Search Bar */}
            <div className="pb-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium"
                  placeholder="Search by project title, skills, institution, or keywords..." />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 hidden md:block">CMD + K</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Domain</h3>
                  <button onClick={() => setSearchParams({})} className="text-[10px] text-indigo-600 hover:underline">Clear</button>
                </div>
                <div className="space-y-2.5">
                  {DOMAINS.map((cat) => (
                    <label key={cat} className="flex items-center group cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                      <span className="ml-2.5 text-sm text-slate-600 group-hover:text-slate-900">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Institution</h3>
                <div className="relative mb-3">
                  <i className="fa-solid fa-university absolute left-2.5 top-2.5 text-slate-400 text-xs" />
                  <input type="text" placeholder="Filter by college..."
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  {['MIT', 'Stanford', 'Harvard'].map((inst) => (
                    <label key={inst} className="flex items-center group cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                      <span className="ml-2.5 text-sm text-slate-600">{inst}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Collaboration</h3>
                <div className="space-y-2.5">
                  {COLLAB_TYPES.map((type, i) => (
                    <label key={type} className="flex items-center group cursor-pointer">
                      <input type="checkbox" defaultChecked={i === 2} className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                      <span className="ml-2.5 text-sm text-slate-600">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Listing */}
            <main className="flex-1 min-w-0">
              {/* Sort & View Controls */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <p className="text-sm text-slate-500">Showing <span className="font-bold text-slate-900">{filteredProjects.length}</span> active projects</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Sort by:</span>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                      className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer pr-8 py-0">
                      <option value="recent">Most Relevant</option>
                      <option value="trusted">Most Trusted</option>
                      <option value="updated">Recently Updated</option>
                    </select>
                  </div>
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}>
                      <i className="fa-solid fa-list-ul text-sm" />
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}>
                      <i className="fa-solid fa-border-all text-sm" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Project Cards */}
              {viewMode === 'list' ? (
                <div className="space-y-4">
                  {filteredProjects.map((project) => {
                    const ptags = Array.isArray(project.tags) ? project.tags : [];
                    const isOwn = !!user?.id && project.user?.id === user.id;
                    return (
                      <div key={project.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:border-indigo-300 transition-colors group relative shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="hidden md:flex flex-col items-center gap-2 w-16 pt-1 flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                              {(project.category || 'OT').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 mt-1">98%</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Recruiting
                                  </span>
                                  <span className="text-xs text-slate-400 font-medium">&bull; {project.category}</span>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                  <Link to={`/projects/${project.id}`}>{project.title}</Link>
                                </h2>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => toggleBookmark(e, project.id)}
                                className={`rounded-lg p-2 transition-colors ${
                                  project.bookmarked
                                    ? 'bg-amber-50 text-amber-600 border border-amber-200 shadow-sm'
                                    : 'text-slate-300 hover:text-slate-500 border border-transparent hover:bg-slate-50'
                                }`}
                                title={project.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                              >
                                <i className={`${project.bookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark text-lg`} />
                              </button>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4 max-w-3xl line-clamp-2">{project.content}</p>
                            <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-slate-500">
                              <div className="flex items-center gap-2">
                                <i className="fa-regular fa-building text-slate-400" />
                                <span className="font-medium text-slate-700">{project.user.university || 'University'}</span>
                                <i className="fa-solid fa-circle-check text-sky-500 text-xs" title="Verified Institution" />
                              </div>
                              <div className="flex items-center gap-2">
                                <i className="fa-regular fa-clock text-slate-400" />
                                <span>Updated {timeAgo(project.createdAt)}</span>
                              </div>
                              {ptags.length > 0 && (
                                <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                                  {ptags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200">{tag}</span>
                                  ))}
                                  {ptags.length > 3 && <span className="text-xs text-slate-400">+{ptags.length - 3}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="w-full md:w-auto flex md:flex-col gap-2 mt-4 md:mt-0 flex-shrink-0">
                            <Link to={`/projects/${project.id}`} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm text-center whitespace-nowrap">
                              View Details
                            </Link>
                            {isOwn && (
                              <Link to={`/projects/${project.id}/edit`} className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 font-bold text-sm rounded-lg hover:bg-indigo-50 transition-all shadow-sm text-center whitespace-nowrap">
                                <i className="fa-solid fa-pen-to-square mr-2" /> Edit
                              </Link>
                            )}
                            <button className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 text-center whitespace-nowrap">
                              Apply Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => {
                    const isOwn = !!user?.id && project.user?.id === user.id;
                    return (
                    <div key={project.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all group relative">
                      <button
                        type="button"
                        onClick={(e) => toggleBookmark(e, project.id)}
                        className={`absolute top-3 left-3 z-10 w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                          project.bookmarked
                            ? 'bg-amber-50 text-amber-600 border border-amber-200 shadow-sm'
                            : 'bg-white/95 text-slate-300 border border-slate-200 hover:text-slate-500 hover:bg-white'
                        }`}
                        title={project.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                      >
                        <i className={`${project.bookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark`} />
                      </button>
                      {isOwn && (
                        <Link
                          to={`/projects/${project.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-white/95 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700 hover:bg-indigo-50 shadow-sm"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen-to-square" />
                        </Link>
                      )}
                      <Link to={`/projects/${project.id}`} className="block">
                      {project.image && (
                        <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                          <img src={project.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">{project.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{project.content}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span><i className="fa-solid fa-arrow-up mr-1" />{project.likes_count}</span>
                          <span><i className="fa-regular fa-comment mr-1" />{project.comments_count}</span>
                          {project.category && <span className="ml-auto px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">{project.category}</span>}
                        </div>
                      </div>
                      </Link>
                    </div>
                  );})}
                </div>
              )}

              {filteredProjects.length === 0 && (
                <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-300">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                    <i className="fa-solid fa-magnifying-glass text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No projects found matching criteria</h3>
                  <p className="text-slate-500 text-sm mt-1 mb-6">Try adjusting your filters or search terms.</p>
                  <button onClick={() => { setSearch(''); setSearchParams({}); }} className="text-indigo-600 font-bold text-sm hover:underline">Clear all filters</button>
                </div>
              )}
            </main>

            {/* Right Context Panel - visible on wide screens */}
            <aside className="hidden 2xl:block w-72 flex-shrink-0 space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-3">Recommended for You</h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 shrink-0"><i className="fa-solid fa-code" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 hover:text-indigo-600 line-clamp-2 cursor-pointer">Decentralized Voting System using...</p>
                      <p className="text-xs text-slate-500 mt-0.5">95% Match &bull; Blockchain</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded flex items-center justify-center text-emerald-600 shrink-0"><i className="fa-solid fa-leaf" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 hover:text-indigo-600 line-clamp-2 cursor-pointer">Sustainable Energy Grid Optimization</p>
                      <p className="text-xs text-slate-500 mt-0.5">88% Match &bull; Engineering</p>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 text-xs font-bold text-indigo-600 hover:bg-indigo-50 py-2 rounded transition-colors">View All Matches</button>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-lg p-5 text-white shadow-lg">
                <h4 className="text-sm font-bold opacity-90 mb-2">Publish Research?</h4>
                <p className="text-xs opacity-70 leading-relaxed mb-4">Get your project verified by top institutions and attract global collaborators.</p>
                <button className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded font-bold text-xs transition-all">Start Verification</button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
