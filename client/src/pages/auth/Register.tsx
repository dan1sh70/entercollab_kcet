import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { avatarUrl } from '../../lib/utils';
import api from '../../lib/api';

export default function Register() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // step 1
  const [email, setEmail] = useState('');
  // step 2
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  // step 3
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [skills, setSkills] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-code', { email });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== passwordConfirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-code', { email, code, password, name, accountType: 'student' });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      if (bio) fd.append('bio', bio);
      if (university) fd.append('university', university);
      if (major) fd.append('major', major);
      if (skills) fd.append('skills', skills);
      if (photo) fd.append('profile_photo', photo);
      const res = await api.patch('/auth/complete-profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser(res.data.user);
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (file: File | null) => {
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview('');
    }
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            s < step ? 'bg-green-500 text-white' : s === step ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            {s < step ? <i className="fa-solid fa-check text-[10px]" /> : s}
          </div>
          {s < 3 && <div className={`w-8 h-px ${s < step ? 'bg-green-300' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      {stepIndicator}

      {/* ─── Step 1: Email ─── */}
      {step === 1 && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-sm text-gray-500 mt-2">For students and researchers. Any valid email works.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

            <form onSubmit={sendCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
                  className="input-field" placeholder="you@example.com" />
                <p className="mt-1.5 text-xs text-gray-400">We'll send a 6-digit verification code to this address.</p>
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 text-sm font-semibold disabled:opacity-50">
                {loading ? 'Sending code...' : 'Send verification code'}
              </button>
            </form>
          </div>

          <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-gray-50/80 text-center">
            <p className="text-sm text-gray-600 mb-2">Representing a school, college, or university?</p>
            <Link to="/register/institution" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              <i className="fa-solid fa-building-columns text-xs" />
              Organization registration
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already registered?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Sign in</Link>
            {' · '}
            <Link to="/" className="text-gray-400 hover:text-gray-600">Home</Link>
          </p>
        </>
      )}

      {/* ─── Step 2: Code + Password ─── */}
      {step === 2 && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Verify &amp; set password</h1>
            <p className="text-sm text-gray-500 mt-2">
              Enter the code sent to <span className="font-medium text-gray-700">{email}</span>
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

            <form onSubmit={verifyAndCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification code</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required maxLength={6} autoFocus inputMode="numeric"
                  className="input-field text-center text-xl tracking-[0.3em] font-bold" placeholder="000000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="input-field" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  minLength={8} className="input-field" placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
                  required className="input-field" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading || code.length < 6} className="w-full btn-primary py-2.5 text-sm font-semibold disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button onClick={() => { setError(''); sendCode({ preventDefault: () => {} } as any); }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Resend code
              </button>
              <span className="mx-2 text-gray-300">·</span>
              <button onClick={() => { setStep(1); setError(''); }} className="text-sm text-gray-400 hover:text-gray-600">
                Change email
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Step 3: Profile (skippable) ─── */}
      {step === 3 && (
        <>
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-check text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">You're in!</h1>
            <p className="text-sm text-gray-500 mt-2">Complete your profile so collaborators can find you.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
            <form onSubmit={completeProfile} className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <label className="cursor-pointer group relative">
                  <img src={photoPreview || avatarUrl(name, null)} className="w-20 h-20 rounded-full border-2 border-gray-100 object-cover group-hover:opacity-80 transition-opacity" />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg">Change</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">University / School</label>
                <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)}
                  className="input-field" placeholder="e.g. Stanford University" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Major / Field</label>
                <input type="text" value={major} onChange={(e) => setMajor(e.target.value)}
                  className="input-field" placeholder="e.g. Computer Science" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  className="input-field resize-none" placeholder="Tell people about yourself..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)}
                  className="input-field" placeholder="React, Python, Design..." />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 text-sm font-semibold disabled:opacity-50">
                {loading ? 'Saving...' : 'Save & continue'}
              </button>
            </form>

            <button onClick={() => navigate('/dashboard')} className="w-full mt-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
              Skip for now &rarr;
            </button>
          </div>
        </>
      )}
    </div>
  );
}
