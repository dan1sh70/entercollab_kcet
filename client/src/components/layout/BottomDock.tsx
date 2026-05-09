import { Link, useLocation } from 'react-router-dom';

export default function BottomDock() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const dockItem = (path: string, icon: React.ReactNode, label: string, isCreate?: boolean) => (
    <Link
      to={path}
      className={`group relative flex items-center justify-center rounded-full transition-all ${
        isCreate
          ? 'h-11 w-11 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
          : `h-9 w-9 hover:bg-indigo-50 ${isActive(path) ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500'}`
      }`}
    >
      {icon}
      {!isCreate && (
        <span className="absolute -top-9 scale-0 group-hover:scale-100 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all duration-200">
          {label}
        </span>
      )}
    </Link>
  );

  return (
    <div className="fixed left-1/2 z-50 -translate-x-1/2 transform bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] lg:hidden">
      <div className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/85 px-2.5 py-1.5 shadow-lg shadow-indigo-500/15 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] max-w-[calc(100vw-1.25rem)] overflow-x-auto">
        {dockItem('/dashboard',
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px] transition-transform group-hover:scale-110">
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
          </svg>,
          'Home'
        )}
        {dockItem('/explore',
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px] transition-transform group-hover:scale-110">
            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
          </svg>,
          'Explore'
        )}
        <div className="mx-0.5 h-4 w-px bg-slate-200" />
        {dockItem('/projects/create',
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>,
          'Create',
          true
        )}
        <div className="mx-0.5 h-4 w-px bg-slate-200" />
        {dockItem('/chat',
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px] transition-transform group-hover:scale-110">
            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
          </svg>,
          'Chat'
        )}
        {dockItem('/profile',
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px] transition-transform group-hover:scale-110">
            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
          </svg>,
          'Profile'
        )}
      </div>
    </div>
  );
}
