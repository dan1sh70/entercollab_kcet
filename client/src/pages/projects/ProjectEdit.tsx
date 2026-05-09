import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';

const CATEGORIES = ['design', 'development', 'marketing', 'art', 'education', 'other'];

export default function ProjectEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/projects/${id}`).then((res) => {
      const p = res.data.project;
      setTitle(p.title || '');
      setDescription(p.content || '');
      setCategory(p.category || '');
      setTags((p.tags || []).join(', '));
      setVisibility(p.visibility || 'public');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/projects/${id}`, { title, description, category, tags, visibility });
      showToast('Project updated!');
      navigate(`/projects/${id}`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 pb-24">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Edit Project</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Project Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
                required />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-white">
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500"
                required />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tags</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. ai, robotics, laravel"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500" />
              <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Visibility</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="visibility" value="public" checked={visibility === 'public'} onChange={() => setVisibility('public')} className="text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="visibility" value="private" checked={visibility === 'private'} onChange={() => setVisibility('private')} className="text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Private</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-slate-100">
              <Link to={`/projects/${id}`} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</Link>
              <button type="submit" disabled={saving}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
