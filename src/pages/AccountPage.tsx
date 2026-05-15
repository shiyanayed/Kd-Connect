import { useState } from 'react';
import { LogOut, RefreshCw, User, Phone, Mail, Store, ShoppingBag, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Props {
  setPage: (p: string) => void;
}

export default function AccountPage({ setPage }: Props) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [switching, setSwitching] = useState(false);

  const switchRole = async (role: 'buyer' | 'seller') => {
    if (!user || !profile || profile.active_role === role) return;
    if (role === 'seller' && !profile.is_seller) return;
    setSwitching(true);
    await supabase.from('profiles').update({ active_role: role }).eq('id', user.id);
    await refreshProfile();
    setSwitching(false);
    setPage(role === 'seller' ? 'dashboard' : 'home');
  };

  const enableSellerRole = async () => {
    if (!user || !profile) return;
    setSwitching(true);
    await supabase.from('profiles').update({ is_seller: true, active_role: 'seller' }).eq('id', user.id);
    await refreshProfile();
    setSwitching(false);
    setPage('dashboard');
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      <div className="bg-white px-4 pt-6 pb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-md">
            {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">{profile?.full_name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mt-1 ${
              profile?.active_role === 'seller'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {profile?.active_role === 'seller' ? 'Seller Account' : 'Buyer Account'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {/* Account info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Account Details</p>
          </div>
          {[
            { icon: User, label: 'Full Name', value: profile?.full_name ?? '' },
            { icon: Mail, label: 'Email', value: user?.email ?? '' },
            { icon: Phone, label: 'Phone', value: profile?.phone || 'Not set' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
              <Icon size={16} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Switch role */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Switch Account Type</p>
          </div>
          <div className="p-4 flex gap-3">
            <button
              onClick={() => switchRole('buyer')}
              disabled={switching || profile?.active_role === 'buyer'}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                profile?.active_role === 'buyer'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              <ShoppingBag size={20} />
              Buyer
              {profile?.active_role === 'buyer' && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Active</span>
              )}
            </button>

            {profile?.is_seller ? (
              <button
                onClick={() => switchRole('seller')}
                disabled={switching || profile?.active_role === 'seller'}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  profile?.active_role === 'seller'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                <Store size={20} />
                Seller
                {profile?.active_role === 'seller' && (
                  <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">Active</span>
                )}
              </button>
            ) : (
              <button
                onClick={enableSellerRole}
                disabled={switching}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-400 transition-all active:bg-gray-50"
              >
                <Store size={20} />
                Become a Seller
              </button>
            )}
          </div>

          {switching && (
            <div className="px-4 pb-3 flex items-center gap-2 text-xs text-gray-500">
              <RefreshCw size={12} className="animate-spin" />
              Switching account...
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 flex items-center gap-3 text-red-500 active:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          <span className="font-semibold text-sm">Sign Out</span>
          <ChevronRight size={16} className="ml-auto" />
        </button>
      </div>
    </div>
  );
}
