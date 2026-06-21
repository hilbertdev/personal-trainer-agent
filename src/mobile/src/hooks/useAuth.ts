import { useCallback, useEffect, useState } from 'react';
import { clearAuthSession, getAuthToken } from '@/src/lib/secureStore';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getAuthToken();
    setIsAuthenticated(Boolean(token));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await clearAuthSession();
    setIsAuthenticated(false);
  }, []);

  return { isLoading, isAuthenticated, refresh, signOut };
}
