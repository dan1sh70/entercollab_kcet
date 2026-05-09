import { Outlet, Link, useLocation } from 'react-router-dom';

export default function GuestLayout() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-gray-900 font-semibold text-sm sm:text-base">
            <div className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center p-1">
              <span className="text-indigo-600 font-bold text-lg">IC</span>
            </div>
            InterCollab
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-sm">
            {path === '/login' && (
              <>
                <Link to="/register" className="text-gray-600 hover:text-indigo-600 font-medium">Register</Link>
                <Link to="/register/institution" className="hidden sm:inline text-gray-500 hover:text-gray-800">Organization</Link>
              </>
            )}
            {path === '/register' && (
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Sign in</Link>
            )}
            {path === '/register/institution' && (
              <>
                <Link to="/register" className="text-gray-600 hover:text-indigo-600 font-medium">Student signup</Link>
                <Link to="/login" className="text-gray-500 hover:text-gray-800">Sign in</Link>
              </>
            )}
            {path === '/forgot-password' && (
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Sign in</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-10 sm:py-14 flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-6">
        <p className="text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} InterCollab &middot; Crafted with precision by Ordinmens
        </p>
      </footer>
    </div>
  );
}
