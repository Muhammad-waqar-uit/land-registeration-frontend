import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearAuth } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];
}

export default function DashboardLayout({ children, navItems = [] }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Clear auth state immediately for instant logout
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    dispatch(clearAuth()); // Clear Redux state immediately
    
    // Navigate to home page immediately
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 0);
    
    // Call API in background (non-blocking) to invalidate refresh token on server
    try {
      await authAPI.logout(refreshToken || undefined);
    } catch (error) {
      // Ignore errors - tokens already cleared locally
      console.warn('Logout API call failed, but tokens cleared locally');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">

      {/* Navbar */}
      <div className="navbar bg-primary text-primary-content shadow-lg h-16 min-h-16 px-4 flex-shrink-0 items-center">
        {/* Mobile Toggle */}
        <div className="flex-none lg:hidden">
          <button
            className="btn btn-square btn-ghost text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Logo/Brand */}
        <div className="flex-1">
          <Link to="/" className="text-xl font-bold text-white hover:text-white/80">
            Land Registry
          </Link>
        </div>

        {/* Right Side Icons - Aligned in Row */}
        <div className="flex-none flex items-center gap-3">
          {/* Wallet Address Display */}
          {user?.walletAddress && (
            <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-white text-sm font-mono">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </span>
            </div>
          )}

          {/* User Menu */}
          <div className="dropdown dropdown-end">
  <button
    tabIndex={0}
    className="btn btn-ghost btn-circle p-0 hover:bg-primary-focus h-10 w-10 min-h-10"
  >
    <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center font-semibold text-base">
      {user?.name?.charAt(0).toUpperCase() || "U"}
    </div>
  </button>

      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content mt-3 z-[50] p-2 shadow bg-base-100 rounded-box w-52"
      >
    <li className="menu-title">
      <span className="text-xs">{user?.name}</span>
      {user?.walletAddress && (
        <span className="text-xs font-mono text-base-content/60">
          {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
        </span>
      )}
    </li>
    <li>
          <Link to="/profile" className="text-base-content flex justify-between">
            Profile
            <UserIcon className="h-4 w-4" />
          </Link>
        </li>
        <li>
          <a 
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            className="text-base-content flex justify-between cursor-pointer"
          >
            Logout
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
          </a>
        </li>
      </ul>
    </div>

        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static left-0 z-30 w-64 bg-base-100 shadow-lg transition-transform duration-300 ease-in-out lg:transition-none flex flex-col`}
          style={{ 
            top: '64px',
            height: 'calc(100vh - 64px)'
          }}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-base-300 flex-shrink-0">
              <h2 className="text-xl font-bold text-base-content">Dashboard</h2>
              <p className="text-sm text-base-content/70 capitalize">{user?.role}</p>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-content'
                        : 'text-base-content hover:bg-base-200'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isActive ? 'text-primary-content' : 'text-base-content'
                      }`}
                    />
                    <span className={isActive ? 'text-primary-content' : 'text-base-content'}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
