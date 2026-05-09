import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { avatarUrl } from '../../lib/utils';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';

export default function ProfileEdit() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', bio: '', university: '', major: '', nationality: '', location: '',
    skills: '', github_handle: '', linkedin_handle: '', twitter_handle: '', website: '',
    password: '', password_confirmation: ''
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/profile/edit').then((res) => {
      const u = res.data.user;
      setForm({
        name: u.name || '', email: u.email || '', bio: u.bio || '', university: u.university || '',
        major: u.major || '', nationality: u.nationality || '', location: u.location || '',
        skills: u.skills || '', github_handle: u.githubHandle || '', linkedin_handle: u.linkedinHandle || '',
        twitter_handle: u.twitterHandle || '', website: u.website || '', password: '', password_confirmation: ''
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.password_confirmation) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v && k !== 'password_confirmation') fd.append(k, v); });
      if (photo) fd.append('profile_photo', photo);
      const res = await api.patch('/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser({ ...user!, ...res.data.user });
      showToast('Profile updated!');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Are you absolutely sure?')) return;
    try {
      await api.delete('/profile', { data: { password: deletePassword } });
      showToast('Account deleted');
      window.location.href = '/';
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete account', 'error');
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value });

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 pb-24">
      <div className="max-w-3xl mx-auto">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:text-indigo-800 mb-6">
          <i className="fa-solid fa-arrow-left" /> Back to profile
        </Link>
        {/* Main Settings Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
          {/* Avatar Header */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
            <div className="relative group cursor-pointer" onClick={() => photoRef.current?.click()}>
              <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-bold border border-gray-200 overflow-hidden">
                {photo ? (
                  <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" />
                ) : user?.profilePhotoPath ? (
                  <img src={avatarUrl(form.name, user.profilePhotoPath)} className="w-full h-full object-cover" />
                ) : (
                  form.name?.charAt(0) || '?'
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-camera text-white text-lg" />
              </div>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{form.name || user?.name}</h2>
              <p className="text-gray-500 text-sm">{form.email || user?.email}</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-100">
                <i className="fa-solid fa-shield-halved" /> Verified member
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Display name</label>
                <input type="text" value={form.name} onChange={set('name')} required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" value={form.email} onChange={set('email')} required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            {/* Academic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">University / Institution</label>
                <input type="text" value={form.university} onChange={set('university')}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Major / Field of Study</label>
                <input type="text" value={form.major} onChange={set('major')}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            {/* Location Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nationality</label>
                <input type="text" value={form.nationality} onChange={set('nationality')}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input type="text" value={form.location} onChange={set('location')}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
              <textarea value={form.bio} onChange={set('bio')} rows={4}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            {/* Skills */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Skills (comma separated)</label>
              <input type="text" value={form.skills} onChange={set('skills')} placeholder="e.g. PHP, Laravel, UI Design"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            {/* Social Connections */}
            <h3 className="text-base font-semibold text-gray-900 mb-4 pt-6 border-t border-gray-200">Social connections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fa-brands fa-github mr-1.5" /> GitHub Handle
                </label>
                <input type="text" value={form.github_handle} onChange={set('github_handle')} placeholder="username"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fa-brands fa-linkedin mr-1.5" /> LinkedIn Profile
                </label>
                <input type="text" value={form.linkedin_handle} onChange={set('linkedin_handle')} placeholder="in/username"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fa-brands fa-twitter mr-1.5" /> Twitter Handle
                </label>
                <input type="text" value={form.twitter_handle} onChange={set('twitter_handle')} placeholder="@username"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fa-solid fa-globe mr-1.5" /> Website
                </label>
                <input type="text" value={form.website} onChange={set('website')} placeholder="https://example.com"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            {/* Password */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Change password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password (Optional)</label>
                  <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <input type="password" value={form.password_confirmation} onChange={set('password_confirmation')} placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-200 rounded-lg p-6 bg-red-50/50 mb-12">
          <h3 className="text-base font-semibold text-red-700 mb-2">Danger zone</h3>
          <p className="text-gray-600 text-sm mb-4">Permanently delete your account and all associated data.</p>
          <form onSubmit={handleDelete} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Confirm password" required
              className="flex-1 px-4 py-2.5 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 text-sm" />
            <button type="submit"
              className="px-5 py-2.5 bg-white border border-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition text-sm">
              Delete account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
