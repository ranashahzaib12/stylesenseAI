import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../Spinner';

const friendlyLoginError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Incorrect email or password. Please check your details and try again.';
  if (m.includes('email not confirmed') || m.includes('not confirmed'))
    return 'Your email address has not been confirmed yet. Please check your inbox and click the verification link we sent you.';
  if (m.includes('user not found') || m.includes('no user found'))
    return 'No account found with this email. Please sign up first.';
  if (m.includes('too many') || m.includes('rate limit'))
    return 'Too many login attempts. Please wait a few minutes and try again.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Connection error. Please check your internet connection and try again.';
  return message;
};

const GoogleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 flex-shrink-0">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
  </svg>
);

const LoginForm: React.FC<{ onSwitchToRegister: () => void }> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [showForgotPanel, setShowForgotPanel] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { login, loginWithGoogle, resetPassword } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    const { error } = await login({ email, password });
    if (error) setError(friendlyLoginError(error.message));
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await loginWithGoogle();
    if (error) {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
    // On success, Supabase redirects — no need to reset loading
  };

  const openForgotPanel = () => {
    setResetEmail(email); // pre-fill with whatever they typed
    setResetError(null);
    setResetSuccess(false);
    setShowForgotPanel(true);
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError('Please enter your email address.');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    const { error } = await resetPassword(resetEmail);
    if (error) {
      setResetError('Could not send reset email. Please check the address and try again.');
    } else {
      setResetSuccess(true);
    }
    setResetLoading(false);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-center text-textPrimary">Welcome Back</h2>

      {error && (
        <div className="bg-error/10 border border-error text-error text-sm rounded-lg p-3 text-center">
          {error}
        </div>
      )}

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-surface border border-textSecondary/20 rounded-lg text-sm font-medium text-textPrimary hover:bg-textSecondary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {googleLoading ? <Spinner /> : <GoogleIcon />}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-textSecondary/15" />
        <span className="text-xs text-textSecondary">or</span>
        <div className="flex-1 h-px bg-textSecondary/15" />
      </div>

      {/* Sign in form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-textPrimary">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full bg-background border border-textSecondary/20 rounded-lg shadow-sm py-2.5 px-3 text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label htmlFor="password" className="text-sm font-medium text-textPrimary">Password</label>
            <button
              type="button"
              onClick={openForgotPanel}
              className="text-xs text-primary hover:underline focus:outline-none"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-textSecondary/20 rounded-lg shadow-sm py-2.5 pl-3 pr-10 text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-textSecondary hover:text-textPrimary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Forgot password inline panel */}
        {showForgotPanel && (
          <div className="bg-background border border-textSecondary/15 rounded-lg p-4 space-y-3 animate-fade-in">
            <p className="text-sm font-medium text-textPrimary">Reset your password</p>
            {resetSuccess ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-success text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Check your email for a reset link.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPanel(false)}
                  className="text-xs text-primary hover:underline"
                >
                  ← Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-2">
                {resetError && (
                  <p className="text-xs text-error">{resetError}</p>
                )}
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-surface border border-textSecondary/20 rounded-lg py-2 px-3 text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  placeholder="your@email.com"
                  required
                />
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPanel(false)}
                    className="text-xs text-textSecondary hover:text-textPrimary"
                  >
                    ← Back to sign in
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resetLoading ? <Spinner /> : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Spinner /> : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-textSecondary">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToRegister} className="font-medium text-primary hover:underline">
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
