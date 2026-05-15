import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Eye, EyeOff, Store, Phone, Mail } from 'lucide-react';

type Mode = 'login' | 'signup';
type AuthMethod = 'email' | 'phone';
type SignupStage = 'method' | 'details' | 'otp';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [signupStage, setSignupStage] = useState<SignupStage>('method');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const formatPhone = (phone: string) => {
    // Remove non-digits and format as +234...
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      return '+234' + digits.slice(1);
    }
    if (digits.startsWith('234')) {
      return '+' + digits;
    }
    return '+234' + digits;
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setError(err.message);
    } else if (data.user) {
      const { error: pErr } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        phone: phone || null,
        is_buyer: role === 'buyer',
        is_seller: role === 'seller',
        active_role: role,
        subscription_active: false,
      });
      if (pErr) setError(pErr.message);
      else setSignupStage('otp');
    }
    setLoading(false);
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setLoading(true);
    const formattedPhone = formatPhone(phone);
    const { data, error: err } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    if (err) {
      setError(err.message);
    } else {
      setSessionId(data?.session?.id || '');
      setSignupStage('otp');
    }
    setLoading(false);
  };

  const handlePhoneOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }

    setLoading(true);
    const formattedPhone = formatPhone(phone);
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });

    if (err) {
      setError(err.message);
    } else if (data.user) {
      const { error: pErr } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        phone: formattedPhone,
        is_buyer: role === 'buyer',
        is_seller: role === 'seller',
        active_role: role,
        subscription_active: false,
      });
      if (pErr) setError(pErr.message);
    }
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    const formattedPhone = formatPhone(phone);
    const { data, error: err } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    if (err) {
      setError(err.message);
    } else {
      setSessionId(data?.session?.id || '');
      setSignupStage('otp');
    }
    setLoading(false);
  };

  const handlePhoneLoginOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }

    setLoading(true);
    const formattedPhone = formatPhone(phone);
    const { error: err } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-white text-blue-600 p-2.5 rounded-lg shadow-lg">
          <Store size={32} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Kaduna Mart</h1>
          <p className="text-blue-100 text-sm font-medium">Buy & Sell Locally</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Tab toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError('');
                setSignupStage(m === 'signup' ? 'method' : 'method');
                setOtp('');
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Auth Method Selection (Signup Only) */}
        {mode === 'signup' && signupStage === 'method' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-semibold mb-4">How would you like to sign up?</p>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setSignupStage('details');
              }}
              className="w-full border-2 border-blue-600 bg-blue-50 text-blue-700 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition"
            >
              <Mail size={20} />
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone');
                setSignupStage('details');
              }}
              className="w-full border-2 border-gray-300 bg-white text-gray-700 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
            >
              <Phone size={20} />
              Phone Number (OTP)
            </button>
          </div>
        )}

        {/* Email Signup Form */}
        {mode === 'signup' && signupStage === 'details' && authMethod === 'email' && (
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Your full name"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    role === 'buyer'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <ShoppingBag size={20} />
                  Buy Items
                </button>
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    role === 'seller'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Store size={20} />
                  Sell Items
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs rounded-lg p-3 border border-red-200">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-60 text-sm shadow-md"
            >
              {loading ? 'Please wait...' : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={() => setSignupStage('method')}
              className="w-full text-blue-600 text-sm font-semibold py-2"
            >
              Back
            </button>
          </form>
        )}

        {/* Phone Signup Form */}
        {mode === 'signup' && signupStage === 'details' && authMethod === 'phone' && (
          <form onSubmit={handlePhoneSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Your full name"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="080XXXXXXXX or +234..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
              <p className="text-xs text-gray-500 mt-1">You'll receive an OTP via SMS</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    role === 'buyer'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <ShoppingBag size={20} />
                  Buy Items
                </button>
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    role === 'seller'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Store size={20} />
                  Sell Items
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs rounded-lg p-3 border border-red-200">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-60 text-sm shadow-md"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <button
              type="button"
              onClick={() => setSignupStage('method')}
              className="w-full text-blue-600 text-sm font-semibold py-2"
            >
              Back
            </button>
          </form>
        )}

        {/* Phone OTP Verification (Signup) */}
        {mode === 'signup' && signupStage === 'otp' && authMethod === 'phone' && (
          <form onSubmit={handlePhoneOtpVerify} className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">Enter the 6-digit code sent to {formatPhone(phone)}</p>
              <label className="block text-xs font-semibold text-gray-600 mb-1">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="000000"
                maxLength={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-center tracking-widest"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs rounded-lg p-3 border border-red-200">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-60 text-sm shadow-md"
            >
              {loading ? 'Verifying...' : 'Verify & Sign Up'}
            </button>

            <button
              type="button"
              onClick={() => {
                setSignupStage('details');
                setOtp('');
              }}
              className="w-full text-blue-600 text-sm font-semibold py-2"
            >
              Back
            </button>
          </form>
        )}

        {/* Phone OTP Verification (Login) */}
        {mode === 'login' && signupStage === 'otp' && authMethod === 'phone' && (
          <form onSubmit={handlePhoneLoginOtpVerify} className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">Enter the 6-digit code sent to {formatPhone(phone)}</p>
              <label className="block text-xs font-semibold text-gray-600 mb-1">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="000000"
                maxLength={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-center tracking-widest"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs rounded-lg p-3 border border-red-200">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-60 text-sm shadow-md"
            >
              {loading ? 'Verifying...' : 'Log In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setSignupStage('method');
                setOtp('');
              }}
              className="w-full text-blue-600 text-sm font-semibold py-2"
            >
              Back
            </button>
          </form>
        )}

        {/* Login Form */}
        {mode === 'login' && signupStage === 'method' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-semibold mb-4">How would you like to log in?</p>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setSignupStage('details');
              }}
              className="w-full border-2 border-blue-600 bg-blue-50 text-blue-700 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition"
            >
              <Mail size={20} />
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone');
                setSignupStage('details');
              }}
              className="w-full border-2 border-gray-300 bg-white text-gray-700 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
            >
              <Phone size={20} />
              Phone Number (OTP)
            </button>
          </div>
        )}

        {/* Login Details */}
        {mode === 'login' && signupStage === 'details' && authMethod === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Your password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs rounded-lg p-3 border border-red-200">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-60 text-sm shadow-md"
            >
              {loading ? 'Please wait...' : 'Log In'}
            </button>

            <button
              type="button"
              onClick={() => setSignupStage('method')}
              className="w-full text-blue-600 text-sm font-semibold py-2"
            >
              Back
            </button>
          </form>
        )}

        {/* Login with Phone OTP */}
        {mode === 'login' && signupStage === 'details' && authMethod === 'phone' && (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="080XXXXXXXX or +234..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
              <p className="text-xs text-gray-500 mt-1">You'll receive an OTP via SMS</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs rounded-lg p-3 border border-red-200">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-60 text-sm shadow-md"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <button
              type="button"
              onClick={() => setSignupStage('method')}
              className="w-full text-blue-600 text-sm font-semibold py-2"
            >
              Back
            </button>
          </form>
        )}
      </div>

      <p className="text-blue-100 text-xs mt-8 text-center max-w-sm">
        By continuing, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}
