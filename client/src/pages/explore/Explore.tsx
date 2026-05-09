import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { avatarUrl } from '../../lib/utils';
import api from '../../lib/api';

type Filter = 'all' | 'projects' | 'research' | 'users' | 'colleges';

const SEARCH_DEBOUNCE_MS = 280;

const FILTERS: { id: Filter; label: string; hint: string }[] = [
  { id: 'all', label: 'All', hint: 'Everything' },
  { id: 'users', label: 'People', hint: 'Friends & members' },
  { id: 'projects', label: 'Projects', hint: 'Collaborations' },
  { id: 'research', label: 'Research', hint: 'Papers & posts' },
  { id: 'colleges', label: 'Colleges', hint: 'Universities' },
];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [type, setType] = useState<Filter>(() => (searchParams.get('type') as Filter) || 'all');
  const [results, setResults] = useState<{
    projects: any[];
    research: any[];
    users: any[];
    colleges: any[];
  }>({ projects: [], research: [], users: [], colleges: [] });
  const [loading, setLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string, t: Filter) => {
    if (!q.trim()) {
      setResults({ projects: [], research: [], users: [], colleges: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q.trim())}&type=${t}`);
      setResults(res.data);
    } catch {
      setResults({ projects: [], research: [], users: [], colleges: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const raw = (searchParams.get('type') as Filter) || 'all';
    const t = FILTERS.some((f) => f.id === raw) ? raw : 'all';
    setQuery(q);
    setType(t);
    if (q.trim()) void runSearch(q, t);
    else setResults({ projects: [], research: [], users: [], colleges: [] });
  }, [searchParams, runSearch]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current != null) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  /** Update URL (debounced) so API runs via searchParams effect — instant input feedback. */
  const onExploreQueryChange = (value: string) => {
    setQuery(value);
    if (searchDebounceRef.current != null) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value.trim()) next.set('q', value.trim());
          else next.delete('q');
          return next;
        },
        { replace: true }
      );
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchDebounceRef.current != null) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (query.trim()) next.set('q', query.trim());
        else next.delete('q');
        next.set('type', type);
        return next;
      },
      { replace: true }
    );
  };

  const selectFilter = (id: Filter) => {
    setType(id);
    const next = new URLSearchParams(searchParams);
    next.set('type', id);
    if (query.trim()) next.set('q', query.trim());
    setSearchParams(next);
  };

  const hasResults =
    (results.projects?.length || 0) +
      (results.research?.length || 0) +
      (results.users?.length || 0) +
      (results.colleges?.length || 0) >
    0;

  const showEmpty = !loading && query.trim() && !hasResults;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto custom-scrollbar">
      <div className="border-b border-slate-100 bg-gradient-to-b from-indigo-50/80 to-white px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-[1600px]">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Explore</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Find people, projects & more
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Search across members, projects, research, and colleges — one place to discover everything on EnterCollab.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => onExploreQueryChange(e.target.value)}
                placeholder="Search by name, topic, project title, ID…"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-base"
                autoComplete="off"
                enterKeyHint="search"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => selectFilter(f.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                    type === f.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 sm:text-xs">
              Tip: use filters to narrow to people, projects, research, or colleges.
            </p>
          </form>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-8 lg:px-10">
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
              <i className="fa-solid fa-compass text-2xl text-indigo-500" />
            </div>
            <p className="text-sm font-semibold text-slate-800">Start exploring</p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Enter a search above to find members to connect with, projects to join, research to read, and colleges to follow.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            <p className="mt-3 text-sm">Searching…</p>
          </div>
        )}

        {showEmpty && (
          <div className="rounded-2xl border border-slate-100 bg-white py-12 text-center shadow-sm">
            <i className="fa-regular fa-face-frown-open text-3xl text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-900">No results</p>
            <p className="mt-1 text-xs text-slate-500">Try different keywords or switch the filter above.</p>
          </div>
        )}

        {!loading && query.trim() && hasResults && (
          <div className="space-y-8 pb-8">
            {(type === 'all' || type === 'users') && results.users?.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  <i className="fa-solid fa-user-group text-indigo-500" />
                  People
                </h2>
                <ul className="space-y-2">
                  {results.users.map((u: any) => (
                    <li key={u.id}>
                      <Link
                        to={`/profile/${u.id}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                      >
                        <img
                          src={avatarUrl(u.name, u.profilePhotoPath)}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-white"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <p className="truncate text-xs text-slate-500">{u.university || u.email}</p>
                        </div>
                        <i className="fa-solid fa-chevron-right text-xs text-slate-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(type === 'all' || type === 'projects') && results.projects?.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  <i className="fa-solid fa-layer-group text-indigo-500" />
                  Projects
                </h2>
                <ul className="space-y-2">
                  {results.projects.map((p: any) => (
                    <li key={p.id}>
                      <Link
                        to={`/projects/${p.id}`}
                        className="block rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                      >
                        <h3 className="font-semibold text-slate-900">{p.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.content}</p>
                        {p.user && (
                          <p className="mt-2 text-xs text-slate-400">
                            <span className="font-medium text-slate-500">{p.user.name}</span>
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(type === 'all' || type === 'research') && results.research?.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  <i className="fa-solid fa-flask text-indigo-500" />
                  Research
                </h2>
                <ul className="space-y-2">
                  {results.research.map((r: any) => (
                    <li key={r.id}>
                      <Link
                        to={`/research/${r.id}`}
                        className="block rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                      >
                        <h3 className="font-semibold text-slate-900">{r.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{r.abstract}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(type === 'all' || type === 'colleges') && results.colleges?.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  <i className="fa-solid fa-graduation-cap text-indigo-500" />
                  Colleges
                </h2>
                <ul className="space-y-2">
                  {results.colleges.map((c: any) => (
                    <li key={c.id}>
                      <Link
                        to={`/colleges/${c.slug}`}
                        className="block rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                      >
                        <h3 className="font-semibold text-slate-900">{c.name}</h3>
                        {c.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.description}</p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
