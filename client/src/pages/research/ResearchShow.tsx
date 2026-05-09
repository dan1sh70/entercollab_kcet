import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { avatarUrl } from '../../lib/utils';
import api from '../../lib/api';

export default function ResearchShow() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const [paper, setPaper] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get(`/research/${id}`).then((res) => setPaper(res.data.paper)).finally(() => setLoading(false)); }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  if (!paper) return <div className="p-6 text-center text-gray-500">Paper not found</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6 pb-24">
      <div>
        {paper.field && <span className="text-xs font-bold text-purple-600 uppercase">{paper.field}</span>}
        <h1 className="text-2xl font-bold text-slate-900 mt-1">{paper.title}</h1>
        <p className="text-sm text-slate-500 mt-1">by {paper.authors}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={avatarUrl(paper.user.name, paper.user.profilePhotoPath)} className="w-10 h-10 rounded-full" />
          <div><p className="font-bold text-sm text-slate-900">{paper.user.name}</p><p className="text-xs text-slate-500">Submitted by</p></div>
        </div>
        {authUser?.id === paper.user.id && (
          <Link to={`/research/${id}/edit`} className="btn-secondary text-sm">Edit Paper</Link>
        )}
      </div>
      {paper.doi && <p className="text-sm text-slate-500">DOI: <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener" className="text-indigo-600 hover:underline">{paper.doi}</a></p>}
      {paper.publicationDate && <p className="text-sm text-slate-500">Published: {new Date(paper.publicationDate).toLocaleDateString()}</p>}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-3">Abstract</h3>
        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{paper.abstract}</p>
      </div>
      {paper.filePath && <a href={paper.filePath} target="_blank" rel="noopener" className="btn-primary inline-flex items-center gap-2"><i className="fa-solid fa-download" /> Download PDF</a>}
    </div>
  );
}
