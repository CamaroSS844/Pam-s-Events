/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import { AuthPages } from './features/auth/AuthPages';
import { ClientDashboard } from './features/dashboard/ClientDashboard';
import { EventWizard } from './features/wizard/EventWizard';
import { EventDashboard } from './features/dashboard/EventDashboard';
import { AdminDashboard } from './features/dashboard/AdminDashboard';
import { EventWebsite } from './features/invitation/EventWebsite';
import { Toast, ToastType } from './components/Toast';
import { User } from './types';

const readStoredUser = (): User | null => {
  const storedUser = localStorage.getItem('wokemedia_logged_in_user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem('wokemedia_logged_in_user');
    return null;
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredUser());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('wokemedia_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return 'light';
  });
  const [toastText, setToastText] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('wokemedia_theme', theme);
  }, [theme]);

  const triggerToast = (text: string, type: ToastType = 'info') => {
    setToastText(text);
    setToastType(type);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-between selection:bg-stone-900 selection:text-white antialiased text-slate-900 dark:text-stone-100 transition-colors duration-200">
      <AppRoutes
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        theme={theme}
        setTheme={setTheme}
        triggerToast={triggerToast}
      />

      <Toast
        text={toastText}
        type={toastType}
        onClose={() => setToastText('')}
      />
    </div>
  );
}

type AppRoutesProps = {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  triggerToast: (text: string, type?: ToastType) => void;
};

interface DashboardShellProps {
  children: React.ReactNode;
  currentUser: User | null;
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  onLogout: () => void;
  onNavigateHome: () => void;
}

