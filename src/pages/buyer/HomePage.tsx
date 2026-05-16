import { useEffect, useState } from 'react';
import { Search, MapPin, Store, RefreshCw, AlertCircle, MessageSquare, Moon, Sun } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Item, Category } from '../../lib/types';
import { CATEGORIES } from '../../lib/types';
import ItemCard from '../../components/ItemCard';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';
import { CATEGORY_ICONS, KADUNA_AREAS } from '../../lib/constants';

interface Props {
  onItemClick: (item: Item) => void;
  setPage: (p: string) => void;
}

export default function HomePage({ onItemClick, setPage }: Props) {
  const { user } = useAuth();
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [location, setLocation] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState<{ body: string; id: string } | null>(null);
  
  // Dark mode state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });

  // Pull to refresh state
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Real-time message notification listener
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('inbound-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id.eq.${user.id}`,
        },
        (payload) => {
          setNewMessage({ body: payload.new.body, id: payload.new.conversation_id });
          // Auto-hide after 6 seconds
          setTimeout(() => setNewMessage(null), 6000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [category, debouncedQuery, location]);

  // Sync dark mode class on mount and state change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  const fetchItems = async (append = false) => {
    setError('');
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

      // Apply location filter server-side
      if (location !== 'All') {
        query = query.eq('location', location);
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
        setError('Unable to fetch items. Please check your connection.');
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
      setError('An unexpected error occurred. Please try again.');
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

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) setStartY(e.touches[0].clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY !== 0) return;
    const currentY = e.touches[0].clientY;
    if (currentY > startY + 80) {
      setIsPulling(true);
    }
  };
  const handleTouchEnd = () => {
    if (isPulling) {
      fetchItems();
      setIsPulling(false);
    }
  };

  return (
    <ErrorBoundary>
      {/* Floating Notification */}
      {newMessage && (
        <div className="fixed top-24 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <button 
            onClick={() => { setPage('inbox'); setNewMessage(null); }}
            className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
            aria-label={`New message received: ${newMessage.body}. Click to view inbox.`}
          >
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare size={20} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-blue-400">New Message Received</p>
              <p className="text-sm truncate opacity-90">{newMessage.body}</p>
            </div>
          </button>
        </div>
      )}

      <div 
        className="pb-20 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      {/* Professional Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-gray-800 dark:to-gray-900 text-white sticky top-0 z-30 shadow-lg">
        <div className="px-4 pt-6 pb-4">
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
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleDarkMode} 
                className="p-2 bg-white/10 rounded-lg backdrop-blur-sm"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              </button>
              <div className="text-right text-sm">
                <div className="flex items-center gap-1 text-blue-100">
                  <MapPin size={14} />
                  <span>Kaduna</span>
                </div>
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
                className="flex-1 bg-transparent py-3 text-sm outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400"
                aria-label="Search items and brands"
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

      {/* Pull to refresh indicator */}
      {isPulling && (
        <div className="flex justify-center py-4 text-blue-600 dark:text-blue-400">
          <RefreshCw size={24} className="animate-spin" />
        </div>
      )}

      {/* Category pills */}
      <div className="flex gap-2 px-4 py-4 overflow-x-auto scrollbar-hide bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setCategory('All')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
            category === 'All'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-blue-400'
          }`}
          aria-pressed={category === 'All'}
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
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-blue-400'
            }`}
            aria-pressed={category === c}
          >
            <span className="text-sm" aria-hidden="true">{CATEGORY_ICONS[c]}</span>
            {c}
          </button>
        ))}
      </div>

      {/* Location Filter */}
      <div className="px-4 pt-4">
        <select 
          value={location} 
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          aria-label="Filter items by Kaduna area"
        >
          <option value="All">All Kaduna Areas</option>
          {KADUNA_AREAS.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      {/* Items grid */}
      <div className="px-4 py-6">
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center justify-between mb-6 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => fetchItems()} 
              className="flex items-center gap-1.5 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              aria-label="Retry loading items"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse"
              >
                <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-200 text-base">No items found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              {searchQuery ? 'Try a different search term' : 'Try a different category'}
            </p>
          </div>
        ) : (
          // Empty state for no items at all
          filteredItems.length === 0 && searchQuery === '' && category === 'All' ? (
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store size={28} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="font-bold text-gray-700 dark:text-gray-200 text-base">No items listed yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Check back later or try a different category.</p>
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
          )
        )}

        {/* Load More Button */}
        {!loading && filteredItems.length > 0 && hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-white border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl active:bg-gray-50 transition-colors disabled:opacity-50"
              aria-busy={loadingMore}
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
    </ErrorBoundary>
  );
}
