import { useEffect, useState, useCallback } from 'react';
import { Heart, ArrowLeft, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Item } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';
import ItemCard from '../../components/ItemCard';
import ErrorBoundary from '../../components/ErrorBoundary';

interface Props {
  onItemClick: (item: Item) => void;
  onBack: () => void;
}

export default function FavoritesPage({ onItemClick, onBack }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      // Fetch favorited items by joining the favorites table with items
      const { data, error: fetchError } = await supabase
        .from('favorites')
        .select(`
          item:items!item_id(
            *,
            seller:profiles!seller_id(*)
          )
        `)
        .eq('user_id', user.id)
        .eq('item:items.is_active', true); // Only show active items

      if (fetchError) throw fetchError;

      // Filter out any null items (in case an item was deleted but remains in favorites)
      // and flatten the result
      const favoritedItems = (data || [])
        .map((f: any) => f.item)
        .filter((item) => item !== null) as Item[];

      setItems(favoritedItems);
    } catch (err: any) {
      console.error('Error loading favorites:', err);
      setError('Failed to load your favorite items');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleMessageFromCard = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    onItemClick(item);
  };

  const removeFromFavorites = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', itemId);

      if (deleteError) throw deleteError;
      // Optimistically update the UI by removing the item from local state
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  return (
    <ErrorBoundary>
      <div className="pb-20 min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 px-4 pt-6 pb-4 shadow-sm sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
          <button onClick={onBack} className="p-1 -ml-1 text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800 rounded-lg">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">My Favorites</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Saved items you love</p>
          </div>
        </div>

        <div className="px-4 py-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-center justify-between mb-6 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
              <button 
                onClick={loadFavorites} 
                className="flex items-center gap-1.5 font-bold hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 animate-pulse"
                >
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-200 rounded w-full" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                    <div className="h-10 bg-gray-200 rounded-xl mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={28} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-700 text-base">No favorites yet</p>
              <p className="text-sm text-gray-500 mt-1.5 mb-6">
                Save items you're interested in to view them later.
              </p>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-blue-100"
              >
                <ShoppingBag size={18} />
                Explore Items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <div key={item.id} className="relative group">
                  <ItemCard
                    item={item}
                    onClick={() => onItemClick(item)}
                    onMessage={(e) => handleMessageFromCard(e, item)}
                  />
                  <button
                    onClick={(e) => removeFromFavorites(e, item.id)}
                    className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-red-500 hover:bg-white active:scale-90 transition-all z-20"
                    title="Remove from favorites"
                  >
                    <Heart size={16} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}