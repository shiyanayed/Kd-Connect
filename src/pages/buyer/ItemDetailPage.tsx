import { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, MapPin, Eye, ChevronLeft, ChevronRight, Loader, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Item } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';

interface Props {
  item: Item;
  onBack: () => void;
  onChat: (conversationId: string) => void;
}

export default function ItemDetailPage({ item, onBack, onChat }: Props) {
  const { user, profile } = useAuth();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [starting, setStarting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);
  const [error, setError] = useState('');

  const photos = item.photos.length > 0
    ? item.photos
    : ['https://images.pexels.com/photos/4482900/pexels-photo-4482900.jpeg?auto=compress&cs=tinysrgb&w=600'];

  useEffect(() => {
    if (!user) return;
    supabase
      .from('favorites')
      .select('item_id')
      .eq('user_id', user.id)
      .eq('item_id', item.id)
      .maybeSingle()
      .then(({ data }) => setIsFavorited(!!data));
  }, [item.id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      setError('Please log in to save favorites');
      return;
    }
    setTogglingFav(true);
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('item_id', item.id);
      setIsFavorited(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, item_id: item.id } as never);
      setIsFavorited(true);
    }
    setTogglingFav(false);
  };

  useEffect(() => {
    supabase.rpc('increment_item_views', { item_id: item.id }).catch((err) => {
      console.error('Error incrementing item views:', err);
    });
  }, [item.id]);

  const handleMessageSeller = async () => {
    setError('');
    if (!user || !profile) {
      setError('Please log in first');
      return;
    }

    if (user.id === item.seller_id) {
      setError('You cannot message yourself');
      return;
    }

    setStarting(true);
    try {
      // Check if conversation already exists
      const { data: existing, error: existingError } = await supabase
        .from('conversations')
        .select('id')
        .eq('item_id', item.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', item.seller_id)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing conversation:', existingError);
        setError('Failed to start chat. Please try again.');
        return;
      }

      if (existing) {
        onChat(existing.id);
        return;
      }

      // Create new conversation
      const { data: newConv, error: insertError } = await supabase
        .from('conversations')
        .insert({
          item_id: item.id,
          buyer_id: user.id,
          seller_id: item.seller_id,
        } as never)
        .select('id')
        .single();

      if (insertError) {
        console.error('Conv error:', insertError);
        setError('Failed to start chat. Please try again.');
        return;
      }

      if (newConv?.id) {
        onChat(newConv.id);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error starting chat. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const isSeller = user?.id === item.seller_id;

  return (
    <ErrorBoundary>
      <div className="pb-24 min-h-screen bg-white">
      {/* Photo carousel */}
      <div className="relative bg-gray-100 aspect-square max-h-96 overflow-hidden">
        <img
          src={photos[photoIdx]}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        {/* Nav arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
              disabled={photoIdx === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 disabled:opacity-20 transition-all"
              title="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))}
              disabled={photoIdx === photos.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 disabled:opacity-20 transition-all"
              title="Next"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${
                    i === photoIdx ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-colors"
          aria-label="Go back to home"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Title + price */}
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full inline-block">
              {item.category}
            </span>
            <button 
              onClick={toggleFavorite}
              disabled={togglingFav}
              className={`p-2 rounded-full transition-all ${
                isFavorited ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
              }`}
              aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
            >
              <Heart size={20} fill={isFavorited ? "currentColor" : "none"} aria-hidden="true" />
            </button>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-2.5">{item.title}</h1>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">
            ₦{Number(item.price).toLocaleString()}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <MapPin size={16} />
            <span>{item.location || 'Kaduna'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye size={16} />
            <span>{item.views} views</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Description */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-2">About this item</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
        </div>

        {/* Seller info */}
        {item.seller && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-white text-base flex-shrink-0">
                {item.seller.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{item.seller.full_name}</p>
                <p className="text-xs text-gray-400 font-medium">Seller</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      {!isSeller && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-bottom shadow-lg">
          {error && (
            <div className="bg-red-50 text-red-600 text-xs rounded-lg p-2 mb-2 border border-red-200">
              {error}
            </div>
          )}
          <button
            onClick={handleMessageSeller}
            disabled={starting}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg text-base"
            aria-busy={starting}
          >
            {starting ? (
              <>
                <Loader size={20} className="animate-spin" />
                Opening chat...
              </>
            ) : (
              <>
                <MessageCircle size={20} />
                Message Seller
              </>
            )}
          </button>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
