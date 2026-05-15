import { useEffect, useState } from 'react';
import { Eye, ToggleLeft, ToggleRight, PlusCircle, MapPin, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Item } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';

interface Props {
  setPage: (p: string) => void;
}

export default function MyItemsPage({ setPage }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching items:', error);
        }
        setItems((data as Item[]) ?? []);
      } catch (err) {
        console.error('Unexpected error loading items:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const toggleActive = async (item: Item) => {
    setConfirmToggle(item);
  };

  const confirmToggleAction = async () => {
    if (!confirmToggle) return;
    setToggling(confirmToggle.id);
    try {
      const { error } = await supabase.from('items').update({ is_active: !confirmToggle.is_active } as never).eq('id', confirmToggle.id);
      if (error) {
        console.error('Error toggling item:', error);
        return;
      }
      setItems((prev) => prev.map((i) => i.id === confirmToggle.id ? { ...i, is_active: !i.is_active } : i));
    } catch (err) {
      console.error('Unexpected error toggling item:', err);
    } finally {
      setToggling(null);
      setConfirmToggle(null);
    }
  };

  const handleDelete = (item: Item) => {
    setConfirmDelete(item);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id);
    setError('');
    try {
      const { error } = await supabase.from('items').delete().eq('id', confirmDelete.id);
      if (error) {
        console.error('Error deleting item:', error);
        setError(error.message);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== confirmDelete.id));
    } catch (err) {
      console.error('Unexpected error deleting item:', err);
      setError('Failed to delete item. Please try again.');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  return (
    <ErrorBoundary>
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
                <div className="flex gap-2">
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
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deleting === item.id}
                    className="flex-shrink-0 self-center text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmToggle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle size={24} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {confirmToggle.is_active ? 'Pause Item' : 'Activate Item'}
                </h3>
                <p className="text-sm text-gray-500">
                  {confirmToggle.is_active
                    ? 'This will hide your item from buyers. You can activate it again later.'
                    : 'This will make your item visible to buyers.'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmToggle(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl active:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleAction}
                disabled={toggling === confirmToggle.id}
                className="flex-1 bg-orange-500 text-white font-semibold py-3 rounded-xl active:bg-orange-600 transition-colors disabled:opacity-60"
              >
                {toggling === confirmToggle.id ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Delete Item</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{confirmDelete.title}"? This action cannot be undone.
                </p>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 text-red-700 text-xs rounded-lg p-3 mb-4 border border-red-200">{error}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmDelete(null);
                  setError('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl active:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                disabled={deleting === confirmDelete.id}
                className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-xl active:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting === confirmDelete.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
