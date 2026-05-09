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
        <div className="sticky top-0 z-30 border-b border-white/70 bg-white/75 backdrop-blur-xl">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
              <div>
                <h1 className="page-title flex items-center gap-3">
                  <i className="fa-solid fa-layer-group text-indigo-600" /> Projects Directory
                </h1>
                <p className="page-subtitle max-w-2xl">Discover, collaborate, and contribute to academic and technical research with clearer filters and stronger scanability.</p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/projects/mine" className="btn-secondary text-sm shadow-sm">
                  <i className="fa-regular fa-folder-open mr-2" /> My Projects
                </Link>
                <Link to="/projects/create" className="btn-primary text-sm shadow-sm shadow-slate-900/10">
                  <i className="fa-solid fa-plus mr-2" /> Create Project
                </Link>
              </div>
            </div>

            {/* Active Filters - Tag */}
            {searchParams.get('tag') && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3">
                <div className="flex items-center gap-2 flex-1">
                  <i className="fa-solid fa-filter text-indigo-600 text-sm" />
                  <span className="text-sm font-medium text-slate-700">Filtering by topic:</span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-1 text-sm font-bold text-indigo-600 shadow-sm">
                    <i className="fa-solid fa-tag text-xs" />
                    {searchParams.get('tag')}
                  </span>
                </div>
                <button
                  onClick={() => setSearchParams({})}
                  className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                >
                  <i className="fa-solid fa-xmark" />
                  Clear Filter
                </button>
              </div>
            )}

            {/* Search Bar */}
            <div className="pb-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="input-field block w-full pl-11 pr-4 py-3.5 font-medium"
                  placeholder="Search by project title, skills, institution, or keywords..." />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-400 md:block">CMD + K</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
              <div className="page-section">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Domain</h3>
                  <button onClick={() => setSearchParams({})} className="text-[11px] font-semibold text-indigo-600 hover:underline">Clear</button>
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

              <div className="page-section">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Topics</h3>
                <div className="space-y-2.5">
                  {['Coding', 'UI/UX', 'Robotics'].map((topic) => (
                    <label key={topic} className="flex items-center group cursor-pointer">
                      <input 
                        type="radio" 
                        name="topic" 
                        checked={searchParams.get('tag') === topic}
                        onChange={() => {
                          const params = new URLSearchParams(searchParams);
                          params.set('tag', topic);
                          setSearchParams(params);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                      />
                      <span className="ml-2.5 text-sm text-slate-600 group-hover:text-slate-900">{topic}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="page-section">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Institution</h3>
                <div className="relative mb-3">
                  <i className="fa-solid fa-university absolute left-2.5 top-2.5 text-slate-400 text-xs" />
                  <input type="text" placeholder="Filter by college..."
                    className="input-field w-full pl-8 pr-2 py-2 text-xs" />
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

              <div className="page-section">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Collaboration</h3>
                <div className="space-y-2.5">
                  {COLLAB_TYPES.map((type, i) => (
                    <label key={type} className="flex items-center cursor-pointer">
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
              <div className="page-toolbar mb-6 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500">Showing <span className="font-bold text-slate-900">{filteredProjects.length}</span> active projects</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Sort by:</span>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                      className="cursor-pointer border-none bg-transparent py-0 pr-8 text-sm font-semibold text-slate-800 focus:ring-0">
                      <option value="recent">Most Relevant</option>
                      <option value="trusted">Most Trusted</option>
                      <option value="updated">Recently Updated</option>
                    </select>
                  </div>
                  <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
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
                      <div key={project.id} className="page-section group relative p-4 transition-all hover:border-indigo-300">
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                          <div className="hidden md:flex flex-col items-center gap-2 w-12 pt-1 flex-shrink-0">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                              {(project.category || 'OT').substring(0, 2).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="inline-flex items-center gap-1.5 rounded border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> Recruiting
                                  </span>
                                  <span className="text-xs font-medium text-slate-400">&bull; {project.category}</span>
                                </div>
                                <h2 className="text-lg font-bold leading-tight text-slate-900 transition-colors group-hover:text-indigo-600">
                                  <Link to={`/projects/${project.id}`}>{project.title}</Link>
                                </h2>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => toggleBookmark(e, project.id)}
                                className={`rounded-xl p-2 transition-colors ${
                                  project.bookmarked
                                    ? 'border border-amber-200 bg-amber-50 text-amber-600 shadow-sm'
                                    : 'border border-transparent text-slate-300 hover:bg-slate-50 hover:text-slate-500'
                                }`}
                                title={project.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                              >
                                <i className={`${project.bookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark text-lg`} />
                              </button>
                            </div>
                            <p className="mb-3 max-w-3xl line-clamp-2 text-sm leading-relaxed text-slate-600">{project.content}</p>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                              <div className="flex items-center gap-2">
                                <i className="fa-regular fa-building text-slate-400" />
                                <span className="font-medium text-slate-700">{project.user.university || 'University'}</span>
                                <i className="fa-solid fa-circle-check text-sky-500 text-xs" title="Verified Institution" />
                              </div>
                              <div className="flex items-center gap-2">
                                <i className="fa-regular fa-clock text-slate-400" />
                                <span className="text-xs">{timeAgo(project.createdAt)}</span>
                              </div>
                              {ptags.length > 0 && (
                                <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                                  {ptags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tag}</span>
                                  ))}
                                  {ptags.length > 3 && <span className="text-xs text-slate-400">+{ptags.length - 3}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex w-full flex-shrink-0 gap-2 md:mt-0 md:w-auto md:flex-col">
                            <Link to={`/projects/${project.id}`} className="whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50">
                              View Details
                            </Link>
                            {isOwn && (
                              <Link to={`/projects/${project.id}/edit`} className="whitespace-nowrap rounded-xl border border-indigo-200 bg-white px-4 py-2 text-center text-sm font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-50">
                                <i className="fa-solid fa-pen-to-square mr-2" /> Edit
                              </Link>
                            )}
                            <button className="whitespace-nowrap rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700">
                              Apply Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map((project) => {
                    const isOwn = !!user?.id && project.user?.id === user.id;
                    return (
                    <div key={project.id} className="page-section group relative overflow-hidden p-0 transition-all hover:border-indigo-200 hover:shadow-md">
                      <button
                        type="button"
                        onClick={(e) => toggleBookmark(e, project.id)}
                        className={`absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                          project.bookmarked
                            ? 'border border-amber-200 bg-amber-50 text-amber-600 shadow-sm'
                            : 'border border-slate-200 bg-white/95 text-slate-300 hover:bg-white hover:text-slate-500'
                        }`}
                        title={project.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                      >
                        <i className={`${project.bookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark`} />
                      </button>
                      {isOwn && (
                        <Link
                          to={`/projects/${project.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-3 top-3 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen-to-square" />
                        </Link>
                      )}
                      <Link to={`/projects/${project.id}`} className="block">
                      {project.image && (
                        <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                          <img src={project.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="mb-2 line-clamp-1 font-bold text-slate-900">{project.title}</h3>
                        <p className="mb-3 line-clamp-2 text-sm text-slate-500">{project.content}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span><i className="fa-solid fa-arrow-up mr-1" />{project.likes_count}</span>
                          <span><i className="fa-regular fa-comment mr-1" />{project.comments_count}</span>
                          {project.category && <span className="ml-auto rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-600">{project.category}</span>}
                        </div>
                      </div>
                      </Link>
                    </div>
                  );})}
                </div>
              )}

              {filteredProjects.length === 0 && (
                <div className="empty-state border-dashed border-slate-300">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                    <i className="fa-solid fa-magnifying-glass text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No projects found matching criteria</h3>
                  <p className="mt-1 mb-6 text-sm text-slate-500">Try adjusting your filters or search terms.</p>
                  <button onClick={() => { setSearch(''); setSearchParams({}); }} className="text-sm font-bold text-indigo-600 hover:underline">Clear all filters</button>
                </div>
              )}
            </main>

          </div>
        </div>
      </div>
    </div>
  );
}
