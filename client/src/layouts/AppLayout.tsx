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
    <div className="app-shell relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.10),transparent_26%),linear-gradient(to_bottom,rgba(248,250,252,1),rgba(255,255,255,0.96))]" />
        <div className="absolute left-[8%] top-16 h-80 w-80 rounded-full bg-indigo-200/25 blur-3xl" />
        <div className="absolute bottom-10 right-[8%] h-96 w-96 rounded-full bg-violet-200/20 blur-3xl" />
      </div>
      <Toast />
      <Header onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <div
        className={`page-shell transition-all duration-300 ${isChatPage ? 'max-w-full px-0 sm:px-3 lg:px-5 py-2 sm:py-3 lg:py-4' : ''}`}
      >
        <div className={`flex flex-col lg:flex-row relative ${isChatPage ? 'gap-3 lg:gap-5' : 'gap-6'}`}>
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          <aside
            className={`fixed inset-y-0 left-0 lg:sticky lg:inset-y-auto lg:bottom-auto lg:top-6 lg:self-start w-72 flex-shrink-0 transition-all duration-300 lg:block bg-white/95 lg:bg-transparent backdrop-blur-md z-40 ${
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
            className={`flex-1 min-w-0 page-surface ${
              isChatPage
                ? 'flex flex-col min-h-0 h-[calc(100dvh-6.25rem)] sm:h-[calc(100vh-7.25rem)] lg:h-[calc(100vh-128px)] rounded-none border-0 shadow-none sm:rounded-3xl sm:border sm:border-slate-200/80 sm:shadow-sm pb-[calc(1rem+3.5rem+5px+env(safe-area-inset-bottom,0px))]'
                : 'min-h-[calc(100vh-140px)]'
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
