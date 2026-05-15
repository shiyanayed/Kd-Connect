import { useEffect, useState } from 'react';
import { Eye, MessageCircle, Package, TrendingUp, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';

interface Stats {
  totalItems: number;
  totalViews: number;
  totalMessages: number;
}

interface Props {
  setPage: (p: string) => void;
}

export default function DashboardPage({ setPage }: Props) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalItems: 0, totalViews: 0, totalMessages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [itemsRes, convsRes] = await Promise.all([
          supabase.from('items').select('id, views').eq('seller_id', user.id).eq('is_active', true),
          supabase.from('conversations').select('id').eq('seller_id', user.id),
        ]);

        if (itemsRes.error) {
          console.error('Error fetching items:', itemsRes.error);
        }
        if (convsRes.error) {
          console.error('Error fetching conversations:', convsRes.error);
        }

        const items = itemsRes.data ?? [];
        const totalViews = items.reduce((s, i) => s + (i.views ?? 0), 0);
        setStats({
          totalItems: items.length,
          totalViews,
          totalMessages: convsRes.data?.length ?? 0,
        });
      } catch (err) {
        console.error('Unexpected error loading stats:', err);
        setStats({ totalItems: 0, totalViews: 0, totalMessages: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const statCards = [
    { label: 'Active Listings', value: stats.totalItems, icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'bg-green-50 text-green-600' },
    { label: 'Conversations', value: stats.totalMessages, icon: MessageCircle, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <ErrorBoundary>
      <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-5 shadow-sm">
        <p className="text-sm text-gray-500">Welcome back,</p>
        <h1 className="text-xl font-extrabold text-gray-900">{profile?.full_name ?? 'Seller'}</h1>
        {!profile?.subscription_active && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <TrendingUp size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-700">Activate your seller account</p>
              <p className="text-xs text-amber-600 mt-0.5">Subscribe to start posting items and reaching buyers.</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
                <Icon size={18} />
              </div>
              {loading ? (
                <div className="h-6 bg-gray-200 rounded-md w-12 mx-auto animate-pulse my-0.5" />
              ) : (
                <p className="text-xl font-extrabold text-gray-900">{value.toLocaleString()}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPage('post')}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-3 text-sm font-semibold active:bg-orange-700 transition-colors"
            >
              <PlusCircle size={18} />
              Post Item
            </button>
            <button
              onClick={() => setPage('my-items')}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 rounded-xl px-4 py-3 text-sm font-semibold active:bg-gray-200 transition-colors"
            >
              <Package size={18} />
              My Items
            </button>
            <button
              onClick={() => setPage('inbox')}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 rounded-xl px-4 py-3 text-sm font-semibold active:bg-gray-200 transition-colors col-span-2"
            >
              <MessageCircle size={18} />
              View Messages
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Tips to sell faster</h2>
          <ul className="space-y-2 text-xs text-gray-600">
            {[
              'Add clear, well-lit photos of your items',
              'Write accurate descriptions with all details',
              'Set competitive prices based on market rates',
              'Respond to buyers quickly to close deals',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
}
