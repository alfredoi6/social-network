import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthState, LoginDto, RegisterDto, AuthResponse, User } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
      isAuthenticated: !!token,
      user,
      token
    };
  });

  const updateAuthState = (response: AuthResponse | null) => {
    if (response) {
      const { token, userId, username, email } = response;
      const user: User = { userId, username, email };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuth({
        isAuthenticated: true,
        user,
        token
      });
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuth({
        isAuthenticated: false,
        user: null,
        token: null
      });
    }
  };

  const login = async (credentials: LoginDto) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);
      if (data.success) {
        updateAuthState(data);
        navigate('/');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      updateAuthState(null);
      throw error;
    }
  };

  const register = async (registerData: RegisterDto) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', registerData);
      if (data.success) {
        updateAuthState(data);
        navigate('/');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      updateAuthState(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      updateAuthState(null);
      navigate('/login');
    }
  };

  // Check token validity on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token by making a request to a protected endpoint
      api.get('/user/profile')
        .catch(() => {
          updateAuthState(null);
          navigate('/login');
        });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ ...auth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
