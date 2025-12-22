'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminUser } from '@/lib/auth';

export function useAdminAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/auth', {
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setError(null);
      } else {
        setUser(null);
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Authentication failed');
      setUser(null);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/login', {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setUser(null);
    router.push('/admin/login');
  };

  return {
    user,
    error,
    loading,
    logout,
    isAuthenticated: !!user
  };
}
