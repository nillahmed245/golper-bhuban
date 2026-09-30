import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, User, LogOut, PlusSquare, Shield, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user, profile, isAdmin, login, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-serif">
              গল্পের ভুবন
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">হোম</Link>
            <Link to="/categories" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">বিভাগ</Link>
            {user && profile?.status !== 'suspended' && (
              <Link to="/write" className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                <PlusSquare size={18} />
                <span>গল্প লিখুন</span>
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <Search size={20} />
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <NotificationDropdown />
                {isAdmin && (
                  <Link to="/admin" className="hidden sm:flex p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full transition-colors" title="Admin Panel">
                    <Shield size={20} />
                  </Link>
                )}
                <Link to="/profile" className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-300">
                    {profile?.displayName || 'ব্যবহারকারী'}
                  </span>
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-200">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-700">
                        <User size={16} className="text-slate-500" />
                      </div>
                    )}
                  </div>
                </Link>
                <button 
                  onClick={logout}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-full hover:bg-slate-800 dark:hover:bg-white transition-colors"
              >
                লগইন
              </button>
            )}

            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shadow-xl animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearch} className="container mx-auto flex items-center gap-2">
            <input 
              type="text" 
              placeholder="গল্পের নাম, লেখক বা বিভাগ খুঁজুন..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-400 outline-none"
              autoFocus
            />
            <button 
              type="submit"
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-lg font-medium"
            >
              খুঁজুন
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out",
        isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      )}>
        <nav className="flex flex-col p-4 gap-2">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">হোম</Link>
          <Link to="/categories" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">বিভাগ</Link>
          {user && (
            <>
              {profile?.status !== 'suspended' && (
                <Link to="/write" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 font-medium">গল্প লিখুন</Link>
              )}
              {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 font-medium">অ্যাডমিন প্যানেল</Link>}
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">প্রোফাইল</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
