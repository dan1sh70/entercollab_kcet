import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

import AppLayout from './layouts/AppLayout';
import GuestLayout from './layouts/GuestLayout';

const Welcome = lazy(() => import('./pages/Welcome'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const RegisterInstitution = lazy(() => import('./pages/auth/RegisterInstitution'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const ProjectsIndex = lazy(() => import('./pages/projects/ProjectsIndex'));
const ProjectCreate = lazy(() => import('./pages/projects/ProjectCreate'));
const ProjectShow = lazy(() => import('./pages/projects/ProjectShow'));
const ProjectEdit = lazy(() => import('./pages/projects/ProjectEdit'));
const Kanban = lazy(() => import('./pages/projects/Kanban'));
const MyProjects = lazy(() => import('./pages/projects/MyProjects'));

const Chat = lazy(() => import('./pages/chat/Chat'));
const Feed = lazy(() => import('./pages/feed/Feed'));
const Explore = lazy(() => import('./pages/explore/Explore'));

function SearchRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/explore${search}`} replace />;
}
const CollegesIndex = lazy(() => import('./pages/colleges/CollegesIndex'));
const CollegeShow = lazy(() => import('./pages/colleges/CollegeShow'));

const EventsIndex = lazy(() => import('./pages/events/EventsIndex'));
const EventCreate = lazy(() => import('./pages/events/EventCreate'));
const EventShow = lazy(() => import('./pages/events/EventShow'));
const EventEdit = lazy(() => import('./pages/events/EventEdit'));

const ResearchIndex = lazy(() => import('./pages/research/ResearchIndex'));
const ResearchCreate = lazy(() => import('./pages/research/ResearchCreate'));
const ResearchShow = lazy(() => import('./pages/research/ResearchShow'));
const ResearchEdit = lazy(() => import('./pages/research/ResearchEdit'));

const ProfileEdit = lazy(() => import('./pages/profile/ProfileEdit'));
const ProfileShow = lazy(() => import('./pages/profile/ProfileShow'));
const FollowersList = lazy(() => import('./pages/profile/FollowersList'));
const FollowingList = lazy(() => import('./pages/profile/FollowingList'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects'));

const InstitutionDashboard = lazy(() => import('./pages/institution/InstitutionDashboard'));
const InstitutionEvents = lazy(() => import('./pages/institution/InstitutionEvents'));
const Notifications = lazy(() => import('./pages/notifications/Notifications'));

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-gray-400">Loading...</div></div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<Welcome />} />

        <Route element={<GuestRoute><GuestLayout /></GuestRoute>}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/institution" element={<RegisterInstitution />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectsIndex />} />
          <Route path="/projects/mine" element={<MyProjects />} />
          <Route path="/projects/user/:id" element={<MyProjects />} />
          <Route path="/projects/create" element={<ProjectCreate />} />
          <Route path="/projects/:id" element={<ProjectShow />} />
          <Route path="/projects/:id/edit" element={<ProjectEdit />} />
          <Route path="/projects/:id/board" element={<Kanban />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/search" element={<SearchRedirect />} />
          <Route path="/colleges" element={<CollegesIndex />} />
          <Route path="/colleges/:slug" element={<CollegeShow />} />
          <Route path="/events" element={<EventsIndex />} />
          <Route path="/events/create" element={<EventCreate />} />
          <Route path="/events/:id" element={<EventShow />} />
          <Route path="/events/:id/edit" element={<EventEdit />} />
          <Route path="/research" element={<ResearchIndex />} />
          <Route path="/research/create" element={<ResearchCreate />} />
          <Route path="/research/:id" element={<ResearchShow />} />
          <Route path="/research/:id/edit" element={<ResearchEdit />} />
          <Route path="/profile/followers" element={<FollowersList />} />
          <Route path="/profile/following" element={<FollowingList />} />
          <Route path="/profile/:id/followers" element={<FollowersList />} />
          <Route path="/profile/:id/following" element={<FollowingList />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/profile" element={<ProfileShow />} />
          <Route path="/profile/:id" element={<ProfileShow />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/institution" element={<InstitutionDashboard />} />
          <Route path="/institution/events" element={<InstitutionEvents />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
