import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';

const CATEGORIES = [
  { value: 'design', icon: 'fa-solid fa-palette', name: 'Design' },
  { value: 'development', icon: 'fa-solid fa-code', name: 'Dev' },
  { value: 'marketing', icon: 'fa-solid fa-chart-line', name: 'Growth' },
  { value: 'art', icon: 'fa-solid fa-paintbrush', name: 'Art' },
  { value: 'education', icon: 'fa-solid fa-graduation-cap', name: 'Edu' },
  { value: 'other', icon: 'fa-solid fa-globe', name: 'Other' },
];

export default function ProjectCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => setTags(tags.filter((_, i) => i !== index));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) { showToast('Please select a category', 'error'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      if (tags.length > 0) formData.append('tags', JSON.stringify(tags));
      if (image) formData.append('image', image);

      await api.post('/projects', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Project created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create project.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 pb-24">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mb-2 tracking-tight">
            Launch Your Vision
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Share your ideas, find collaborators, and turn concepts into reality.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Project Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="What's your next big thing?" required maxLength={150} />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 min-h-[140px] resize-y focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all leading-relaxed"
                placeholder="What problem does it solve? Who do you need on the team?" required />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Category</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CATEGORIES.map((cat) => (
                  <label key={cat.value} htmlFor={`cat-${cat.value}`}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-center
                      ${category === cat.value
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700'}`}>
                    <input type="radio" name="category" id={`cat-${cat.value}`} value={cat.value}
                      checked={category === cat.value} onChange={() => setCategory(cat.value)} className="sr-only" />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base mb-1.5 transition-all
                      ${category === cat.value ? 'bg-white text-indigo-600' : 'bg-slate-50'}`}>
                      <i className={cat.icon} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide">{cat.name}</span>
                    {category === cat.value && (
                      <div className="absolute top-1.5 right-1.5">
                        <div className="w-4 h-4 bg-white text-slate-900 rounded-full flex items-center justify-center shadow">
                          <i className="fa-solid fa-check text-[8px]" />
                        </div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Tags & Image - stacked on small, side by side on medium+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tags */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tags</label>
                <div className="relative mb-2">
                  <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 pl-8 pr-16 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Add tag..." />
                  <i className="fa-solid fa-hashtag absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <button type="button" onClick={addTag} className="absolute right-1.5 top-1 bottom-1 px-2.5 bg-slate-800 text-white rounded-md text-[10px] font-bold hover:bg-indigo-600 transition-colors">ADD</button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                  {tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-white border border-indigo-100 text-indigo-700 shadow-sm">
                      #{tag.replace('#', '')}
                      <button type="button" onClick={() => removeTag(i)} className="ml-1.5 text-indigo-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark text-[10px]" /></button>
                    </span>
                  ))}
                  {tags.length === 0 && <span className="text-xs text-slate-400 py-1">No tags added yet</span>}
                </div>
              </div>

              {/* Image Upload */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Cover Image</label>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-all group cursor-pointer bg-white"
                  onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  {!imagePreview ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <i className="fa-regular fa-image text-lg" />
                      </div>
                      <p className="text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">Click to Upload</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">1920x1080 recommended</p>
                    </div>
                  ) : (
                    <img src={imagePreview} className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-5 border-t border-slate-100">
              <button type="button" onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-slate-500 font-semibold hover:bg-slate-50 transition-colors">
                <i className="fa-solid fa-arrow-left text-[10px]" /> Cancel
              </button>
              <button type="submit" disabled={loading}
                className="relative group px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 overflow-hidden disabled:opacity-50">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  {loading ? 'Publishing...' : <>Launch Project <i className="fa-solid fa-rocket text-xs" /></>}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