const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  currentUser,
  theme,
  setTheme,
  onLogout,
  onNavigateHome,
}) => (
  <>
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border-b border-slate-200 dark:border-stone-800 py-4 px-6 flex items-center justify-between shadow-sm transition-colors duration-200">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={onNavigateHome}
      >
        <img
          src="/logo.jpg"
          alt="Pam's Events Logo"
          className="w-10 h-10 object-contain"
          referrerPolicy="no-referrer"
        />
        <div className="text-left">
          <span className="font-serif font-bold tracking-wider text-slate-900 dark:text-stone-100 text-sm block">PAM'S EVENTS</span>
          <span className="text-[9px] font-sans font-semibold tracking-widest text-amber-600 dark:text-amber-500 uppercase block -mt-0.5">Event Studio</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-all focus:outline-none flex items-center justify-center border border-transparent dark:border-stone-800 shadow-sm"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-zinc-500 hover:text-zinc-900 dark:text-stone-400 dark:hover:text-stone-100 font-bold underline underline-offset-4"
          >
            Dashboard
          </button>

          {currentUser && (
            <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-stone-800 pl-3">
              <span className="text-zinc-400 dark:text-stone-500 hidden sm:inline">Signed in as:</span>
              <span className="bg-stone-100 dark:bg-stone-850 py-1 px-2.5 rounded-lg text-zinc-700 dark:text-stone-300 font-mono font-bold text-[10px] border border-transparent dark:border-stone-800">{currentUser.email}</span>
              <button
                type="button"
                onClick={onLogout}
                className="text-zinc-400 hover:text-zinc-850 dark:text-stone-400 dark:hover:text-stone-200 p-1"
                title="Log Out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    <main className="flex-1 w-full bg-stone-50 dark:bg-stone-950 transition-colors duration-200">
      {children}
    </main>
  </>
);

const EventDashboardRouteWrapper = ({
  currentUser,
  theme,
  setTheme,
  onLogout,
  onNavigateHome,
  triggerToast,
}: {
  currentUser: User | null;
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  onLogout: () => void;
  onNavigateHome: () => void;
  triggerToast: (text: string, type?: ToastType) => void;
}) => {
  const navigate = useNavigate();
  const { eventId = '' } = useParams();

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardShell
      currentUser={currentUser}
      theme={theme}
      setTheme={setTheme}
      onLogout={onLogout}
      onNavigateHome={onNavigateHome}
    >
      <EventDashboard
        eventId={eventId}
        onBackToDashboard={() => navigate('/client-dashboard')}
        onPreviewEvent={(id, token) => {
          const search = token ? `?guest=${encodeURIComponent(token)}` : '';
          navigate(`/${id}${search}`);
        }}
        toast={triggerToast}
      />
    </DashboardShell>
  );
};

const PublicEventRouteWrapper = () => {
  const { eventId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const guestToken = searchParams.get('guest');

  return (
    <div className="relative">
      <EventWebsite eventId={eventId} guestToken={guestToken} />
    </div>
  );
};

function AppRoutes({
  currentUser,
  setCurrentUser,
  theme,
  setTheme,
  triggerToast,
}: AppRoutesProps) {
  const navigate = useNavigate();
  const homePath = currentUser?.role === 'admin' ? '/admin-dashboard' : '/client-dashboard';

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('wokemedia_logged_in_user', JSON.stringify(user));
    triggerToast(`Welcome back, ${user.email}!`, 'success');
    navigate(user.role === 'admin' ? '/admin-dashboard' : '/client-dashboard', { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('wokemedia_logged_in_user');
    setCurrentUser(null);
    triggerToast('Logged out of SaaS console successfully.', 'info');
    navigate('/auth', { replace: true });
  };

  const handleNavigateHome = () => navigate(homePath);

  return (
    <Routes>
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate to={homePath} replace />
          ) : (
            <AuthPages onAuthSuccess={handleAuthSuccess} toast={triggerToast} />
          )
        }
      />
      <Route
        path="/auth"
        element={
          currentUser ? (
            <Navigate to={homePath} replace />
          ) : (
            <AuthPages onAuthSuccess={handleAuthSuccess} toast={triggerToast} />
          )
        }
      />
      <Route
        path="/client-dashboard"
        element={
          !currentUser ? (
            <Navigate to="/auth" replace />
          ) : (
            <DashboardShell
              currentUser={currentUser}
              theme={theme}
              setTheme={setTheme}
              onLogout={handleLogout}
              onNavigateHome={handleNavigateHome}
            >
              <ClientDashboard
                onSelectEvent={(eventId) => navigate(`/event-dashboard/${eventId}`)}
                onLaunchWizard={() => navigate('/event-wizard')}
                onGoToAdmin={currentUser.role === 'admin' ? () => navigate('/admin-dashboard') : undefined}
                toast={triggerToast}
              />
            </DashboardShell>
          )
        }
      />
      <Route
        path="/event-wizard"
        element={
          !currentUser ? (
            <Navigate to="/auth" replace />
          ) : (
            <DashboardShell
              currentUser={currentUser}
              theme={theme}
              setTheme={setTheme}
              onLogout={handleLogout}
              onNavigateHome={handleNavigateHome}
            >
              <EventWizard
                onComplete={(newEventId) => {
                  navigate(`/event-dashboard/${newEventId}`, { replace: true });
                  triggerToast('New event website created successfully!', 'success');
                }}
                onCancel={() => navigate('/client-dashboard')}
                toast={triggerToast}
              />
            </DashboardShell>
          )
        }
      />
      <Route
        path="/event-dashboard/:eventId"
        element={
          <EventDashboardRouteWrapper
            currentUser={currentUser}
            theme={theme}
            setTheme={setTheme}
            onLogout={handleLogout}
            onNavigateHome={handleNavigateHome}
            triggerToast={triggerToast}
          />
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          !currentUser ? (
            <Navigate to="/auth" replace />
          ) : currentUser.role !== 'admin' ? (
            <Navigate to="/client-dashboard" replace />
          ) : (
            <DashboardShell
              currentUser={currentUser}
              theme={theme}
              setTheme={setTheme}
              onLogout={handleLogout}
              onNavigateHome={handleNavigateHome}
            >
              <AdminDashboard
                onBackToDashboard={() => navigate('/client-dashboard')}
                onPreviewEvent={(eventId) => navigate(`/${eventId}`)}
                toast={triggerToast}
              />
            </DashboardShell>
          )
        }
      />
      <Route path="/:eventId" element={<PublicEventRouteWrapper />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
