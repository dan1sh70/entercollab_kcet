import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { avatarUrl } from '../../lib/utils';
import api from '../../lib/api';

export default function ResearchIndex() {
  const [searchParams] = useSearchParams();
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    const field = searchParams.get('field'); if (field) params.set('field', field);
    const search = searchParams.get('search'); if (search) params.set('search', search);
    api.get(`/research?${params}`).then((res) => setPapers(res.data.papers)).finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Research Papers</h1><p className="text-sm text-slate-500">Browse and share academic research</p></div>
        <Link to="/research/create" className="btn-primary flex items-center gap-2"><i className="fa-solid fa-plus" /> Submit Paper</Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-6 pb-20">
        {papers.map((paper) => (
          <Link key={paper.id} to={`/research/${paper.id}`} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <img src={avatarUrl(paper.user.name, paper.user.profilePhotoPath)} className="w-7 h-7 rounded-full" />
              <span className="text-xs font-medium text-slate-600">{paper.user.name}</span>
              {paper.field && <span className="ml-auto text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium">{paper.field}</span>}
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{paper.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-3">{paper.abstract}</p>
            {paper.authors && <p className="text-xs text-slate-400 mt-2">by {paper.authors}</p>}
          </Link>
        ))}
      </div>
      {papers.length === 0 && <div className="text-center py-12 text-slate-400">No research papers found</div>}
    </div>
  );
}
