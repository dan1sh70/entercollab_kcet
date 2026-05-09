import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset password</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your email to receive a reset link</p>

        {sent ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            If an account exists for {email}, you will receive a password reset link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
            </div>
            <button type="submit" className="w-full btn-primary py-3 text-base font-semibold">Send reset link</button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
