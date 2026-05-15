import { useEffect, useState } from 'react';
import { Search, MapPin, Store } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Item, Category } from '../../lib/types';
import { CATEGORIES } from '../../lib/types';
import ItemCard from '../../components/ItemCard';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onItemClick: (item: Item) => void;
  setPage: (p: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Phones': '📱',
  'Clothes': '👕',
  'Farm Produce': '🌽',
  'Electronics': '💻',
  'Household': '🏠',
};

export default function HomePage({ onItemClick, setPage }: Props) {
  const { user } = useAuth();
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [error, setError] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [category, debouncedQuery]);

  const fetchItems = async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setFilteredItems([]);
    }

    try {
      const from = append ? filteredItems.length : 0;
      const to = from + 19;

      let query = supabase
        .from('items')
        .select('*, seller:profiles!seller_id(*)')
        .eq('is_active', true);

      // Apply category filter server-side
      if (category !== 'All') {
        query = query.eq('category', category);
      }

      // Apply search filter server-side
      if (debouncedQuery.trim()) {
        query = query.or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%,location.ilike.%${debouncedQuery}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching items:', error);
        return;
      }

      const newItems = (data as Item[]) ?? [];
      setHasMore(newItems.length === 20);

      if (append) {
        setFilteredItems((prev) => [...prev, ...newItems]);
      } else {
        setFilteredItems(newItems);
      }
    } catch (err) {
      console.error('Unexpected error fetching items:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchItems(true);
  };

  const handleMessageFromCard = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    setError('');
    if (!user) {
      setError('Please log in first to message sellers');
      return;
    }
    onItemClick(item);
  };

  return (
    <div className="pb-20 bg-gray-50">
      {/* Professional Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white sticky top-0 z-30 shadow-lg">
        <div className="px-4 pt-6 pb-5">
          {/* Logo and branding */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Store size={22} className="text-blue-600 font-bold" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold">Kaduna Mart</h1>
                <p className="text-blue-100 text-xs font-medium">Local Marketplace</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="flex items-center gap-1 text-blue-100">
                <MapPin size={14} />
                <span>Kaduna</span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <div className="flex items-center bg-white rounded-lg px-3.5 gap-2 shadow-sm">
              <Search size={16} className="text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, brands..."
                className="flex-1 bg-transparent py-3 text-sm outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
            {error && (
              <div className="mt-2 bg-red-50 text-red-600 text-xs rounded-lg p-2 border border-red-200">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-4 py-4 overflow-x-auto scrollbar-hide bg-white border-b border-gray-200">
        <button
          onClick={() => setCategory('All')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
            category === 'All'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}
        >
          All Items
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border-2 transition-all whitespace-nowrap ${
              category === c
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            <span className="text-sm">{CATEGORY_ICONS[c]}</span>
            {c}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 animate-pulse"
              >
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-2 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-200 rounded w-1/2" />
                  <div className="h-2 bg-gray-200 rounded w-full" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-400" />
            </div>
            <p className="font-bold text-gray-700 text-base">No items found</p>
            <p className="text-sm text-gray-500 mt-1.5">
              {searchQuery ? 'Try a different search term' : 'Try a different category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                onMessage={(e) => handleMessageFromCard(e, item)}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && filteredItems.length > 0 && hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-white border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl active:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {!loading && filteredItems.length > 0 && !hasMore && (
          <div className="text-center mt-6 text-sm text-gray-400">
            No more items to show
          </div>
        )}
      </div>
    </div>
  );
}
