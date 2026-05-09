import { Outlet, Link, useLocation } from 'react-router-dom';

export default function GuestLayout() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="app-shell relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_30%),linear-gradient(to_bottom,rgba(248,250,252,1),rgba(255,255,255,0.98))]" />
        <div className="absolute right-[-5%] top-[-10%] h-96 w-96 rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
      </div>
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="page-shell flex h-16 items-center justify-between py-0">
          <Link to="/" className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 sm:text-base">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <span className="text-lg font-bold text-indigo-600">EC</span>
            </div>
            EnterCollab
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:gap-4">
            {path === '/login' && (
              <>
                <Link to="/register" className="font-medium text-slate-600 transition-colors hover:text-indigo-600">Register</Link>
                <Link to="/register/institution" className="hidden text-slate-500 transition-colors hover:text-slate-900 sm:inline">Organization</Link>
              </>
            )}
            {path === '/register' && (
              <Link to="/login" className="font-medium text-slate-600 transition-colors hover:text-indigo-600">Sign in</Link>
            )}
            {path === '/register/institution' && (
              <>
                <Link to="/register" className="font-medium text-slate-600 transition-colors hover:text-indigo-600">Student signup</Link>
                <Link to="/login" className="text-slate-500 transition-colors hover:text-slate-900">Sign in</Link>
              </>
            )}
            {path === '/forgot-password' && (
              <Link to="/login" className="font-medium text-slate-600 transition-colors hover:text-indigo-600">Sign in</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="page-shell flex-1 py-8 sm:py-12">
        <Outlet />
      </main>

      <footer className="border-t border-white/70 bg-white/50 py-6 backdrop-blur-sm">
        <p className="text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} EnterCollab &middot; Crafted with precision by Ordinmens
        </p>
      </footer>
    </div>
  );
}
