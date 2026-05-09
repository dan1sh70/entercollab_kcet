import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Sign in</h1>
        <p className="text-sm text-gray-500 mt-2">Use your account email and password.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
              className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="input-field" placeholder="••••••••" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Forgot password?
            </Link>
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 text-sm font-semibold disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <div className="mt-8 space-y-3 text-center text-sm text-gray-600">
        <p>
          No account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">Create a student account</Link>
        </p>
        <p>
          <Link to="/register/institution" className="text-gray-500 hover:text-gray-800">School, college, or university registration</Link>
        </p>
        <p>
          <Link to="/" className="text-gray-400 hover:text-gray-600">&larr; Back to home</Link>
        </p>
      </div>
    </div>
  );
}
