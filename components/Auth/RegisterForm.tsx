import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../Spinner';

const friendlyRegisterError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists') || m.includes('duplicate'))
    return 'An account with this email already exists. Please sign in instead.';
  if (m.includes('invalid email') || m.includes('unable to validate email') || m.includes('invalid format'))
    return 'Please enter a valid email address.';
  if (m.includes('password') && (m.includes('6') || m.includes('characters')))
    return 'Password must be at least 8 characters long.';
  if (m.includes('signup') && m.includes('disabled'))
    return 'New registrations are temporarily disabled. Please try again later.';
  if (m.includes('rate limit') || m.includes('too many') || m.includes('over_email'))
    return 'Email sending limit reached. To fix this: go to your Supabase Dashboard → Authentication → Providers → Email → turn OFF "Confirm email". Then try again.';
  return message;
};

type StrengthLevel = 'empty' | 'weak' | 'fair' | 'strong' | 'very-strong';

const getPasswordStrength = (pw: string): StrengthLevel => {
  if (!pw) return 'empty';
  if (pw.length < 8) return 'weak';
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  if (pw.length >= 10 && hasUpper && hasNumber && hasSpecial) return 'very-strong';
  if (pw.length >= 8 && hasUpper && hasNumber) return 'strong';
  return 'fair';
};

const strengthConfig: Record<StrengthLevel, { label: string; filled: number; color: string }> = {
  empty:       { label: '',           filled: 0, color: 'bg-textSecondary/20' },
  weak:        { label: 'Weak',       filled: 1, color: 'bg-error' },
  fair:        { label: 'Fair',       filled: 2, color: 'bg-warning' },
  strong:      { label: 'Strong',     filled: 3, color: 'bg-success/70' },
  'very-strong': { label: 'Very Strong', filled: 4, color: 'bg-success' },
};

const GoogleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 flex-shrink-0">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
  </svg>
);

const PasswordToggleIcon: React.FC<{ visible: boolean }> = ({ visible }) =>
  visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

const RegisterForm: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { register, loginWithGoogle } = useAuth();

  const strength = getPasswordStrength(password);
  const { label: strengthLabel, filled: strengthFilled, color: strengthColor } = strengthConfig[strength];

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await loginWithGoogle();
    if (error) {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = displayName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      setError('Display name must be between 2 and 30 characters.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    const { data, error: regError } = await register({ email, password, displayName: trimmedName });

    if (regError) {
      setError(friendlyRegisterError(regError.message));
    } else if (data?.user) {
      setRegistrationSuccess(true);
    } else {
      setError('This email may already be registered. Please try signing in, or check your inbox for a confirmation email.');
    }
    setLoading(false);
  };

  if (registrationSuccess) {
    return (
      <div className="text-center space-y-4 animate-fade-in">
        <svg className="mx-auto h-12 w-12 text-success" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-textPrimary">Account Created!</h2>
        <p className="text-sm text-textSecondary">
          Welcome, <span className="font-medium text-textPrimary">{displayName}</span>!{' '}
          Your account for <span className="font-medium text-textPrimary">{email}</span> is ready.
        </p>
        <button onClick={onSwitchToLogin} className="font-medium text-primary hover:underline">
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-center text-textPrimary">Create an Account</h2>

      {error && (
        <div className="bg-error/10 border border-error text-error text-sm rounded-lg p-3 text-center">
          {error}
        </div>
      )}

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
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

      <form onSubmit={handleRegister} className="space-y-4">
        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="text-sm font-medium text-textPrimary">Display Name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full bg-background border border-textSecondary/20 rounded-lg shadow-sm py-2.5 px-3 text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            placeholder="Your name (2–30 characters)"
            maxLength={30}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email-reg" className="text-sm font-medium text-textPrimary">Email</label>
          <input
            id="email-reg"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full bg-background border border-textSecondary/20 rounded-lg shadow-sm py-2.5 px-3 text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            placeholder="your@email.com"
            required
          />
        </div>

        {/* Password + strength meter */}
        <div>
          <label htmlFor="password-reg" className="text-sm font-medium text-textPrimary">Password</label>
          <div className="relative mt-1">
            <input
              id="password-reg"
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
              <PasswordToggleIcon visible={showPassword} />
            </button>
          </div>
          {/* Strength meter */}
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${seg <= strengthFilled ? strengthColor : 'bg-textSecondary/15'}`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${strengthColor.replace('bg-', 'text-').replace('/70', '')}`}>
                {strengthLabel}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirm-pw" className="text-sm font-medium text-textPrimary">Confirm Password</label>
          <div className="relative mt-1">
            <input
              id="confirm-pw"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full bg-background border rounded-lg shadow-sm py-2.5 pl-3 pr-10 text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                confirmPassword && confirmPassword !== password
                  ? 'border-error focus:border-error focus:ring-error'
                  : 'border-textSecondary/20 focus:border-primary'
              }`}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-textSecondary hover:text-textPrimary transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              <PasswordToggleIcon visible={showConfirm} />
            </button>
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="mt-1 text-xs text-error">Passwords do not match.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Spinner /> : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-textSecondary">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-medium text-primary hover:underline">
          Sign In
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;
