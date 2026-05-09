import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { avatarUrl } from '../../lib/utils';
import api from '../../lib/api';

const INSTITUTION_KINDS = [
  { value: 'university', label: 'University' },
  { value: 'college', label: 'College' },
  { value: 'school', label: 'School / Academy' },
  { value: 'research_center', label: 'Research Center' },
  { value: 'other', label: 'Other' },
];

export default function RegisterInstitution() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // step 1
  const [email, setEmail] = useState('');
  // step 2
  const [code, setCode] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  // step 3 (required)
  const [institutionKind, setInstitutionKind] = useState('university');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
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
      const res = await api.post('/auth/verify-code', {
        email, code, password,
        name: institutionName,
        accountType: 'institution',
        institution_kind: institutionKind,
      });
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
    setError('');
    if (!description.trim()) { setError('Please add a description of your institution.'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('institution_kind', institutionKind);
      if (description) fd.append('description', description);
      if (website) fd.append('website', website);
      if (photo) fd.append('profile_photo', photo);
      const res = await api.patch('/auth/complete-profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save profile.');
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
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-building-columns text-indigo-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Register your institution</h1>
            <p className="text-sm text-gray-500 mt-2">For schools, colleges, universities, and research centers.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

            <form onSubmit={sendCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Official email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
                  className="input-field" placeholder="admin@university.edu" />
                <p className="mt-1.5 text-xs text-gray-400">Use your institution's email domain if possible.</p>
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 text-sm font-semibold disabled:opacity-50">
                {loading ? 'Sending code...' : 'Send verification code'}
              </button>
            </form>
          </div>

          <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-gray-50/80 text-center">
            <p className="text-sm text-gray-600 mb-2">Looking for a personal / student account?</p>
            <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              <i className="fa-solid fa-user text-xs" />
              Student registration
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
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Verify &amp; set credentials</h1>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Institution name</label>
                <input type="text" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} required
                  className="input-field" placeholder="e.g. Stanford University" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Institution type</label>
                <select value={institutionKind} onChange={(e) => setInstitutionKind(e.target.value)}
                  className="input-field">
                  {INSTITUTION_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
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
                {loading ? 'Creating account...' : 'Create institution account'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button onClick={() => { setError(''); sendCode({ preventDefault: () => {} } as any); }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Resend code</button>
              <span className="mx-2 text-gray-300">·</span>
              <button onClick={() => { setStep(1); setError(''); }} className="text-sm text-gray-400 hover:text-gray-600">Change email</button>
            </div>
          </div>
        </>
      )}

      {/* ─── Step 3: Institution details (required) ─── */}
      {step === 3 && (
        <>
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-check text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Almost there</h1>
            <p className="text-sm text-gray-500 mt-2">Tell us more about <span className="font-medium text-gray-700">{institutionName}</span>.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

            <form onSubmit={completeProfile} className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <label className="cursor-pointer group relative">
                  <img src={photoPreview || avatarUrl(institutionName, null)} className="w-20 h-20 rounded-full border-2 border-gray-100 object-cover group-hover:opacity-80 transition-opacity" />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg">Change</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)} />
                </label>
                <p className="text-xs text-gray-400">Institution logo</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required
                  className="input-field resize-none" placeholder="Describe your institution, programmes, and what you're looking for on InterCollab..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                  className="input-field" placeholder="https://university.edu" />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 text-sm font-semibold disabled:opacity-50">
                {loading ? 'Saving...' : 'Complete registration'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
