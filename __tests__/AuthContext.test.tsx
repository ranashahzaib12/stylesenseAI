/**
 * @jest-environment jsdom
 */
// FIX: Import Jest globals to fix TypeScript errors.
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { Session, User, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';

// Mock the supabase client
jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const TestComponent: React.FC = () => {
  const { user, session, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="user">{user ? user.id : 'null'}</div>
      <div data-testid="session">{session ? session.access_token : 'null'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  let onAuthStateChangeCallback: (event: string, session: Session | null) => void;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Provide a way to control the onAuthStateChange callback
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      onAuthStateChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: jest.fn() } },
      };
    });
  });

  it('should initialize with loading true and then update with session data', () => {
    const { getByText, getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByText('Loading...')).toBeInTheDocument();

    const mockSession: Session = {
      access_token: 'mock-token',
      token_type: 'bearer',
      user: { id: 'mock-user-id', app_metadata: {}, user_metadata: {}, aud: 'authenticated' },
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
    };

    act(() => {
      onAuthStateChangeCallback('SIGNED_IN', mockSession);
    });

    expect(getByTestId('user').textContent).toBe('mock-user-id');
    expect(getByTestId('session').textContent).toBe('mock-token');
  });

  it('should handle sign out correctly', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
     const mockSession: Session = {
      access_token: 'mock-token',
      token_type: 'bearer',
      user: { id: 'mock-user-id', app_metadata: {}, user_metadata: {}, aud: 'authenticated' },
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
    };
    
    // Simulate initial login
     act(() => {
      onAuthStateChangeCallback('SIGNED_IN', mockSession);
    });
    
    expect(getByTestId('user').textContent).toBe('mock-user-id');

    // Simulate logout
    act(() => {
      onAuthStateChangeCallback('SIGNED_OUT', null);
    });

    expect(getByTestId('user').textContent).toBe('null');
    expect(getByTestId('session').textContent).toBe('null');
  });
  
  it('should call supabase.auth.signInWithPassword on login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    
    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'password' });
    });
    
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password' });
  });

  it('should call supabase.auth.signUp on register', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    
    await act(async () => {
      await result.current.register({ email: 'test@test.com', password: 'password' });
    });
    
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password' });
  });
  
   it('should call supabase.auth.signOut on logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    
    await act(async () => {
      await result.current.logout();
    });
    
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});

// Helper for testing hooks
import { renderHook } from '@testing-library/react-hooks';
