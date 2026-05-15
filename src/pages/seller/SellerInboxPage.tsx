import { useEffect, useState } from 'react';
import { Inbox, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Conversation } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onOpenChat: (id: string) => void;
}

export default function SellerInboxPage({ onOpenChat }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const { data, error } = await supabase
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

        if (error) {
          console.error('Error fetching conversations:', error);
        }
        setConversations((data as Conversation[]) ?? []);
      } catch (err) {
        console.error('Unexpected error loading conversations:', err);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

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
  }, [user]);

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-30">
        <h1 className="text-2xl font-extrabold text-gray-900">Inbox</h1>
        <p className="text-sm text-gray-500 mt-0.5">Messages from buyers</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size={28} className="animate-spin text-orange-500" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox size={28} className="text-gray-300" />
          </div>
          <p className="font-bold text-gray-600 text-base">No messages yet</p>
          <p className="text-sm text-gray-400 mt-1.5">Buyers will contact you here when interested in your items</p>
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-2">
          {conversations.map((conv) => {
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
