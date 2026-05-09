import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';

export default function AdminProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/admin/projects').then((res) => setProjects(res.data.projects)).finally(() => setLoading(false)); }, []);

  const deleteProject = async (id: number) => {
    await api.delete(`/admin/projects/${id}`);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast('Project deleted');
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Manage Projects</h1>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr><th className="text-left p-4 font-medium text-slate-600">Title</th><th className="text-left p-4 font-medium text-slate-600">Author</th><th className="p-4"></th></tr></thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t border-slate-50">
                <td className="p-4 text-slate-900 font-medium">{p.title || 'Untitled'}</td>
                <td className="p-4 text-slate-500">{p.user?.name}</td>
                <td className="p-4"><button onClick={() => deleteProject(p.id)} className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
