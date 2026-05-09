import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Rightbar from '../components/layout/Rightbar';
import BottomDock from '../components/layout/BottomDock';
import Toast from '../components/layout/Toast';

const WIDE_ROUTES = ['/projects/', '/colleges/', '/kanban'];
const EXACT_WIDE_ROUTES = ['/projects', '/colleges', '/chat', '/explore'];

function shouldHideRightSidebar(pathname: string): boolean {
  if (EXACT_WIDE_ROUTES.includes(pathname)) return true;
  for (const prefix of WIDE_ROUTES) {
    if (pathname.startsWith(prefix) && pathname !== '/projects/create') return true;
  }
  return false;
}

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const hideRightSidebar = shouldHideRightSidebar(location.pathname);
  const isChatPage = location.pathname === '/chat';

  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-50">
      <Toast />
      <Header onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <div
        className={`mx-auto transition-all duration-300 ${
          isChatPage ? 'max-w-full px-0 sm:px-3 lg:px-5 py-2 sm:py-3 lg:py-4' : 'max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6'
        }`}
      >
        <div className={`flex flex-col lg:flex-row relative ${isChatPage ? 'gap-3 lg:gap-5' : 'gap-6'}`}>
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          <aside
            className={`fixed inset-y-0 left-0 lg:sticky lg:inset-y-auto lg:bottom-auto lg:top-6 lg:self-start w-72 flex-shrink-0 transition-all duration-300 lg:block bg-white lg:bg-transparent z-40 ${
              mobileSidebarOpen
                ? 'translate-x-0 shadow-2xl z-50'
                : '-translate-x-full lg:translate-x-0 shadow-none'
            }`}
          >
            <div className="p-4 lg:p-0 h-full overflow-y-auto overscroll-contain">
              <Sidebar />
            </div>
          </aside>

          <main
            className={`flex-1 min-w-0 bg-white overflow-hidden ${
              isChatPage
                ? 'flex flex-col min-h-0 h-[calc(100dvh-6.25rem)] sm:h-[calc(100vh-7.25rem)] lg:h-[calc(100vh-128px)] rounded-none border-0 shadow-none sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-sm pb-[calc(1rem+3.5rem+5px+env(safe-area-inset-bottom,0px))]'
                : 'rounded-2xl border border-gray-200 shadow-sm min-h-[calc(100vh-140px)]'
            }`}
          >
            <div
              className={`${isChatPage ? 'flex flex-1 min-h-0 flex-col overflow-hidden' : 'h-full'}`}
            >
              <Outlet />
            </div>
          </main>

          {!hideRightSidebar && (
            <aside className="hidden xl:block w-80 flex-shrink-0 sticky bottom-6 top-auto self-end">
              <Rightbar />
            </aside>
          )}
        </div>
      </div>

      <BottomDock />
    </div>
  );
}
