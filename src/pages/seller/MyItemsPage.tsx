import { useEffect, useState } from 'react';
import { Eye, ToggleLeft, ToggleRight, PlusCircle, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Item } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';

interface Props {
  setPage: (p: string) => void;
}

export default function MyItemsPage({ setPage }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('items')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      setItems((data as Item[]) ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleActive = async (item: Item) => {
    setToggling(item.id);
    await supabase.from('items').update({ is_active: !item.is_active }).eq('id', item.id);
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    setToggling(null);
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      <div className="bg-white px-4 pt-5 pb-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900">My Items</h1>
        <button
          onClick={() => setPage('post')}
          className="flex items-center gap-1.5 bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-xl active:bg-orange-600 transition-colors"
        >
          <PlusCircle size={14} />
          Add New
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 px-4 mt-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex gap-3 animate-pulse">
              <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusCircle size={28} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-600">No items yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Start selling by posting your first item</p>
          <button
            onClick={() => setPage('post')}
            className="bg-orange-500 text-white text-sm font-bold px-6 py-3 rounded-xl"
          >
            Post First Item
          </button>
        </div>
      ) : (
        <div className="px-4 mt-3 space-y-3">
          {items.map((item) => {
            const photo = item.photos[0] ?? 'https://images.pexels.com/photos/4482900/pexels-photo-4482900.jpeg?auto=compress&cs=tinysrgb&w=200';
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-3 flex gap-3 shadow-sm border transition-opacity ${
                  item.is_active ? 'border-gray-100 opacity-100' : 'border-gray-100 opacity-60'
                }`}
              >
                <img
                  src={photo}
                  alt={item.title}
                  className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{item.title}</h3>
                  <p className="text-orange-600 font-extrabold text-sm mt-0.5">₦{Number(item.price).toLocaleString()}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-0.5"><Eye size={11} /> {item.views}</span>
                    <span className="flex items-center gap-0.5"><MapPin size={11} /> {item.location}</span>
                  </div>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1.5 font-semibold ${
                    item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <button
                  onClick={() => toggleActive(item)}
                  disabled={toggling === item.id}
                  className="flex-shrink-0 self-center text-gray-400 transition-colors"
                >
                  {item.is_active
                    ? <ToggleRight size={28} className="text-green-500" />
                    : <ToggleLeft size={28} />
                  }
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
