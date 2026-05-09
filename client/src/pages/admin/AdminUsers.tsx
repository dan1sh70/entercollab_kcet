import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/admin/users').then((res) => setUsers(res.data.users)).finally(() => setLoading(false)); }, []);

  const banUser = async (userId: number) => {
    await api.post(`/admin/users/${userId}/ban`);
    showToast('User restricted');
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr><th className="text-left p-4 font-medium text-slate-600">Name</th><th className="text-left p-4 font-medium text-slate-600">Email</th><th className="text-left p-4 font-medium text-slate-600">Type</th><th className="p-4"></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-50">
                <td className="p-4 text-slate-900 font-medium">{u.name}</td>
                <td className="p-4 text-slate-500">{u.email}</td>
                <td className="p-4 text-slate-500">{u.accountType}</td>
                <td className="p-4"><button onClick={() => banUser(u.id)} className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Restrict</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
