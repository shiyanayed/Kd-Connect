import { useEffect, useState, useCallback } from 'react';
import { Inbox, Loader, Trash2, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Conversation } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';

interface Props {
  onOpenChat: (id: string) => void;
}

export default function SellerInboxPage({ onOpenChat }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select(
          `
          id,
          item_id,
          buyer_id,
          seller_id,
          created_at,
          item:items!item_id(id, title, price, photos),
          buyer:profiles!buyer_id(id, full_name, avatar_url),
          seller:profiles!seller_id(id, full_name, avatar_url)
          `
        )
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setConversations((data as Conversation[]) ?? []);
    } catch (err: any) {
      console.error('Unexpected error loading conversations:', err);
      setError(err.message || 'Failed to load inbox');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();

    // Subscribe to new conversations
    const channel = supabase
      .channel(`seller-inbox-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `seller_id.eq.${user.id}`,
        },
        () => {
          load();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIPTION_ERROR' || status === 'TIMED_OUT') {
          console.error('Subscription error:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation? All associated messages will be removed.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        setError(error.message);
        return;
      }

      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
    } catch (err) {
      console.error('Unexpected error deleting conversation:', err);
      setError('Failed to delete conversation. Please try again.');
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.buyer?.full_name?.toLowerCase().includes(searchLower) ||
      conv.item?.title?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <ErrorBoundary>
      <div className="pb-20 min-h-screen bg-gray-50">
        <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-30">
          <h1 className="text-2xl font-extrabold text-gray-900">Inbox</h1>
          <p className="text-sm text-gray-500 mt-0.5">Messages from buyers</p>
          
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search buyers or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {error && (
          <div className="px-4 mt-4">
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={load}
                className="flex items-center gap-1.5 font-bold hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="px-4 mt-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/6" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="w-5 h-5 bg-gray-200 rounded-lg flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 && searchQuery === '' ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox size={28} className="text-gray-300" />
            </div>
            <p className="font-bold text-gray-600 text-base">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1.5">Buyers will contact you here when interested in your items</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-20 px-6 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No results found for your search</p>
          </div>
        ) : (
          <div className="px-4 mt-4 space-y-2">
            {filteredConversations.map((conv) => {
              const photo = conv.item?.photos?.[0];

              return (
                <button
                  key={conv.id}
                  onClick={() => onOpenChat(conv.id)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 active:bg-gray-50 hover:shadow-md transition-all text-left"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center font-bold text-white text-sm">
                      {conv.buyer?.full_name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    {photo && (
                      <img
                        src={photo}
                        alt=""
                        className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-lg object-cover border-2 border-white shadow-sm"
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{conv.buyer?.full_name ?? 'Buyer'}</p>
                    <p className="text-xs text-gray-500 truncate">Re: {conv.item?.title ?? 'Item'}</p>
                    {conv.item?.price && (
                      <p className="text-xs text-orange-600 font-bold mt-0.5">
                        ₦{Number(conv.item.price).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <span className="text-xs text-gray-400 flex-shrink-0 font-medium">
                    {new Date(conv.created_at).toLocaleDateString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}          