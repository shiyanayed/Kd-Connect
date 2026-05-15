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
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [roleConfirm, setRoleConfirm] = useState<'buyer' | 'seller' | null>(null);
  const [showEnableSellerConfirm, setShowEnableSellerConfirm] = useState(false);

  const switchRole = async (role: 'buyer' | 'seller') => {
    if (!user || !profile || profile.active_role === role) return;
    if (role === 'seller' && !profile.is_seller) return;
    setRoleConfirm(role);
  };

  const confirmRoleSwitch = async () => {
    if (!roleConfirm || !user || !profile) return;
    setSwitching(true);
    try {
      const { error } = await supabase.from('profiles').update({ active_role: roleConfirm } as never).eq('id', user.id);
      if (error) {
        console.error('Error switching role:', error);
        return;
      }
      await refreshProfile();
      setPage(roleConfirm === 'seller' ? 'dashboard' : 'home');
    } catch (err) {
      console.error('Unexpected error switching role:', err);
    } finally {
      setSwitching(false);
      setRoleConfirm(null);
    }
  };

  const enableSellerRole = async () => {
    if (!user || !profile) return;
    setShowEnableSellerConfirm(true);
  };

  const confirmEnableSeller = async () => {
    if (!user || !profile) return;
    setSwitching(true);
    try {
      const { error } = await supabase.from('profiles').update({ is_seller: true, active_role: 'seller' } as never).eq('id', user.id);
      if (error) {
        console.error('Error enabling seller role:', error);
        return;
      }
      await refreshProfile();
      setPage('dashboard');
    } catch (err) {
      console.error('Unexpected error enabling seller role:', err);
    } finally {
      setSwitching(false);
      setShowEnableSellerConfirm(false);
    }
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
              } ${switching ? 'opacity-50' : ''}`}
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
                } ${switching ? 'opacity-50' : ''}`}
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
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-400 transition-all active:bg-gray-50 ${switching ? 'opacity-50' : ''}`}
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
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 flex items-center gap-3 text-red-500 active:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          <span className="font-semibold text-sm">Sign Out</span>
          <ChevronRight size={16} className="ml-auto" />
        </button>
      </div>

      {/* Sign Out Confirmation Dialog */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <LogOut size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Sign Out</h3>
                <p className="text-sm text-gray-500">Are you sure you want to sign out of your account?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl active:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  signOut();
                  setShowSignOutConfirm(false);
                }}
                className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-xl active:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Switch Confirmation Dialog */}
      {roleConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                {roleConfirm === 'buyer' ? <ShoppingBag size={24} className="text-blue-600" /> : <Store size={24} className="text-orange-600" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  Switch to {roleConfirm === 'buyer' ? 'Buyer' : 'Seller'} Account
                </h3>
                <p className="text-sm text-gray-500">
                  {roleConfirm === 'buyer' 
                    ? 'You will be able to browse and message sellers.' 
                    : 'You will be able to manage your items and respond to buyers.'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRoleConfirm(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl active:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleSwitch}
                disabled={switching}
                className="flex-1 bg-blue-500 text-white font-semibold py-3 rounded-xl active:bg-blue-600 transition-colors disabled:opacity-60"
              >
                {switching ? 'Switching...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enable Seller Confirmation Dialog */}
      {showEnableSellerConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Store size={24} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Become a Seller</h3>
                <p className="text-sm text-gray-500">You'll be able to post items and sell to buyers in Kaduna.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEnableSellerConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl active:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnableSeller}
                disabled={switching}
                className="flex-1 bg-orange-500 text-white font-semibold py-3 rounded-xl active:bg-orange-600 transition-colors disabled:opacity-60"
              >
                {switching ? 'Enabling...' : 'Become Seller'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
