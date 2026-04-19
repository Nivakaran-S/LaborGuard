import { createContext, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const storeLogout = useAuthStore((s) => s.logout);
  const setAuth = useAuthStore((s) => s.setAuth);

  const setSession = ({ accessToken: token, userRole: role, profile: sessionProfile, refreshToken }) => {
    if (token && sessionProfile) {
      setAuth(sessionProfile, token, refreshToken ?? null);
    }
    if (token) localStorage.setItem('accessToken', token);
    if (role) localStorage.setItem('userRole', role);
  };

  const logout = () => {
    storeLogout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
  };

  const value = useMemo(
    () => ({
      accessToken: accessToken || '',
      userRole: user?.role || (typeof localStorage !== 'undefined' ? localStorage.getItem('userRole') : '') || '',
      profile: user,
      loading: false,
      error: '',
      isAuthenticated: Boolean(accessToken),
      setSession,
      logout,
      fetchProfile: () => {}
    }),
    [user, accessToken, storeLogout, setAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
