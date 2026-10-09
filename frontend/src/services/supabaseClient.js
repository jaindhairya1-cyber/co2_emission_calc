import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase URL and Anon Key from environment variables or localStorage configuration
const getStoredUrl = () => {
  return import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('terra_supabase_url') || '';
};

const getStoredKey = () => {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('terra_supabase_key') || '';
};

export const isSupabaseConfigured = () => {
  const url = getStoredUrl();
  const key = getStoredKey();
  return Boolean(url && key && url.startsWith('http') && !url.includes('sample-project'));
};

const url = getStoredUrl() || 'https://sample-project.supabase.co';
const key = getStoredKey() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const getSupabaseConfig = () => ({
  url: getStoredUrl(),
  isConfigured: isSupabaseConfigured()
});

/**
 * Supabase Auth Helper Methods
 */

// Sign In with Email & Password
export async function signInWithEmail(email, password) {
  if (!isSupabaseConfigured()) {
    const mockUser = {
      id: `user-${Date.now()}`,
      email,
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: email.split('@')[0] }
    };
    localStorage.setItem('terra_auth_user', JSON.stringify(mockUser));
    return {
      data: {
        user: mockUser,
        session: { access_token: `mock-token-${Date.now()}` }
      },
      error: null
    };
  }
  return await supabase.auth.signInWithPassword({ email, password });
}

// Sign Up with Email & Password
export async function signUpWithEmail(email, password, metadata = {}) {
  if (!isSupabaseConfigured()) {
    const mockUser = {
      id: `user-${Date.now()}`,
      email,
      app_metadata: { provider: 'email' },
      user_metadata: { ...metadata, full_name: metadata.full_name || email.split('@')[0] }
    };
    localStorage.setItem('terra_auth_user', JSON.stringify(mockUser));
    return {
      data: {
        user: mockUser,
        session: { access_token: `mock-token-${Date.now()}` }
      },
      error: null
    };
  }
  return await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
}

// Sign In with Phone OTP
export async function signInWithPhone(phone) {
  if (!isSupabaseConfigured()) {
    return { data: { message: 'OTP sent to mobile phone.' }, error: null };
  }
  return await supabase.auth.signInWithOtp({ phone });
}

// Verify Phone OTP
export async function verifyPhoneOtp(phone, token) {
  if (!isSupabaseConfigured()) {
    const mockUser = {
      id: `phone-user-${Date.now()}`,
      phone,
      app_metadata: { provider: 'phone' },
      user_metadata: { full_name: 'Verified MSME Representative' }
    };
    localStorage.setItem('terra_auth_user', JSON.stringify(mockUser));
    return {
      data: {
        user: mockUser,
        session: { access_token: `mock-token-${Date.now()}` }
      },
      error: null
    };
  }
  return await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
}

// Continue with Google (OAuth)
export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) {
    const mockUser = {
      id: `google-user-${Date.now()}`,
      email: 'enterprise@google-workspace.com',
      app_metadata: { provider: 'google' },
      user_metadata: { full_name: 'Verified Google MSME User' }
    };
    localStorage.setItem('terra_auth_user', JSON.stringify(mockUser));
    return {
      data: { user: mockUser },
      error: null
    };
  }
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
}

// Password recovery
export async function resetPasswordForEmail(email) {
  if (!isSupabaseConfigured()) {
    return { data: {}, error: null };
  }
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
}

// Get Current User
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    const saved = localStorage.getItem('terra_auth_user');
    return saved ? JSON.parse(saved) : null;
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Get Session
export async function getSession() {
  if (!isSupabaseConfigured()) {
    const saved = localStorage.getItem('terra_auth_user');
    return saved ? { user: JSON.parse(saved), access_token: 'local-session-token' } : null;
  }
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Auth State Change listener
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) {
    // Return no-op unsubscribe function
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange(callback);
}

// Sign Out
export async function signOut() {
  localStorage.removeItem('terra_auth_user');
  if (!isSupabaseConfigured()) {
    return { error: null };
  }
  return await supabase.auth.signOut();
}

// Save Custom Supabase Credentials from UI
export function configureSupabaseKeys(url, anonKey) {
  localStorage.setItem('terra_supabase_url', url.trim());
  localStorage.setItem('terra_supabase_key', anonKey.trim());
  window.location.reload();
}
