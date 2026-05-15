import { useState } from 'react';
import { ArrowLeft, Camera, X, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES } from '../../lib/types';
import type { Category } from '../../lib/types';
import ErrorBoundary from '../../components/ErrorBoundary';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const KADUNA_AREAS = [
  'Kaduna Central', 'Barnawa', 'Kakuri', 'Tudun Wada', 'Ungwan Rimi',
  'Malali', 'Ungwan Sarki', 'Sabo Tasha', 'Chikun', 'Zaria'
];

export default function PostItemPage({ onBack, onSuccess }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Phones');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const addPhoto = () => {
    if (!photoUrl.trim() || photos.length >= 5) return;
    
    // Basic URL validation
    try {
      new URL(photoUrl.trim());
      setPhotos((p) => [...p, photoUrl.trim()]);
      setPhotoUrl('');
    } catch {
      setError('Please enter a valid image URL');
    }
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    // Validation
    if (photos.length === 0) {
      setError('Please add at least one photo');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }

    setSubmitting(true);

    try {
      const { error: err } = await supabase.from('items').insert({
        seller_id: user.id,
        title: title.trim(),
        price: parseFloat(price),
        description: description.trim(),
        category,
        location: location.trim(),
        photos,
        is_active: true,
      } as never);

      if (err) {
        console.error('Error posting item:', err);
        setError(err.message);
      } else {
        setDone(true);
        setTimeout(() => { setDone(false); onSuccess(); }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error posting item:', err);
      setError('Failed to post item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900">Item Posted!</h2>
        <p className="text-sm text-gray-500 mt-1 text-center">Your item is now live for buyers to see.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="pb-24 min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-30">
        <button onClick={onBack} className="p-1 -ml-1 text-gray-600">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-extrabold text-gray-900">Post New Item</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 mt-4 space-y-4">
        {/* Photos */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Camera size={16} className="text-orange-500" />
            Photos (up to 5)
          </label>
          <div className="flex gap-2 flex-wrap mb-3">
            {photos.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          {photos.length < 5 && (
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Paste image URL (from pexels.com etc.)"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={addPhoto}
                disabled={!photoUrl.trim()}
                className="bg-orange-500 text-white px-3 rounded-xl text-sm font-semibold disabled:opacity-40"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Item Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={80}
              placeholder="e.g. Samsung Galaxy A15"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Price (₦) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              placeholder="e.g. 50000"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Location *</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">Select area in Kaduna</option>
              {KADUNA_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              maxLength={500}
              placeholder="Describe your item — condition, size, age, etc."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{description.length}/500</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs rounded-xl p-3">{error}</div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-bottom">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-sm transition-all disabled:opacity-60 shadow-lg shadow-orange-200 active:bg-orange-600"
          >
            {submitting ? 'Posting...' : 'Post Item'}
          </button>
        </div>
      </form>
      </div>
    </ErrorBoundary>
  );
}
