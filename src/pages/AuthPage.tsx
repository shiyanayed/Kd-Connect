import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Eye, EyeOff, Store } from 'lucide-react';

type Mode = 'login' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
      } else if (data.user) {
        const { error: pErr } = await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: fullName,
          phone,
          is_buyer: role === 'buyer' || role === 'buyer',
          is_seller: role === 'seller',
          active_role: role,
          subscription_active: false,
        });
        if (pErr) setError(pErr.message);
      }
    }
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
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
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
                  placeholder="080XXXXXXXX"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              {/* Role selector */}
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
                {role === 'seller' && (
                  <p className="text-xs text-orange-700 mt-2 bg-orange-50 rounded-lg p-2 border border-orange-200">
                    Seller accounts require a monthly subscription to post items.
                  </p>
                )}
              </div>
            </>
          )}

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

          {error && (
            <div className="bg-red-50 text-red-700 text-xs rounded-lg p-3 border border-red-200">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-60 text-sm shadow-md"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="text-blue-100 text-xs mt-8 text-center max-w-sm">
        By continuing, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}
