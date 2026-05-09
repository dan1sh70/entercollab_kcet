import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navClass = (path: string) =>
    `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
      isActive(path)
        ? 'bg-[#1e293b] text-white shadow-lg shadow-slate-900/20'
        : 'bg-white text-slate-600 hover:bg-slate-50'
    }`;

  return (
    <nav className="space-y-8 pr-2 pb-24">
      <div className="space-y-2">
        <Link to="/dashboard" className={navClass('/dashboard')}>
          <i className="fa-solid fa-magnifying-glass text-lg" />
          <span className="font-bold text-sm tracking-wide">Feed</span>
        </Link>
        <Link to="/explore" className={navClass('/explore')}>
          <i className="fa-solid fa-compass text-lg" />
          <span className="font-bold text-sm tracking-wide">Explore</span>
        </Link>
        <Link to="/feed" className={navClass('/feed')}>
          <i className="fa-solid fa-building-columns text-lg" />
          <span className="font-bold text-sm tracking-wide">Campus Life</span>
        </Link>
        <Link to="/colleges" className={navClass('/colleges')}>
          <i className="fa-solid fa-graduation-cap text-lg" />
          <span className="font-bold text-sm tracking-wide">Universities</span>
        </Link>
        <Link to="/projects" className={navClass('/projects')}>
          <i className="fa-solid fa-layer-group text-lg" />
          <span className="font-bold text-sm tracking-wide">Projects</span>
        </Link>
        <Link to="/research" className={navClass('/research')}>
          <i className="fa-solid fa-flask text-lg" />
          <span className="font-bold text-sm tracking-wide">Research</span>
        </Link>
        <Link to="/chat" className={navClass('/chat')}>
          <i className="fa-regular fa-comment-dots text-lg" />
          <span className="font-bold text-sm tracking-wide">Messages</span>
          <span className="ml-auto bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">3</span>
        </Link>
        <Link to="/events" className={navClass('/events')}>
          <i className="fa-regular fa-calendar text-lg" />
          <span className="font-bold text-sm tracking-wide">Events</span>
        </Link>
        {user?.accountType === 'institution' && (
          <Link to="/institution" className={navClass('/institution')}>
            <i className="fa-solid fa-building-columns text-lg" />
            <span className="font-bold text-sm tracking-wide">Organization</span>
          </Link>
        )}
      </div>

      {/* Explore Topics */}
      <div>
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Explore Topics</h3>
          <button className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-plus" /></button>
        </div>
        <div className="space-y-2">
          <Link to="/projects?tag=Coding" className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-indigo-600 transition-colors flex items-center justify-center text-white text-xs">
                <i className="fa-solid fa-code" />
              </div>
              <span className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">Coding</span>
            </div>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-200" />
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
          </Link>
          <Link to="/projects?tag=UI/UX" className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 text-xs group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                <i className="fa-solid fa-pen-nib" />
              </div>
              <span className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">UI/UX</span>
            </div>
          </Link>
          <Link to="/projects?tag=Robotics" className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 text-xs group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                <i className="fa-solid fa-robot" />
              </div>
              <span className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">Robotics</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
