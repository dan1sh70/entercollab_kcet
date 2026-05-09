import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/admin').then((res) => setData(res.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  if (!data) return <div className="p-6 text-center text-red-500">Access denied</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center"><p className="text-3xl font-bold text-indigo-600">{data.stats.users}</p><p className="text-sm text-slate-500">Users</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center"><p className="text-3xl font-bold text-indigo-600">{data.stats.projects}</p><p className="text-sm text-slate-500">Projects</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center"><p className="text-3xl font-bold text-indigo-600">{data.stats.colleges}</p><p className="text-sm text-slate-500">Colleges</p></div>
      </div>
      <div className="flex gap-3">
        <Link to="/admin/users" className="btn-secondary">Manage Users</Link>
        <Link to="/admin/projects" className="btn-secondary">Manage Projects</Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-bold text-slate-800 mb-3">Recent Users</h3>
          {data.recentUsers.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-800">{u.name}</span><span className="text-xs text-slate-400">{u.email}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-bold text-slate-800 mb-3">Recent Projects</h3>
          {data.recentProjects.map((p: any) => (
            <div key={p.id} className="py-2 border-b border-slate-50 last:border-0"><span className="text-sm text-slate-800">{p.title || 'Untitled'}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
