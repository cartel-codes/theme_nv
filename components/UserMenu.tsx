'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface UserSession {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check user session on mount and on auth changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Re-check auth when login/logout/signup happens
    const handleAuthChange = () => checkAuth();
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/user/logout', {
        method: 'POST',
      });
      setUser(null);
      setIsOpen(false);
      window.dispatchEvent(new Event('auth-change'));
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden sm:block hover:text-novraux-terracotta transition-colors"
        aria-label="User menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-novraux-beige rounded-lg shadow-lg py-2 z-50">
          {isLoading ? (
            <div className="px-4 py-3 text-center text-sm text-novraux-charcoal/60">
              Loading...
            </div>
          ) : user ? (
            <>
              {/* User Info */}
              <div className="px-4 py-3 border-b border-novraux-beige">
                <p className="text-sm font-medium text-novraux-charcoal">
                  {user.firstName || (user.email ? user.email.split('@')[0] : 'User')}
                </p>
                <p className="text-xs text-novraux-charcoal/60">{user.email || 'No email'}</p>
              </div>

              {/* Menu Items */}
              <Link
                href="/account"
                className="block px-4 py-2 text-sm text-novraux-charcoal hover:bg-novraux-cream/50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                My Account
              </Link>
              <Link
                href="/account/orders"
                className="block px-4 py-2 text-sm text-novraux-charcoal hover:bg-novraux-cream/50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Order History
              </Link>
              <Link
                href="/account"
                className="block px-4 py-2 text-sm text-novraux-charcoal hover:bg-novraux-cream/50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Settings
              </Link>

              {/* Logout */}
              <div className="border-t border-novraux-beige">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-novraux-terracotta hover:bg-novraux-cream/50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Not Logged In */}
              <Link
                href="/auth/login"
                className="block px-4 py-2 text-sm text-novraux-charcoal hover:bg-novraux-cream/50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="block px-4 py-2 text-sm text-novraux-charcoal hover:bg-novraux-cream/50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Create Account
              </Link>
              <div className="border-t border-novraux-beige px-4 py-2 text-xs text-novraux-charcoal/60">
                New customer? Create an account to get started.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
