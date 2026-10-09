import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Zap, ArrowRight, Lock, Mail, Phone, Key, AlertCircle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithPhone,
  verifyPhoneOtp,
  signInWithGoogle,
  resetPasswordForEmail,
  isSupabaseConfigured,
  configureSupabaseKeys
} from '../services/supabaseClient';

export default function Screen02Auth() {
  const { navigateTo, tempId, setTempId, setAuthUser, updateBusiness } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [authType, setAuthType] = useState('email'); // 'email' | 'phone'

  // Clean inputs - NO hardcoded fake profiles
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);


  const handleEmailAuth = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter your email and password.');
      return;
    }
    setAuthError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const metadata = {
          full_name: fullName.trim() || email.split('@')[0],
          temp_id: tempId
        };
        const { data, error } = await signUpWithEmail(email, password, metadata);
        if (error) throw error;
        if (data?.user) {
          setAuthUser(data.user);
          updateBusiness({ email, ownerName: metadata.full_name });
        }
        setAuthSuccess('Account created successfully! Proceeding...');
        setTimeout(() => navigateTo(3), 600);
      } else {
        const { data, error } = await signInWithEmail(email, password);
        if (error) throw error;
        if (data?.user) {
          setAuthUser(data.user);
          updateBusiness({ email, ownerName: data.user.user_metadata?.full_name || '' });
        }
        setAuthSuccess('Signed in successfully! Proceeding...');
        setTimeout(() => navigateTo(3), 600);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e) => {
    e?.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      if (!otpSent) {
        if (!phone) throw new Error('Please enter your phone number.');
        const { error } = await signInWithPhone(phone);
        if (error) throw error;
        setOtpSent(true);
        setAuthSuccess('Verification code sent to your phone.');
      } else {
        if (!otpToken) throw new Error('Please enter the 6-digit verification code.');
        const { data, error } = await verifyPhoneOtp(phone, otpToken);
        if (error) throw error;
        if (data?.user) {
          setAuthUser(data.user);
          updateBusiness({ phone });
        }
        setAuthSuccess('Phone verified! Proceeding...');
        setTimeout(() => navigateTo(3), 600);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const { data, error } = await signInWithGoogle();
      if (error) {
        if (error.message?.toLowerCase().includes('provider') || error.message?.toLowerCase().includes('not enabled')) {
          setAuthError(
            'Google OAuth Provider needs to be enabled in your Supabase Dashboard: Authentication -> Providers -> Google. Please configure Google Client ID or use Email/Guest login.'
          );
          return;
        }
        throw error;
      }
      if (data?.user) {
        setAuthUser(data.user);
        updateBusiness({
          email: data.user.email,
          ownerName: data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
        });
        setAuthSuccess('Signed in with Google! Redirecting...');
        setTimeout(() => navigateTo(3), 600);
      }
    } catch (err) {
      setAuthError(err.message || 'Google sign-in encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Please enter your email above to receive a password reset link.');
      return;
    }
    try {
      await resetPasswordForEmail(email);
      setAuthSuccess(`Password reset email sent to ${email}.`);
    } catch (err) {
      setAuthError(err.message || 'Unable to send reset email.');
    }
  };

  const handleUseTempId = () => {
    // Instant frictionless guest access with Temporary Session ID
    navigateTo(3);
  };

  return (
    <div className="screen-container auth-screen">
      <div className="auth-header">
        <div className="auth-logo-badge">
          <img src="/logo.png" alt="TerraAI Logo" className="auth-logo-img" />
        </div>
        <h1 className="auth-title">{isSignUp ? 'Create account' : 'Welcome back'}</h1>
        <p className="auth-subtitle">
          {isSignUp ? 'Sign up to start carbon tracking' : 'Sign in to access your business carbon records'}
        </p>
      </div>

      {/* Mode toggle: Email vs Phone */}
      <div className="auth-toggle-pill">
        <button
          type="button"
          className={`toggle-tab ${authType === 'email' ? 'active' : ''}`}
          onClick={() => { setAuthType('email'); setAuthError(null); }}
        >
          Email
        </button>
        <button
          type="button"
          className={`toggle-tab ${authType === 'phone' ? 'active' : ''}`}
          onClick={() => { setAuthType('phone'); setAuthError(null); }}
        >
          Phone
        </button>
      </div>

      {authError && (
        <div className="auth-alert alert-error">
          <AlertCircle size={15} />
          <span>{authError}</span>
        </div>
      )}

      {authSuccess && (
        <div className="auth-alert alert-success">
          <CheckCircle size={15} />
          <span>{authSuccess}</span>
        </div>
      )}

      {/* Email Form */}
      {authType === 'email' ? (
        <form onSubmit={handleEmailAuth} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Full name / Representative</label>
              <input
                id="auth-name"
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Authorized Signatory"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <div className="input-with-icon">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? 'Create a secure password' : 'Enter your password'}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isSignUp && (
            <div className="auth-forgot-row">
              <button
                type="button"
                className="btn-link-forgot"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            id="btn-auth-signin"
            className="btn-primary-pill"
            disabled={loading}
          >
            {loading ? 'Authenticating with Supabase...' : isSignUp ? 'Create Account' : 'Sign in'}
          </button>
        </form>
      ) : (
        /* Phone Form */
        <form onSubmit={handlePhoneAuth} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="auth-phone">Mobile Phone Number</label>
            <input
              id="auth-phone"
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              disabled={otpSent}
              required
            />
          </div>

          {otpSent && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-otp">6-Digit SMS Code</label>
              <input
                id="auth-otp"
                type="text"
                maxLength="6"
                className="form-input"
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value)}
                placeholder="123456"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-primary-pill"
            disabled={loading}
          >
            {loading ? 'Verifying...' : otpSent ? 'Verify Code & Sign In' : 'Send Verification Code'}
          </button>
        </form>
      )}

      <div className="auth-divider">
        <span className="divider-line"></span>
        <span className="divider-text">or</span>
        <span className="divider-line"></span>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        className="btn-google-auth"
        onClick={handleGoogleAuth}
        disabled={loading}
      >
        <svg className="google-icon" width="18" height="18" viewBox="0 0 18 18">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Temporary Guest ID Option */}
      <div className="temp-id-access-card">
        <div className="temp-id-info">
          <div className="temp-chip">
            <Zap size={14} className="text-emerald" />
            <span>Temporary MSME Access</span>
          </div>
          <div className="temp-id-code">ID: {tempId}</div>
        </div>
        <button
          type="button"
          id="btn-use-temp-id"
          className="btn-temp-access"
          onClick={handleUseTempId}
        >
          <span>Use Temporary ID</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="auth-footer">
        <p className="auth-footer-text">
          {isSignUp ? 'Already registered? ' : "Don't have an account? "}
          <button
            type="button"
            className="auth-link-bold"
            onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
          >
            {isSignUp ? 'Sign in' : 'Create account'}
          </button>
        </p>
      </div>

    </div>
  );
}
