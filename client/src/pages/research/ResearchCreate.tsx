import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';

export default function ResearchCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', abstract: '', authors: '', field: '', doi: '', publication_date: '' });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (file) fd.append('file', file);
      const res = await api.post('/research', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Paper submitted!');
      navigate(`/research/${res.data.paper.id}`);
    } catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6"><div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Submit Research Paper</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Abstract</label><textarea value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} required rows={6} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Authors</label><input type="text" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} required className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Field</label><input type="text" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} required className="input-field" placeholder="Computer Science, Physics..." /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">DOI (optional)</label><input type="text" value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Publication Date</label><input type="date" value={form.publication_date} onChange={(e) => setForm({ ...form, publication_date: e.target.value })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">PDF File</label><input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input-field" /></div>
        <div className="flex gap-3 pb-20"><button type="submit" disabled={loading} className="btn-primary py-3 px-8 font-semibold disabled:opacity-50">{loading ? 'Submitting...' : 'Submit Paper'}</button><button type="button" onClick={() => navigate(-1)} className="btn-secondary py-3 px-8">Cancel</button></div>
      </form>
    </div></div>
  );
}
